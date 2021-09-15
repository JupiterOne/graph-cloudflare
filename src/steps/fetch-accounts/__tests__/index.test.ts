import { Recording, setupRecording } from '@jupiterone/integration-sdk-testing';

import { createStepContext } from '../../../../test/context';
import { Entities } from '../../../constants';
import step from '../index';

let recording: Recording;

afterEach(async () => {
  await recording.stop();
});

test('should process account entities', async () => {
  recording = setupRecording({
    name: 'cloudflare_account',
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

  expect(collectedEntities).toHaveLength(3);
  expect(collectedEntities).toMatchSnapshot();
  expect(collectedRelationships).toHaveLength(3);
  expect(collectedRelationships).toMatchSnapshot();

  expect(collectedEntities).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        _type: 'cloudflare_account',
        _class: ['Account'],
        displayName: 'My Account',
        accountId: expect.any(String),
        mfaEnabled: undefined,
        mfaEnforced: false,
      }),
      expect.objectContaining({
        _type: 'cloudflare_account_member',
        _class: ['User'],
        displayName: 'user@company.com',
        mfaEnabled: false,
        active: true,
        admin: true,
        superAdmin: true,
      }),
      expect.objectContaining({
        _type: 'cloudflare_account_role',
        _class: ['AccessRole'],
        displayName: 'Administrator',
      }),
    ]),
  );

  const accountEntities = collectedEntities.filter(
    (e) => e._type === Entities.ACCOUNT._type,
  );
  expect(accountEntities).toMatchGraphObjectSchema({
    _class: Entities.ACCOUNT._class,
  });

  const memberEntities = collectedEntities.filter(
    (e) => e._type === Entities.MEMBER._type,
  );

  expect(memberEntities).toMatchGraphObjectSchema({
    _class: Entities.MEMBER._class,
    schema: {
      // User entities require name properties that may not be available in the
      // Cloudflare data.
      properties: {
        firstName: {
          type: 'string',
          nullable: true,
        },
        lastName: {
          type: 'string',
          nullable: true,
        },
      },
    },
  });

  const roleEntities = collectedEntities.filter(
    (e) => e._type === Entities.ROLE._type,
  );
  expect(roleEntities).toMatchGraphObjectSchema({
    _class: Entities.ROLE._class,
  });

  expect(collectedRelationships).toMatchDirectRelationshipSchema({});
});
