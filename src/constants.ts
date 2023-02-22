import { RelationshipClass } from '@jupiterone/integration-sdk-core';

export const Steps = {
  ACCOUNT: 'fetch-accounts',
  ZONES: 'fetch-zones',
};

export const Entities = {
  ACCOUNT: {
    resourceName: 'Account',
    _type: 'cloudflare_account',
    _class: ['Account'],
  },
  MEMBER: {
    resourceName: 'Account Member',
    _type: 'cloudflare_account_member',
    _class: ['User'],
    properties: {
      firstName: {
        type: 'string',
        nullable: true,
      },
      lastName: {
        type: 'string',
        nullable: true,
      },
    },
  },
  ROLE: {
    resourceName: 'Account Role',
    _type: 'cloudflare_account_role',
    _class: ['AccessRole'],
  },
  DNS_ZONE: {
    resourceName: 'DNS Zone',
    _type: 'cloudflare_dns_zone',
    _class: ['DomainZone'],
  },
  DNS_RECORD: {
    resourceName: 'DNS Record',
    _type: 'cloudflare_dns_record',
    _class: ['DomainRecord'],
  },
};

export const Relationships = {
  ACCOUNT_HAS_MEMBER: {
    _type: 'cloudflare_account_has_member',
    sourceType: Entities.ACCOUNT._type,
    _class: RelationshipClass.HAS,
    targetType: Entities.MEMBER._type,
  },
  ACCOUNT_HAS_ROLE: {
    _type: 'cloudflare_account_has_role',
    sourceType: Entities.ACCOUNT._type,
    _class: RelationshipClass.HAS,
    targetType: Entities.ROLE._type,
  },
  MEMBER_ASSIGNED_ROLE: {
    _type: 'cloudflare_account_member_assigned_role',
    sourceType: Entities.MEMBER._type,
    _class: RelationshipClass.ASSIGNED,
    targetType: Entities.ROLE._type,
  },
  ACCOUNT_HAS_ZONE: {
    _type: 'cloudflare_account_has_dns_zone',
    sourceType: Entities.ACCOUNT._type,
    _class: RelationshipClass.HAS,
    targetType: Entities.DNS_ZONE._type,
  },
  ZONE_HAS_RECORD: {
    _type: 'cloudflare_dns_zone_has_record',
    sourceType: Entities.DNS_ZONE._type,
    _class: RelationshipClass.HAS,
    targetType: Entities.DNS_RECORD._type,
  },
};
