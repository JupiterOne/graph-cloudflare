import {
  IntegrationExecutionContext,
  IntegrationValidationError,
} from '@jupiterone/integration-sdk-core';
import { ServicesClient } from './ServicesClient';
import { CloudflareIntegrationConfig } from '../types';

/**
 * Creates a ServicesClient from an integration instance using it's
 * api key.
 */
export function createServicesClient(
  context: IntegrationExecutionContext<CloudflareIntegrationConfig>,
): ServicesClient {
  const { apiToken } = context.instance.config;

  if (!apiToken) {
    throw new IntegrationValidationError(
      'Required configuration item "apiToken" is missing on the integration instance config',
    );
  }
  return new ServicesClient(context.instance.config, context.logger);
}
