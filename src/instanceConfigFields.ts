import { IntegrationInstanceConfigFieldMap } from '@jupiterone/integration-sdk';

const instanceConfigFields: IntegrationInstanceConfigFieldMap = {
  apiToken: {
    type: 'string',
    mask: true,
  },
};

export default instanceConfigFields;
