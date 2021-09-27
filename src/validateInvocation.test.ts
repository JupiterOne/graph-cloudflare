import fetchMock from 'jest-fetch-mock';

import {
  IntegrationProviderAuthenticationError,
  IntegrationProviderAuthorizationError,
  IntegrationValidationError,
} from '@jupiterone/integration-sdk-core';
import { createMockExecutionContext } from '@jupiterone/integration-sdk-testing';

import { IntegrationConfig, validateInvocation } from './config';

beforeEach(() => {
  fetchMock.doMock();
});

test('missing apiToken', async () => {
  fetchMock.mockResponse('{}');

  const executionContext = createMockExecutionContext<IntegrationConfig>({
    instanceConfig: {
      apiToken: undefined as unknown as string,
    },
  });

  await expect(validateInvocation(executionContext)).rejects.toThrow(
    IntegrationValidationError,
  );
});

test('unauthorized', async () => {
  fetchMock.mockResponse(() =>
    Promise.resolve({
      status: 401,
      body: 'Unauthorized',
    }),
  );

  const executionContext = createMockExecutionContext<IntegrationConfig>({
    instanceConfig: {
      apiToken: 'test',
    },
  });

  await expect(validateInvocation(executionContext)).rejects.toThrow(
    IntegrationProviderAuthenticationError,
  );
});

test('forbidden', async () => {
  fetchMock.mockResponse(() =>
    Promise.resolve({
      status: 403,
      body: 'Forbidden',
    }),
  );

  const executionContext = createMockExecutionContext<IntegrationConfig>({
    instanceConfig: {
      apiToken: 'test',
    },
  });

  await expect(validateInvocation(executionContext)).rejects.toThrow(
    IntegrationProviderAuthorizationError,
  );
});

test('2XX', async () => {
  fetchMock.mockResponse(JSON.stringify({ result: [], success: true }));

  const executionContext = createMockExecutionContext<IntegrationConfig>({
    instanceConfig: {
      apiToken: 'test',
    },
  });

  await expect(validateInvocation(executionContext)).resolves.toBe(undefined);
});
