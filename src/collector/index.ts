import {
  IntegrationExecutionContext,
  IntegrationValidationError,
} from '@jupiterone/integration-sdk-core';

import { IntegrationConfig } from '../config';
import { ServicesClient } from './ServicesClient';

/**
 * Creates a ServicesClient from an integration instance using it's
 * api key.
 */
export function createServicesClient(
  context: IntegrationExecutionContext<IntegrationConfig>,
): ServicesClient {
  const { apiToken } = context.instance.config;

  if (!apiToken) {
    throw new IntegrationValidationError(
      'Required configuration item "apiToken" is missing on the integration instance config',
    );
  }
  return new ServicesClient(context.instance.config, context.logger);
}
