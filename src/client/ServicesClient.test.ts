import fetchMock, { MockParams } from 'jest-fetch-mock';

import { PaginationInfo } from '@cloudflare/types';
import {
  IntegrationProviderAPIError,
  IntegrationProviderAuthenticationError,
  IntegrationProviderAuthorizationError,
} from '@jupiterone/integration-sdk-core';
import { createMockIntegrationLogger } from '@jupiterone/integration-sdk-testing';

import { createStepContext } from '../../test/context';
import { ServicesClient } from './ServicesClient';

function createResponseBody({
  success,
  result,
  resultInfo,
}: {
  success?: boolean;
  result: any[];
  resultInfo?: Partial<PaginationInfo>;
}) {
  return {
    success: success ?? true,
    errors: [],
    messages: [],
    result,
    result_info: resultInfo ?? createResultInfo(result),
  };
}

function createResultInfo(
  result: any[],
  info?: Partial<PaginationInfo>,
): PaginationInfo {
  return {
    page: 1,
    count: result.length,
    total_count: result.length,
    per_page: result.length,
    total_pages: 1,
    ...info,
  };
}

function mockAPIResponses(...responses: [object, MockParams][]) {
  const jsonResponses = responses.map(
    (e) => [JSON.stringify(e[0]), e[1]] as [string, MockParams],
  );
  fetchMock.mockResponses(...jsonResponses);
}

let client: ServicesClient;

beforeEach(() => {
  fetchMock.resetMocks();
  client = new ServicesClient({
    config: createStepContext().instance.config,
    logger: createMockIntegrationLogger(),
    retryConfig: {
      maxAttempts: 2,
      delay: 10,
      factor: 1,
      jitter: false,
    },
  });
});

test('unauthorized', async () => {
  fetchMock.mockResponse(() =>
    Promise.resolve({
      status: 401,
      body: 'Unauthorized',
    }),
  );

  const iteratee = jest.fn();
  await expect(client.iterateAll('some-endpoint', iteratee)).rejects.toThrow(
    IntegrationProviderAuthenticationError,
  );

  expect(iteratee).not.toHaveBeenCalled();
});

test('forbidden', async () => {
  fetchMock.mockResponse(() =>
    Promise.resolve({
      status: 403,
      body: 'Forbidden',
    }),
  );

  const iteratee = jest.fn();
  await expect(client.iterateAll('some-endpoint', iteratee)).rejects.toThrow(
    IntegrationProviderAuthorizationError,
  );

  expect(iteratee).not.toHaveBeenCalled();
});

test('retry', async () => {
  fetchMock.mockResponses(
    ['ERROR ONE', { status: 500 }],
    [JSON.stringify({ success: true, result: [{ id: '1' }] }), { status: 200 }],
  );

  const iteratee = jest.fn();
  await expect(
    client.iterateAll('some-endpoint', iteratee),
  ).resolves.toBeUndefined();

  expect(iteratee.mock.calls.length).toBe(1);
  expect(iteratee.mock.calls[0]).toEqual([{ id: '1' }]);
  expect(fetchMock.mock.calls.length).toBe(2);
});

test('retry fail', async () => {
  fetchMock.mockResponses(
    ['ERROR ONE', { status: 500 }],
    ['ERROR TWO', { status: 500 }],
  );

  const iteratee = jest.fn();
  await expect(client.iterateAll('some-endpoint', iteratee)).rejects.toThrow(
    IntegrationProviderAPIError,
  );

  expect(iteratee).not.toHaveBeenCalled();
  expect(fetchMock.mock.calls.length).toBe(2);
});

test('retry ECONNRESET', async () => {
  // Simulate system errorß
  const econnresetError = new Error('read ECONNRESET');
  (econnresetError as any).code = 'ECONNRESET';

  // Simulate FetchError
  const fetchError = new Error(
    `request failed, reason: ${econnresetError.message}`,
  );
  (fetchError as any).code = (econnresetError as any).code;
  fetchMock.mockRejectOnce(fetchError);

  // Succeed on retry
  mockAPIResponses([
    createResponseBody({ result: [{ id: '1' }] }),
    { status: 200 },
  ]);

  const iteratee = jest.fn();
  await expect(
    client.iterateAll('some-endpoint', iteratee),
  ).resolves.toBeUndefined();

  expect(iteratee.mock.calls.length).toBe(1);
  expect(iteratee.mock.calls[0]).toEqual([{ id: '1' }]);
  expect(fetchMock.mock.calls.length).toBe(2);
});

test('pagination', async () => {
  const page1 = [{ id: '1' }, { id: '2' }];
  const page2 = [{ id: '3' }];

  mockAPIResponses(
    [
      createResponseBody({
        result: page1,
        resultInfo: createResultInfo(page1, {
          page: 1,
          total_count: page1.length + page2.length,
          total_pages: 2,
        }),
      }),
      { status: 200 },
    ],
    [
      createResponseBody({
        result: page2,
        resultInfo: createResultInfo(page2, {
          page: 2,
          total_count: page1.length + page2.length,
          total_pages: 2,
        }),
      }),
      { status: 200 },
    ],
  );

  const iteratee = jest.fn();
  await client.iterateAll('some-endpoint', iteratee);

  expect(iteratee).toHaveBeenCalledTimes(3);
  expect(iteratee.mock.calls[0]).toEqual([{ id: '1' }]);
  expect(iteratee.mock.calls[1]).toEqual([{ id: '2' }]);
  expect(iteratee.mock.calls[2]).toEqual([{ id: '3' }]);
});
