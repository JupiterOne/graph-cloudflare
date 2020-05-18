/* eslint-disable @typescript-eslint/camelcase */
import { retry } from '@lifeomic/attempt';
import nodeFetch, { Request } from 'node-fetch';

import { retryableRequestError, fatalRequestError } from './error';
import { CloudflareApiResponse, CloudflareObject } from './types';
import { URLSearchParams } from 'url';

const BASE_URL = 'https://api.cloudflare.com/client/v4/';

interface ServicesClientInput {
  apiToken: string;
}

/**
 * Services Api
 * https://api.cloudflare.com/
 */
export class ServicesClient {
  readonly apiToken: string;

  constructor(config: ServicesClientInput) {
    this.apiToken = config.apiToken;
  }

  listAccounts(): Promise<CloudflareObject[]> {
    return this.iterateAll('accounts');
  }

  listAccountMembers(accountId: string): Promise<CloudflareObject[]> {
    return this.iterateAll(`accounts/${accountId}/members`);
  }

  listAccountRoles(accountId: string): Promise<CloudflareObject[]> {
    return this.iterateAll(`accounts/${accountId}/roles`);
  }

  listZones(): Promise<object[]> {
    return this.iterateAll('zones');
  }

  listZoneRecords(zoneId: string): Promise<CloudflareObject[]> {
    return this.iterateAll(`zones/${zoneId}/dns_records`);
  }

  async iterateAll<T = object[]>(url: string): Promise<T> {
    const data = [];
    const limit = 500;
    let total = 0;
    let page = 1;
    do {
      const response: CloudflareApiResponse = await this.fetch(url, {
        page: page.toString(),
        per_page: limit.toString(),
      });
      total = response.result_info?.total_count || 0;
      page++;
      if (response.result?.length > 0) {
        data.push(...response.result);
      } else {
        break;
      }
    } while (page * limit < total);
    return (data as unknown) as T;
  }

  fetch<T = object>(
    url: string,
    queryParams: { [param: string]: string | string[] } = {},
    request?: Omit<Request, 'url'>,
  ): Promise<T> {
    return retry(
      async () => {
        const qs = new URLSearchParams(queryParams).toString();
        const response = await nodeFetch(
          `${BASE_URL}${url}${qs ? '?' + qs : ''}`,
          {
            ...request,
            headers: {
              Authorization: `Bearer ${this.apiToken}`,
              ...request?.headers,
            },
          },
        );

        /**
         * We are working with a json api, so just return the parsed data.
         */
        if (response.ok) {
          return response.json() as T;
        }

        if (isRetryableRequest(response)) {
          throw retryableRequestError(response);
        } else {
          throw fatalRequestError(response);
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
