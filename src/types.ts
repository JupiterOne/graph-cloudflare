// This is a shorter version of the type AccountMember from @cloudflare/types
// It turns out that we can't use that type because we get the next typescript error:
// error TS2589: Type instantiation is excessively deep and possibly infinite.
// The latest versions of the package haven't solved that issue
export type CloudflareAccountMember = {
  id?: string;
  api_access_enabled?: boolean;
  user?: {
    id?: string;
    email?: string;
    first_name?: string;
    last_name?: string;
    two_factor_authentication_enabled?: boolean;
  };
  status?: 'accepted' | 'pending' | 'rejected';
  roles?: {
    id?: string;
    name?: string;
    description?: string;
    permissions?: Record<string, { read?: boolean; edit?: boolean }>;
  }[];
};

// This doesn't appear to be provided by @cloudflare/types at the time of
// including it.  The identity provider response has more information than
// this, but the response differs based on the type and this is the subset
// we need to create the mapped relationship needed from it.  Documentation
// for the API call is here:
// https://developers.cloudflare.com/api/operations/access-identity-providers-list-access-identity-providers
export type CloudflareIdentityProvider = {
  id: string;
  type: string;
};
