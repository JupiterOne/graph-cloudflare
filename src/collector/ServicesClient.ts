/* eslint-disable @typescript-eslint/camelcase */
import { retry } from '@lifeomic/attempt';
import nodeFetch, { Request } from 'node-fetch';

import { retryableRequestError, fatalRequestError } from './error';
import { URLSearchParams } from 'url';
import { CloudflareIntegrationConfig } from '../types';
import {
  Account,
  AccountMember,
  Zone,
  DNSRecord,
  APIResponseBody,
  AccountRole,
} from '@cloudflare/types';
import { IntegrationLogger } from '@jupiterone/integration-sdk-core';

const BASE_URL = 'https://api.cloudflare.com/client/v4/';

type CloudflareIteratee<T> = (obj: T) => void | Promise<void>;

export const DEFAULT_API_LIMIT = 500;

/**
 * Services Api
 * https://api.cloudflare.com/
 */
export class ServicesClient {
  readonly apiToken: string;
  readonly logger: IntegrationLogger;
  readonly limit: number;

  constructor(config: CloudflareIntegrationConfig, logger: IntegrationLogger) {
    this.apiToken = config.apiToken;
    this.logger = logger;
    this.limit = DEFAULT_API_LIMIT;
  }

  async iterateAccounts(iteratee: CloudflareIteratee<Account>): Promise<void> {
    await this.iterateAll('accounts', iteratee);
  }

  async iterateAccountMembers(
    accountId: string,
    iteratee: CloudflareIteratee<AccountMember>,
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
      if (response.result) {
        for (const item of response.result) {
          await iteratee(item);
        }
      } else {
        break;
      }
    } while (page < totalPages);
  }

  fetch<TCloudflareObject>(
    endpoint: string,
    queryParams: { [param: string]: string | string[] } = {},
    request?: Omit<Request, 'url'>,
  ): Promise<APIResponseBody<TCloudflareObject[]>> {
    return retry(
      async () => {
        const qs = new URLSearchParams(queryParams).toString();
        const url = `${BASE_URL}${endpoint}${qs ? '?' + qs : ''}`;
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
        maxAttempts: 10,
        delay: 200,
        factor: 2,
        jitter: true,
        handleError: (err, context) => {
          if (!err.retryable) {
            // can't retry this? just abort
            context.abort();
          }
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
