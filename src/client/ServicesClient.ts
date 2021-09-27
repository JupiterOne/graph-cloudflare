import nodeFetch, { Request } from 'node-fetch';
import { URLSearchParams } from 'url';

import {
  Account,
  AccountRole,
  APIResponseBody,
  DNSRecord,
  Zone,
} from '@cloudflare/types';
import { IntegrationLogger } from '@jupiterone/integration-sdk-core';
import { retry } from '@lifeomic/attempt';

import { IntegrationConfig } from '../config';
import { fatalRequestError, retryableRequestError } from './error';

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

  fetch<TCloudflareObject>(
    endpoint: string,
    queryParams: { page: string; per_page: string },
    request?: Omit<Request, 'url'>,
  ): Promise<APIResponseBody<TCloudflareObject[]>> {
    return retry(
      async () => {
        const qs = new URLSearchParams(queryParams).toString();
        const url = `${BASE_URL}${endpoint}?${qs}`;
        const response = await nodeFetch(url, {
          ...request,
          headers: {
            Authorization: `Bearer ${this.apiToken}`,
            ...request?.headers,
          },
        });

        /**
         * We are working with a json api, so just return the parsed data.
         */
        if (response.ok) {
          const results = response.json() as APIResponseBody<
            TCloudflareObject[]
          >;
          this.logger.info(
            {
              url,
              success: results.success,
              resultCount: results.result_info?.count,
            },
            'Received response from endpoint',
          );
          return results;
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
          if (err.retryable) return;
          if (err.code === 'ECONNRESET') return;
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
