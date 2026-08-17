import { CreateContactArgs } from '../openprovider/types.js';
import type { OpenproviderClient } from '../openprovider/client.js';
import type { OpenproviderTokenManager } from '../openprovider/token-manager.js';
import type { Principal } from '../auth/principal.js';

export function createCreateContactTool(deps: {
  client: OpenproviderClient;
  tokenManager: OpenproviderTokenManager;
}) {
  return {
    name: 'create_contact',
    description:
      'Create a tech or billing contact in the tenant’s Openprovider account ' +
      '(role is required: "tech" or "billing"). Note: contacts are reseller ' +
      'sub-contacts, NOT domain registrants — for a domain owner_handle, create ' +
      'a customer with create_customer instead.',
    inputSchema: CreateContactArgs,
    handler: async (args: unknown, principal: Principal): Promise<unknown> => {
      const parsed = CreateContactArgs.parse(args);
      const token = await deps.tokenManager.getToken(principal.tenantId);
      return deps.client.createContact(token, parsed);
    },
  };
}
