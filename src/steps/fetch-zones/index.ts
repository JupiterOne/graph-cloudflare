import {
  IntegrationStep,
  IntegrationStepExecutionContext,
  createIntegrationRelationship,
} from '@jupiterone/integration-sdk';

import { createServicesClient } from '../../collector';
import { convertZone, convertRecord } from '../../converter';

const step: IntegrationStep = {
  id: 'fetch-zones',
  name: 'Fetch Cloudflare DNS Zones and Records',
  types: ['cloudflare_dns_zone'],
  async executionHandler({
    instance,
    jobState,
  }: IntegrationStepExecutionContext) {
    const client = createServicesClient(instance);

    const zones = await client.listZones();
    const zoneEntities = zones.map(convertZone);
    await jobState.addEntities(zoneEntities);

    const accountZoneRelationships = zoneEntities.map((zoneEntity) =>
      createIntegrationRelationship({
        fromKey: `cloudflare_account:${zoneEntity.accountId}`,
        fromType: 'cloudflare_account',
        toKey: zoneEntity._key,
        toType: zoneEntity._type,
        _class: 'HAS',
      }),
    );
    await jobState.addRelationships(accountZoneRelationships);

    for (const zoneEntity of zoneEntities) {
      const records = await client.listZoneRecords(zoneEntity.id);
      const recordEntities = records.map(convertRecord);
      await jobState.addEntities(recordEntities);

      const zoneRecordRelationships = recordEntities.map((recordEntity) =>
        createIntegrationRelationship({
          from: zoneEntity,
          to: recordEntity,
          _class: 'HAS',
        }),
      );
      await jobState.addRelationships(zoneRecordRelationships);
    }
  },
};

export default step;
