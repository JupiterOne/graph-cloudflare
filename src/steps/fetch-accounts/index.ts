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
    Relationships.MEMBER_ASSIGNED_ROLE,
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
            toKey: `cloudflare_account_role:${role.id}`,
            toType: 'cloudflare_account_role',
            fromKey: memberEntity._key,
            fromType: memberEntity._type,
            _class: RelationshipClass.ASSIGNED,
            properties: {
              _type: Relationships.MEMBER_ASSIGNED_ROLE._type,
            },
          });
          await jobState.addRelationship(memberRoleRelationship);
        }
      });
    });
  },
};

export default step;
