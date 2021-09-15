import { PaginationInfo } from '@cloudflare/types';
import { createMockIntegrationLogger } from '@jupiterone/integration-sdk-testing';

import { createStepContext } from '../../../test/context';
import { ServicesClient } from '../ServicesClient';

function createCloudflareApiResponse(paginationInfo: PaginationInfo) {
  const { page, count, total_count, per_page, total_pages } = paginationInfo;
  return {
    success: true,
    errors: [],
    messages: [],
    result: [
      {
        id: 'id',
        name: 'name',
        created_on: 'created_on',
        modified_on: 'modified_on',
      },
    ],
    result_info: {
      per_page,
      page,
      count,
      total_count,
      total_pages,
    },
  };
}

test('should page through all results for API', async () => {
  const client = new ServicesClient(
    createStepContext().instance.config,
    createMockIntegrationLogger(),
  );

  const fetchSpy = jest
    .spyOn(client, 'fetch')
    .mockResolvedValueOnce(
      createCloudflareApiResponse({
        page: 1,
        count: 500,
        total_count: 501,
        per_page: 500,
        total_pages: 2,
      }),
    )
    .mockResolvedValueOnce(
      createCloudflareApiResponse({
        page: 2,
        count: 1,
        total_count: 501,
        per_page: 500,
        total_pages: 2,
      }),
    );

  await client.iterateAll('some-endpoint', jest.fn());

  expect(fetchSpy).toHaveBeenCalledTimes(2);
});
