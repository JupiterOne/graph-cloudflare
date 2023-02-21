import {
  createDirectRelationship,
  IntegrationStep,
  RelationshipClass,
} from '@jupiterone/integration-sdk-core';

import { ServicesClient } from '../../client';
import { IntegrationConfig } from '../../config';
import { Entities, Relationships, Steps } from '../../constants';
import {
  convertAccount,
  convertAccountMember,
  convertAccountRole,
} from '../../converter';

const step: IntegrationStep<IntegrationConfig> = {
  id: Steps.ACCOUNT,
  name: 'Fetch Cloudflare Accounts, Members, and Roles',
  entities: [Entities.ACCOUNT, Entities.MEMBER, Entities.ROLE],
  relationships: [
    Relationships.ACCOUNT_HAS_MEMBER,
    Relationships.ACCOUNT_HAS_ROLE,
    Relationships.MEMBER_ASSIGNED_ROLE,
  ],
  async executionHandler(context) {
    const { instance, logger, jobState } = context;
    const client = new ServicesClient({ config: instance.config, logger });

    const accountRoleKeys = new Set<string>();

    await client.iterateAccounts(async (account) => {
      const accountEntity = convertAccount(account);
      await jobState.addEntity(accountEntity);

      await client.iterateAccountRoles(account.id, async (role) => {
        const roleEntity = convertAccountRole(role);
        if (accountRoleKeys.has(roleEntity._key)) {
          // Avoid overwriting `accountId` in logging
          logger.warn(
            { _key: roleEntity._key, account: { id: account.id } },
            'Duplicate role key, suggests roles are not unique across accounts',
          );
        } else {
          await jobState.addEntity(roleEntity);
          accountRoleKeys.add(roleEntity._key);
        }

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
        const memberEntity = await jobState.addEntity(
          convertAccountMember(member),
        );

        await jobState.addRelationship(
          createDirectRelationship({
            _class: RelationshipClass.HAS,
            from: accountEntity,
            to: memberEntity,
            properties: {
              _type: Relationships.ACCOUNT_HAS_MEMBER._type,
            },
          }),
        );

        for (const role of member.roles) {
          const roleEntity = await jobState.findEntity(
            `cloudflare_account_role:${role.id}`,
          );

          if (roleEntity) {
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
        }
      });
    });
  },
};

export default step;
