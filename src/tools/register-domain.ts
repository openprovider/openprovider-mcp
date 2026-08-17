import { RegisterDomainArgs } from '../openprovider/types.js';
import type { OpenproviderClient } from '../openprovider/client.js';
import type { OpenproviderTokenManager } from '../openprovider/token-manager.js';
import type { Principal } from '../auth/principal.js';

/**
 * Openprovider's standard nameservers (by name; they are out-of-bailiwick, so
 * no glue IPs are needed). Applied as the default when a registration supplies
 * neither explicit name_servers nor an ns_group — otherwise the domain lands
 * with no NS and won't resolve.
 */
export const OPENPROVIDER_DEFAULT_NAMESERVERS = [
  { name: 'ns1.openprovider.nl' },
  { name: 'ns2.openprovider.be' },
  { name: 'ns3.openprovider.eu' },
] as const;

export function createRegisterDomainTool(deps: {
  client: OpenproviderClient;
  tokenManager: OpenproviderTokenManager;
}) {
  return {
    name: 'register_domain',
    description:
      'Register a new domain (billable). Requires an existing owner contact handle. ' +
      'Admin/tech/billing handles default to the owner handle when not given (many ccTLDs ' +
      'such as .nl require them). Defaults to Openprovider’s nameservers when neither ' +
      'name_servers nor ns_group is given.',
    inputSchema: RegisterDomainArgs,
    handler: async (args: unknown, principal: Principal): Promise<unknown> => {
      const parsed = RegisterDomainArgs.parse(args);
      const hasNameServers = parsed.name_servers !== undefined && parsed.name_servers.length > 0;
      const withDefaults = {
        ...parsed,
        // Many ccTLD registries (.nl, .eu, ...) require admin/tech/billing
        // handles; Openprovider rejects the registration otherwise with
        // `{"code":333,"desc":"Invalid admin handle!"}`. When the caller omits
        // them, fall back to the owner handle (verified live against .nl).
        admin_handle: parsed.admin_handle ?? parsed.owner_handle,
        tech_handle: parsed.tech_handle ?? parsed.owner_handle,
        billing_handle: parsed.billing_handle ?? parsed.owner_handle,
        // Without explicit name_servers or an ns_group the domain would land
        // with no NS and not resolve — apply Openprovider's defaults.
        ...(!hasNameServers && parsed.ns_group === undefined
          ? { name_servers: OPENPROVIDER_DEFAULT_NAMESERVERS.map((ns) => ({ ...ns })) }
          : {}),
      };
      const token = await deps.tokenManager.getToken(principal.tenantId);
      return deps.client.registerDomain(token, withDefaults);
    },
  };
}
