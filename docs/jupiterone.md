# JupiterOne Managed Integration for Cloudflare

## Overview

JupiterOne provides a managed integration for Cloudflare. The integration
connects directly to [Cloudflare REST API][1] to obtain DNS related
configuration information.

Configure the integration by providing an API Token with read-only permissions.
Obtain an API token from the bottom of the ["API Tokens" page][2] in your
Cloudflare account.

[1]: https://api.cloudflare.com/
[2]: https://dash.cloudflare.com/profile/api-tokens

<!-- {J1_DOCUMENTATION_MARKER_START} -->
<!--
********************************************************************************
NOTE: ALL OF THE FOLLOWING DOCUMENTATION IS GENERATED USING THE
"j1-integration document" COMMAND. DO NOT EDIT BY HAND! PLEASE SEE THE DEVELOPER
DOCUMENTATION FOR USAGE INFORMATION:

https://github.com/JupiterOne/sdk/blob/master/docs/integrations/development.md
********************************************************************************
-->

## Data Model

### Entities

The following entities are created:

| Resources      | Entity `_type`              | Entity `_class` |
| -------------- | --------------------------- | --------------- |
| Account        | `cloudflare_account`        | `Account`       |
| Account Member | `cloudflare_account_member` | `User`          |
| Account Role   | `cloudflare_account_role`   | `AccessRole`    |
| DNS Record     | `cloudflare_dns_record`     | `DomainRecord`  |
| DNS Zone       | `cloudflare_dns_zone`       | `DomainZone`    |

### Relationships

The following relationships are created/mapped:

| Source Entity `_type`       | Relationship `_class` | Target Entity `_type`       |
| --------------------------- | --------------------- | --------------------------- |
| `cloudflare_account`        | **HAS**               | `cloudflare_dns_zone`       |
| `cloudflare_account`        | **HAS**               | `cloudflare_account_member` |
| `cloudflare_account`        | **HAS**               | `cloudflare_account_role`   |
| `cloudflare_account_member` | **ASSIGNED**          | `cloudflare_account_role`   |
| `cloudflare_dns_zone`       | **HAS**               | `cloudflare_dns_record`     |

<!--
********************************************************************************
END OF GENERATED DOCUMENTATION AFTER BELOW MARKER
********************************************************************************
-->
<!-- {J1_DOCUMENTATION_MARKER_END} -->
