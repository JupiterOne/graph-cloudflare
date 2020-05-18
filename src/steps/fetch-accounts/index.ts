import {
  IntegrationStep,
  IntegrationStepExecutionContext,
  createIntegrationRelationship,
} from '@jupiterone/integration-sdk';

import { createServicesClient } from '../../collector';
import {
  convertAccount,
  convertAccountMember,
  convertAccountRole,
} from '../../converter';

const step: IntegrationStep = {
  id: 'fetch-accounts',
  name: 'Fetch Cloudflare Accounts, Members, and Roles',
  types: ['cloudflare_account'],
  async executionHandler({
    instance,
    jobState,
  }: IntegrationStepExecutionContext) {
    const client = createServicesClient(instance);

    const accounts = await client.listAccounts();
    const accountEntities = accounts.map(convertAccount);
    await jobState.addEntities(accountEntities);

    for (const accountEntity of accountEntities) {
      const members = await client.listAccountMembers(accountEntity.id);
      const roles = await client.listAccountRoles(accountEntity.id);

      const memberEntities = members.map(convertAccountMember);
      await jobState.addEntities(memberEntities);

      const accountMemberRelationships = memberEntities.map((memberEntity) =>
        createIntegrationRelationship({
          from: accountEntity,
          to: memberEntity,
          _class: 'HAS',
        }),
      );
      await jobState.addRelationships(accountMemberRelationships);

      const roleEntities = roles.map(convertAccountRole);
      await jobState.addEntities(roleEntities);

      const accountRoleRelationships = roleEntities.map((roleEntity) =>
        createIntegrationRelationship({
          from: accountEntity,
          to: roleEntity,
          _class: 'HAS',
        }),
      );
      await jobState.addRelationships(accountRoleRelationships);

      const memberRoleRelationships = [];
      memberEntities.forEach((memberEntity) => {
        memberEntity.roles.forEach((role) => {
          memberRoleRelationships.push(
            createIntegrationRelationship({
              fromKey: `cloudflare_account_role:${role}`,
              fromType: 'cloudflare_account_role',
              toKey: memberEntity._key,
              toType: memberEntity._type,
              _class: 'ASSIGNED',
            }),
          );
        });
      });
      await jobState.addRelationships(memberRoleRelationships);
    }
  },
};

export default step;
