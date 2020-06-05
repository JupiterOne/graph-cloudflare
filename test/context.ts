import {
  createMockStepExecutionContext,
  MockIntegrationStepExecutionContext,
} from '@jupiterone/integration-sdk-testing';
import { CloudflareIntegrationConfig } from '../src/types';

export function createStepContext(): MockIntegrationStepExecutionContext<
  CloudflareIntegrationConfig
> {
  return createMockStepExecutionContext({
    instanceConfig: {
      apiToken: process.env.API_TOKEN || 'test',
    },
  });
}
