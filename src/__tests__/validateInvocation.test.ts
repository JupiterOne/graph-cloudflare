import fetchMock from 'jest-fetch-mock';

import { createMockExecutionContext } from '@jupiterone/integration-sdk-testing';

import { IntegrationConfig, validateInvocation } from '../config';

beforeEach(() => {
  fetchMock.doMock();
});

test('rejects if apiToken is not present', async () => {
  fetchMock.mockResponse('{}');

  const context = createMockExecutionContext<IntegrationConfig>({
    instanceConfig: {
      apiToken: undefined as unknown as string,
    },
  });

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

  const context = createMockExecutionContext<IntegrationConfig>({
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

  const context = createMockExecutionContext<IntegrationConfig>({
    instanceConfig: {
      apiToken: 'test',
    },
  });

  await expect(validateInvocation(context)).resolves.toBe(undefined);
});
