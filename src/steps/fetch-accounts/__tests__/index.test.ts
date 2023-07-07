import {
  executeStepWithDependencies,
  Recording,
  setupRecording,
} from '@jupiterone/integration-sdk-testing';
import { buildStepTestConfigForStep } from '../../../../test/config';
import { MappedRelationships } from '../../../constants';

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
      recordFailedRequests: true,
      matchRequestsBy: {
        url: {
          query: false,
        },
      },
    },
  });

  const stepConfig = buildStepTestConfigForStep('fetch-accounts');
  const stepResult = await executeStepWithDependencies(stepConfig);
  const directRelationships = stepResult.collectedRelationships.filter(
    (r) =>
      r._type !==
      MappedRelationships.OKTA_APPLICATION_CONNECTS_CLOUDFLARE_ACCOUNT._type,
  );
  const mappedRelationships = stepResult.collectedRelationships.filter(
    (r) =>
      r._type ===
      MappedRelationships.OKTA_APPLICATION_CONNECTS_CLOUDFLARE_ACCOUNT._type,
  );
  expect(stepResult.collectedEntities.length).toBeGreaterThan(0);
  expect(directRelationships.length).toBeGreaterThan(0);
  expect(mappedRelationships).toMatchGraphObjectSchema(
    MappedRelationships.OKTA_APPLICATION_CONNECTS_CLOUDFLARE_ACCOUNT,
  );
});
