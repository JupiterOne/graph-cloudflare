import {
  createMockStepExecutionContext,
  MockIntegrationStepExecutionContext,
} from '@jupiterone/integration-sdk-testing';

import { IntegrationConfig } from '../src/config';
import { integrationConfig } from './config';

export function createStepContext(): MockIntegrationStepExecutionContext<IntegrationConfig> {
  return createMockStepExecutionContext({
    instanceConfig: integrationConfig,
  });
}
