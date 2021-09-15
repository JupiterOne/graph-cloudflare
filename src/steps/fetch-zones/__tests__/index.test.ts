import { Recording, setupRecording } from '@jupiterone/integration-sdk-testing';

import { createStepContext } from '../../../../test/context';
import { Entities } from '../../../constants';
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

  const { collectedEntities, collectedRelationships } = context.jobState;

  expect(collectedEntities).toHaveLength(27);
  expect(collectedEntities).toMatchSnapshot();
  expect(collectedRelationships).toHaveLength(27);
  expect(collectedRelationships).toMatchSnapshot();

  expect(collectedEntities).toEqual(
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

  const zoneEntities = collectedEntities.filter(
    (e) => e._type === Entities.DNS_ZONE._type,
  );
  expect(zoneEntities).toMatchGraphObjectSchema({
    _class: Entities.DNS_ZONE._class,
  });

  const recordEntities = collectedEntities.filter(
    (e) => e._type === Entities.DNS_RECORD._type,
  );
  expect(recordEntities).toMatchGraphObjectSchema({
    _class: Entities.DNS_RECORD._class,
  });

  expect(collectedRelationships).toMatchDirectRelationshipSchema({});
});
