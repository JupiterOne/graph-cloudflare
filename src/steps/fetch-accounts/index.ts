import {
  IntegrationStep,
  createIntegrationRelationship,
} from '@jupiterone/integration-sdk-core';

import { createServicesClient } from '../../collector';
import {
  convertAccount,
  convertAccountMember,
  convertAccountRole,
} from '../../converter';
import { CloudflareIntegrationConfig } from '../../types';

const step: IntegrationStep<CloudflareIntegrationConfig> = {
  id: 'fetch-accounts',
  name: 'Fetch Cloudflare Accounts, Members, and Roles',
  types: ['cloudflare_account'],
  async executionHandler(context) {
    const { jobState } = context;
    const client = createServicesClient(context);

    await client.iterateAccounts(async (account) => {
      const accountEntity = convertAccount(account);
      await jobState.addEntity(accountEntity);

      await client.iterateAccountRoles(account.id, async (role) => {
        const roleEntity = convertAccountRole(role);
        await jobState.addEntity(roleEntity);

        const accountRoleRelationship = createIntegrationRelationship({
          _class: 'HAS',
          from: accountEntity,
          to: roleEntity,
        });
        await jobState.addRelationship(accountRoleRelationship);
      });

      await client.iterateAccountMembers(account.id, async (member) => {
        const memberEntity = convertAccountMember(member);
        await jobState.addEntity(memberEntity);

        const accountMemberRelationship = createIntegrationRelationship({
          _class: 'HAS',
          from: accountEntity,
          to: memberEntity,
        });
        await jobState.addRelationship(accountMemberRelationship);

        for (const role of member.roles) {
          const memberRoleRelationship = createIntegrationRelationship({
            fromKey: `cloudflare_account_role:${role.id}`,
            fromType: 'cloudflare_account_role',
            toKey: memberEntity._key,
            toType: memberEntity._type,
            _class: 'ASSIGNED',
          });
          await jobState.addRelationship(memberRoleRelationship);
        }
      });
    });
  },
};

export default step;
