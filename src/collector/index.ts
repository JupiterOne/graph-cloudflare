import { IntegrationInstance } from '@jupiterone/integration-sdk-core';
import { ServicesClient } from './ServicesClient';
import { CloudflareIntegrationConfig } from '../types';

export * from './types';

/**
 * Creates a ServicesClient from an integration instance using it's
 * api key.
 */
export function createServicesClient(
  instance: IntegrationInstance<CloudflareIntegrationConfig>,
): ServicesClient {
  const { apiToken } = instance.config;

  if (!apiToken) {
    throw new Error(
      'Required configuration item "apiToken" is missing on the integration instance config',
    );
  }

  return new ServicesClient({ apiToken });
}
