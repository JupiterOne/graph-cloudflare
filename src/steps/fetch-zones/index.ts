import {
  createDirectRelationship,
  IntegrationStep,
  RelationshipClass,
} from '@jupiterone/integration-sdk-core';

import { ServicesClient } from '../../client';
import { IntegrationConfig } from '../../config';
import { Entities, Relationships, Steps } from '../../constants';
import { convertRecord, convertZone } from '../../converter';

const step: IntegrationStep<IntegrationConfig> = {
  id: Steps.ZONES,
  name: 'Fetch Cloudflare DNS Zones and Records',
  entities: [Entities.DNS_ZONE, Entities.DNS_RECORD],
  relationships: [
    Relationships.ACCOUNT_HAS_ZONE,
    Relationships.ZONE_HAS_RECORD,
  ],
  dependsOn: [Steps.ACCOUNT],
  async executionHandler(context) {
    const { instance, logger, jobState } = context;
    const client = new ServicesClient({ config: instance.config, logger });

    await client.iterateZones(async (zone) => {
      const zoneEntity = convertZone(zone);
      await jobState.addEntity(zoneEntity);

      const accountZoneRelationship = createDirectRelationship({
        fromKey: `cloudflare_account:${zoneEntity.accountId}`,
        fromType: 'cloudflare_account',
        toKey: zoneEntity._key,
        toType: zoneEntity._type,
        _class: RelationshipClass.HAS,
        properties: {
          _type: Relationships.ACCOUNT_HAS_ZONE._type,
        },
      });
      await jobState.addRelationship(accountZoneRelationship);

      if (zoneEntity.id) {
        if (typeof zoneEntity.id === 'string') {
          await client.iterateZoneRecords(zoneEntity.id, async (zoneRecord) => {
            const recordEntity = convertRecord(zoneRecord);
            await jobState.addEntity(recordEntity);

            await jobState.addRelationship(
              createDirectRelationship({
                from: zoneEntity,
                to: recordEntity,
                _class: RelationshipClass.HAS,
                properties: {
                  _type: Relationships.ZONE_HAS_RECORD._type,
                },
              }),
            );
          });
        } else {
          const iterateZoneRecordsPromises: Promise<void>[] = [];
          zoneEntity.id.forEach((id) =>
            iterateZoneRecordsPromises.push(
              client.iterateZoneRecords(id, async (zoneRecord) => {
                const recordEntity = convertRecord(zoneRecord);
                await jobState.addEntity(recordEntity);

                await jobState.addRelationship(
                  createDirectRelationship({
                    from: zoneEntity,
                    to: recordEntity,
                    _class: RelationshipClass.HAS,
                    properties: {
                      _type: Relationships.ZONE_HAS_RECORD._type,
                    },
                  }),
                );
              }),
            ),
          );
          await Promise.all(iterateZoneRecordsPromises);
        }
      }
    });
  },
};

export default step;
