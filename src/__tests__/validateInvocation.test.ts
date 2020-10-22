import { createMockExecutionContext } from '@jupiterone/integration-sdk-testing';

import validateInvocation from '../validateInvocation';

import fetchMock from 'jest-fetch-mock';
import { CloudflareIntegrationConfig } from '../types';

beforeEach(() => {
  fetchMock.doMock();
});

test('rejects if apiToken is not present', async () => {
  fetchMock.mockResponse('{}');

  const context = createMockExecutionContext<CloudflareIntegrationConfig>({
    instanceConfig: {
      apiToken: '',
    },
  });

  delete context.instance.config.apiToken;

  await expect(validateInvocation(context)).rejects.toThrow(
    /Failed to authenticate/,
  );
});

test('rejects if unable to hit provider apis', async () => {
  fetchMock.mockResponse(() =>
    Promise.resolve({
      status: 403,
      body: 'Unauthorized',
    }),
  );

  const context = createMockExecutionContext<CloudflareIntegrationConfig>({
    instanceConfig: {
      apiToken: 'test',
    },
  });

  await expect(validateInvocation(context)).rejects.toThrow(
    /Failed to authenticate/,
  );
});

test('performs sample api call to ensure api can be hit', async () => {
  fetchMock.mockResponse(JSON.stringify({ result: [], success: true }));

  const context = createMockExecutionContext<CloudflareIntegrationConfig>({
    instanceConfig: {
      apiToken: 'test',
    },
  });

  await expect(validateInvocation(context)).resolves.toBe(undefined);
});
