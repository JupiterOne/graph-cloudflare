import {
  IntegrationStep,
  createIntegrationRelationship,
} from '@jupiterone/integration-sdk-core';

import { createServicesClient } from '../../collector';
import { convertZone, convertRecord } from '../../converter';
import { CloudflareIntegrationConfig } from '../../types';

const step: IntegrationStep<CloudflareIntegrationConfig> = {
  id: 'fetch-zones',
  name: 'Fetch Cloudflare DNS Zones and Records',
  types: ['cloudflare_dns_zone'],
  async executionHandler(context) {
    const { jobState } = context;
    const client = createServicesClient(context);

    await client.iterateZones(async (zone) => {
      const zoneEntity = convertZone(zone);
      await jobState.addEntity(zoneEntity);

      const accountZoneRelationship = createIntegrationRelationship({
        fromKey: `cloudflare_account:${zoneEntity.accountId}`,
        fromType: 'cloudflare_account',
        toKey: zoneEntity._key,
        toType: zoneEntity._type,
        _class: 'HAS',
      });
      await jobState.addRelationship(accountZoneRelationship);

      await client.iterateZoneRecords(zoneEntity.id, async (zoneRecord) => {
        const recordEntity = convertRecord(zoneRecord);
        jobState.addEntity(recordEntity);

        await jobState.addRelationship(
          createIntegrationRelationship({
            from: zoneEntity,
            to: recordEntity,
            _class: 'HAS',
          }),
        );
      });
    });
  },
};

export default step;
