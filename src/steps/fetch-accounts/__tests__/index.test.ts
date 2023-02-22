import {
  executeStepWithDependencies,
  Recording,
  setupRecording,
} from '@jupiterone/integration-sdk-testing';
import { buildStepTestConfigForStep } from '../../../../test/config';

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

  const stepConfig = buildStepTestConfigForStep('fetch-accounts');
  const stepResult = await executeStepWithDependencies(stepConfig);
  expect(stepResult).toMatchStepMetadata(stepConfig);
});
