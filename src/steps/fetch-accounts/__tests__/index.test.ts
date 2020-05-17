/* eslint-disable @typescript-eslint/camelcase */
import { createStepContext } from 'test';
import { Recording, setupRecording } from '@jupiterone/integration-sdk/testing';

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

  expect(context.jobState.collectedEntities).toHaveLength(3);
  expect(context.jobState.collectedRelationships).toHaveLength(3);

  expect(context.jobState.collectedEntities).toEqual(
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
});
