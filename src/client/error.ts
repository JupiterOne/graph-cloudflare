import { Response } from 'node-fetch';

import {
  IntegrationProviderAPIError,
  IntegrationProviderAuthenticationError,
  IntegrationProviderAuthorizationError,
} from '@jupiterone/integration-sdk-core';

export class RetryableIntegrationProviderApiError extends IntegrationProviderAPIError {
  retryable = true;
}

export function retryableRequestError(
  url: string,
  response: Response,
): RetryableIntegrationProviderApiError {
  return new RetryableIntegrationProviderApiError({
    endpoint: url,
    status: response.status,
    statusText: response.statusText ?? response.status,
  });
}

export function fatalRequestError(
  url: string,
  response: Response,
): IntegrationProviderAPIError {
  const apiErrorOptions = {
    endpoint: url,
    status: response.status,
    statusText: response.statusText ?? response.status,
  };

  if (response.status === 401) {
    return new IntegrationProviderAuthenticationError(apiErrorOptions);
  } else if (response.status === 403) {
    return new IntegrationProviderAuthorizationError(apiErrorOptions);
  } else {
    return new IntegrationProviderAPIError(apiErrorOptions);
  }
}
