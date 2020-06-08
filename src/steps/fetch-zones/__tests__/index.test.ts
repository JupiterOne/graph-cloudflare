/* eslint-disable @typescript-eslint/camelcase */
import { createStepContext } from '../../../../test';
import { Recording, setupRecording } from '@jupiterone/integration-sdk-testing';

import step from '../index';

let recording: Recording;

afterEach(async () => {
  await recording.stop();
});

test('should process zone entities', async () => {
  recording = setupRecording({
    name: 'cloudflare_dns_zone',
    directory: __dirname,
    redactedRequestHeaders: ['api-token', 'X-Auth-Key', 'X-Auth-Email'],
    options: {
      recordFailedRequests: false,
      matchRequestsBy: {
        url: {
          query: false,
        },
      },
    },
  });

  const context = createStepContext();
  await step.executionHandler(context);

  expect(context.jobState.collectedEntities).toHaveLength(27);
  expect(context.jobState.collectedRelationships).toHaveLength(27);

  expect(context.jobState.collectedEntities).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        _type: 'cloudflare_dns_zone',
        _class: ['DomainZone'],
        id: expect.any(String),
        displayName: 'erkang.com',
        domainName: 'erkang.com',
        nameServers: ['dora.ns.cloudflare.com', 'kirk.ns.cloudflare.com'],
        activatedOn: expect.any(Number),
        createdOn: expect.any(Number),
        modifiedOn: expect.any(Number),
      }),
      expect.objectContaining({
        _type: 'cloudflare_dns_record',
        _class: ['DomainRecord'],
        id: expect.any(String),
        displayName: 'one.erkang.com',
        zoneName: 'erkang.com',
        type: 'A',
        content: '1.1.1.1',
        ttl: 1,
        locked: false,
        createdOn: expect.any(Number),
        modifiedOn: expect.any(Number),
      }),
    ]),
  );
});
