import {
  IntegrationStep,
  createDirectRelationship,
  RelationshipClass,
} from '@jupiterone/integration-sdk-core';

import { createServicesClient } from '../../collector';
import {
  convertAccount,
  convertAccountMember,
  convertAccountRole,
} from '../../converter';
import { CloudflareIntegrationConfig } from '../../types';
import { Entities, Steps, Relationships } from '../../constants';

const step: IntegrationStep<CloudflareIntegrationConfig> = {
  id: Steps.ACCOUNT,
  name: 'Fetch Cloudflare Accounts, Members, and Roles',
  entities: [Entities.ACCOUNT, Entities.MEMBER, Entities.ROLE],
  relationships: [
    Relationships.ACCOUNT_HAS_MEMBER,
    Relationships.ACCOUNT_HAS_ROLE,
    Relationships.ROLE_ASSIGNED_MEMBER,
  ],
  async executionHandler(context) {
    const { jobState } = context;
    const client = createServicesClient(context);

    await client.iterateAccounts(async (account) => {
      const accountEntity = convertAccount(account);
      await jobState.addEntity(accountEntity);

      await client.iterateAccountRoles(account.id, async (role) => {
        const roleEntity = convertAccountRole(role);
        await jobState.addEntity(roleEntity);

        const accountRoleRelationship = createDirectRelationship({
          _class: RelationshipClass.HAS,
          from: accountEntity,
          to: roleEntity,
          properties: {
            _type: Relationships.ACCOUNT_HAS_ROLE._type,
          },
        });
        await jobState.addRelationship(accountRoleRelationship);
      });

      await client.iterateAccountMembers(account.id, async (member) => {
        const memberEntity = convertAccountMember(member);
        await jobState.addEntity(memberEntity);

        const accountMemberRelationship = createDirectRelationship({
          _class: RelationshipClass.HAS,
          from: accountEntity,
          to: memberEntity,
          properties: {
            _type: Relationships.ACCOUNT_HAS_MEMBER._type,
          },
        });
        await jobState.addRelationship(accountMemberRelationship);

        for (const role of member.roles) {
          const memberRoleRelationship = createDirectRelationship({
            fromKey: `cloudflare_account_role:${role.id}`,
            fromType: 'cloudflare_account_role',
            toKey: memberEntity._key,
            toType: memberEntity._type,
            _class: RelationshipClass.ASSIGNED,
            properties: {
              _type: Relationships.ROLE_ASSIGNED_MEMBER._type,
            },
          });
          await jobState.addRelationship(memberRoleRelationship);
        }
      });
    });
  },
};

export default step;
