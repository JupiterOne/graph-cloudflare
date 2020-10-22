import {
  IntegrationExecutionContext,
  IntegrationValidationError,
} from '@jupiterone/integration-sdk-core';

import { createServicesClient } from './collector';
import { CloudflareIntegrationConfig } from './types';

export default async function validateInvocation(
  context: IntegrationExecutionContext<CloudflareIntegrationConfig>,
): Promise<void> {
  context.logger.info(
    {
      instance: context.instance,
    },
    'Validating integration config...',
  );

  if (await isConfigurationValid(context)) {
    context.logger.info('Integration instance is valid!');
  } else {
    throw new IntegrationValidationError(
      'Failed to authenticate with provided credentials',
    );
  }
}

async function isConfigurationValid(
  context: IntegrationExecutionContext<CloudflareIntegrationConfig>,
): Promise<boolean> {
  // perform test api call. This will fail if we do not have access.
  try {
    const client = createServicesClient(context);
    const response = await client.validateInvocation();
    return response;
  } catch (err) {
    return false;
  }
}
