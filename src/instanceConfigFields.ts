import { IntegrationInstanceConfigFieldMap } from '@jupiterone/integration-sdk-core';

const instanceConfigFields: IntegrationInstanceConfigFieldMap = {
  apiToken: {
    type: 'string',
    mask: true,
  },
};

export default instanceConfigFields;
