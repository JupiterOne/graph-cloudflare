import { Response } from 'node-fetch';
import { IntegrationProviderAPIError } from '@jupiterone/integration-sdk-core';

export class RetryableIntegrationProviderApiError extends IntegrationProviderAPIError {
  retryable = true;
}

export function retryableRequestError(
  url: string,
  response: Response,
): RetryableIntegrationProviderApiError {
  return new RetryableIntegrationProviderApiError({
    cause: response,
    endpoint: url,
    status: response.status,
    statusText: response.statusText,
  });
}

export function fatalRequestError(
  url: string,
  response: Response,
): IntegrationProviderAPIError {
  return new IntegrationProviderAPIError({
    cause: response,
    endpoint: url,
    status: response.status,
    statusText: response.statusText,
  });
}
