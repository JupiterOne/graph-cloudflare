import nodeFetch, { Request, Response } from 'node-fetch';
import { URLSearchParams } from 'url';

import {
  Account,
  AccountRole,
  APIResponseBody,
  DNSRecord,
  Zone,
} from '@cloudflare/types';
import {
  IntegrationLogger,
  IntegrationWarnEventName,
} from '@jupiterone/integration-sdk-core';
import { retry } from '@lifeomic/attempt';

import { IntegrationConfig } from '../config';
import { fatalRequestError, retryableRequestError } from './error';
import { CloudflareIdentityProvider } from '../types';

const BASE_URL = 'https://api.cloudflare.com/client/v4/';

type CloudflareIteratee<T> = (obj: T) => void | Promise<void>;

export const DEFAULT_API_LIMIT = 500;

type RetryConfig = {
  maxAttempts: number;
  delay: number;
  factor: number;
  jitter: boolean;
};

type ClientConfig = {
  config: IntegrationConfig;
  logger: IntegrationLogger;
  retryConfig?: Partial<RetryConfig>;
};

/**
 * Services Api
 * https://api.cloudflare.com/
 */
export class ServicesClient {
  readonly retryConfig: RetryConfig;
  readonly apiToken: string;
  readonly logger: IntegrationLogger;
  readonly limit: number;

  constructor({ config, logger, retryConfig }: ClientConfig) {
    this.apiToken = config.apiToken;
    this.logger = logger;
    this.limit = DEFAULT_API_LIMIT;
    this.retryConfig = {
      maxAttempts: retryConfig?.maxAttempts ?? 10,
      delay: retryConfig?.delay ?? 200,
      factor: retryConfig?.factor ?? 2,
      jitter: retryConfig?.jitter ?? true,
    };
  }

  async iterateAccounts(iteratee: CloudflareIteratee<Account>): Promise<void> {
    await this.iterateAll('accounts', iteratee);
  }

  async iterateAccountMembers(
    accountId: string,
    iteratee: CloudflareIteratee<any>,
  ): Promise<void> {
    await this.iterateAll(`accounts/${accountId}/members`, iteratee);
  }

  async iterateAccountRoles(
    accountId: string,
    iteratee: CloudflareIteratee<AccountRole>,
  ): Promise<void> {
    await this.iterateAll(`accounts/${accountId}/roles`, iteratee);
  }

  async iterateZones(iteratee: CloudflareIteratee<Zone>): Promise<void> {
    await this.iterateAll('zones', iteratee);
  }

  async iterateZoneRecords(
    zoneId: string,
    iteratee: CloudflareIteratee<DNSRecord>,
  ): Promise<void> {
    await this.iterateAll(`zones/${zoneId}/dns_records`, iteratee);
  }

  async iterateIdentityProviders(
    accountId: string,
    iteratee: CloudflareIteratee<CloudflareIdentityProvider>,
  ): Promise<void> {
    try {
      // This doesn't need additional permissions currently, but if an account
      // doesn't have ZeroTrust enabled and configured in Cloudflare, we'll get
      // a 403 error.  Catching this so that customers who don't wish to use
      // this feature won't be negatively impacted.
      await this.iterateAll(
        `accounts/${accountId}/access/identity_providers`,
        iteratee,
      );
    } catch (err) {
      if (err.status == 403) {
        this.logger.warn(
          { accountId },
          `Unable to query identity provider information for account.  Skipping.`,
        );
        this.logger.publishWarnEvent({
          name: IntegrationWarnEventName.MissingPermission,
          description: `Unable to query identity provider information for account ${accountId}.  Skipping.`,
        });
      }
    }
  }

  async validateInvocation(): Promise<boolean> {
    // TODO: Consider using https://api.cloudflare.com/client/v4/user/tokens/verify
    const response = await this.fetch('accounts', {
      page: '1',
      per_page: '1',
    });
    return response.success;
  }

  async iterateAll<TCloudflareObject>(
    endpoint: string,
    iteratee: CloudflareIteratee<TCloudflareObject>,
  ): Promise<void> {
    let page = 0;
    let totalPages: number;
    do {
      page++;
      const response = await this.fetch<TCloudflareObject>(endpoint, {
        page: page.toString(),
        per_page: this.limit.toString(),
      });
      totalPages = response.result_info?.total_pages || 0;

      if (!response.result) break;
      for (const item of response.result) {
        await iteratee(item);
      }
    } while (page < totalPages);
  }

  async fetch<TCloudflareObject>(
    endpoint: string,
    queryParams: { page: string; per_page: string },
    request?: Omit<Request, 'url'>,
  ): Promise<APIResponseBody<TCloudflareObject[]>> {
    const qs = new URLSearchParams(queryParams).toString();
    const url = `${BASE_URL}${endpoint}?${qs}`;

    let attemptCount = 0;

    return await retry(
      async () => {
        let response: Response;

        try {
          response = await nodeFetch(url, {
            ...request,
            headers: {
              Authorization: `Bearer ${this.apiToken}`,
              ...request?.headers,
            },
          });
        } catch (err) {
          this.logger.info(
            { code: err.code, err, url },
            'Error sending request',
          );
          throw err;
        }

        this.logger.info(
          {
            url,
            hasResponse: !!response,
          },
          'Received response from endpoint',
        );

        /**
         * We are working with a json api, so just return the parsed data.
         */
        if (response.ok) {
          try {
            const results = (await response.json()) as APIResponseBody<
              TCloudflareObject[]
            >;
            this.logger.info(
              {
                url,
                success: results.success,
                resultCount: results.result_info?.count,
              },
              'Received json from endpoint',
            );
            return results;
          } catch (err) {
            this.logger.info(
              { code: err.code, err, url },
              'Error reading json body',
            );
            throw err;
          }
        }

        if (isRetryableRequest(response)) {
          throw retryableRequestError(url, response);
        } else {
          throw fatalRequestError(url, response);
        }
      },
      {
        ...this.retryConfig,
        handleError: (err, context) => {
          attemptCount++;
          this.logger.info(
            { url, attemptCount, code: err.code },
            'Handling request error',
          );
          if (err.retryable) return;
          if (err.code === 'ECONNRESET' || err.message.includes('ECONNRESET'))
            return;
          context.abort();
        },
      },
    );
  }
}

/**
 * Function for determining if a request is retryable
 * based on the returned status.
 */
function isRetryableRequest({ status }: Response): boolean {
  return (
    // 5xx error from provider (their fault, might be retryable)
    // 429 === too many requests, we got rate limited so safe to try again
    status >= 500 || status === 429
  );
}
