import { IntegrationInvocationConfig } from '@jupiterone/integration-sdk-core';

import instanceConfigFields from './instanceConfigFields';
import validateInvocation from './validateInvocation';

import fetchAccounts from './steps/fetch-accounts';
import fetchZones from './steps/fetch-zones';
import { CloudflareIntegrationConfig } from './types';

export const invocationConfig: IntegrationInvocationConfig<CloudflareIntegrationConfig> =
  {
    instanceConfigFields,
    validateInvocation,
    integrationSteps: [fetchAccounts, fetchZones],
  };
