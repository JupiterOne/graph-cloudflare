import { IntegrationInstanceConfigFieldMap } from '@jupiterone/integration-sdk-core';

import { CloudflareIntegrationConfig } from './types';

const instanceConfigFields: IntegrationInstanceConfigFieldMap<CloudflareIntegrationConfig> =
  {
    apiToken: {
      type: 'string',
      mask: true,
    },
  };

export default instanceConfigFields;
