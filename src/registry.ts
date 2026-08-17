/**
 * Registry of every Openprovider tool exposed by this server.
 *
 * Single-tenant: there is no policy engine, spend cap, confirmation flow or
 * per-tenant database here — those belong to Openprovider's hosted multi-tenant
 * deployment. This build talks to exactly one Openprovider account, supplied
 * through the environment.
 */
import type { ZodTypeAny } from 'zod';
import type { Principal } from './auth/principal.js';
import type { OpenproviderClient } from './openprovider/client.js';
import type { OpenproviderTokenManager } from './openprovider/token-manager.js';

import { createCheckDomainTool } from './tools/check-domain.js';
import { createListDomainsTool } from './tools/list-domains.js';
import { createGetDomainTool } from './tools/get-domain.js';
import { createListContactsTool } from './tools/list-contacts.js';
import { createGetContactTool } from './tools/get-contact.js';
import { createRegisterDomainTool } from './tools/register-domain.js';
import { createUpdateDomainTool } from './tools/update-domain.js';
import { createCreateContactTool } from './tools/create-contact.js';
import { createUpdateContactTool } from './tools/update-contact.js';
import { createDeleteContactTool } from './tools/delete-contact.js';
import { createSuggestDomainTool } from './tools/suggest-domain.js';
import { createGetDomainAuthcodeTool } from './tools/get-domain-authcode.js';
import { createResetDomainAuthcodeTool } from './tools/reset-domain-authcode.js';
import { createApproveDomainTransferTool } from './tools/approve-domain-transfer.js';
import { createSendFoa1DomainTransferTool } from './tools/send-foa1-domain-transfer.js';
import { createDeleteDomainTool } from './tools/delete-domain.js';
import { createRestartDomainOperationTool } from './tools/restart-domain-operation.js';
import { createRenewDomainTool } from './tools/renew-domain.js';
import { createTransferDomainTool } from './tools/transfer-domain.js';
import { createTradeDomainTool } from './tools/trade-domain.js';
import { createRestoreDomainTool } from './tools/restore-domain.js';
import { createListDnsZonesTool } from './tools/list-dns-zones.js';
import { createGetDnsZoneTool } from './tools/get-dns-zone.js';
import { createListDnsZoneRecordsTool } from './tools/list-dns-zone-records.js';
import { createListNameserversTool } from './tools/list-nameservers.js';
import { createGetNameserverTool } from './tools/get-nameserver.js';
import { createListNsGroupsTool } from './tools/list-ns-groups.js';
import { createGetNsGroupTool } from './tools/get-ns-group.js';
import { createListDnsTemplatesTool } from './tools/list-dns-templates.js';
import { createGetDnsTemplateTool } from './tools/get-dns-template.js';
import { createCreateDnsZoneTool } from './tools/create-dns-zone.js';
import { createUpdateDnsZoneTool } from './tools/update-dns-zone.js';
import { createCreateNameserverTool } from './tools/create-nameserver.js';
import { createUpdateNameserverTool } from './tools/update-nameserver.js';
import { createCreateNsGroupTool } from './tools/create-ns-group.js';
import { createUpdateNsGroupTool } from './tools/update-ns-group.js';
import { createCreateDnsTemplateTool } from './tools/create-dns-template.js';
import { createCreateDomainTokenTool } from './tools/create-domain-token.js';
import { createDeleteDnsZoneTool } from './tools/delete-dns-zone.js';
import { createDeleteNameserverTool } from './tools/delete-nameserver.js';
import { createDeleteNsGroupTool } from './tools/delete-ns-group.js';
import { createDeleteDnsTemplateTool } from './tools/delete-dns-template.js';
import { createListTldsTool } from './tools/list-tlds.js';
import { createGetTldTool } from './tools/get-tld.js';
import { createGetDomainPriceTool } from './tools/get-domain-price.js';
import { createListTagsTool } from './tools/list-tags.js';
import { createCreateTagTool } from './tools/create-tag.js';
import { createDeleteTagTool } from './tools/delete-tag.js';
import { createListSslProductsTool } from './tools/list-ssl-products.js';
import { createGetSslProductTool } from './tools/get-ssl-product.js';
import { createListSslOrdersTool } from './tools/list-ssl-orders.js';
import { createGetSslOrderTool } from './tools/get-ssl-order.js';
import { createGetSslApproverEmailsTool } from './tools/get-ssl-approver-emails.js';
import { createUpdateSslOrderTool } from './tools/update-ssl-order.js';
import { createUpdateSslApproverEmailTool } from './tools/update-ssl-approver-email.js';
import { createResendSslApproverEmailTool } from './tools/resend-ssl-approver-email.js';
import { createCreateCsrTool } from './tools/create-csr.js';
import { createDecodeCsrTool } from './tools/decode-csr.js';
import { createCreateSslOtpTokenTool } from './tools/create-ssl-otp-token.js';
import { createCreateSslOrderTool } from './tools/create-ssl-order.js';
import { createRenewSslOrderTool } from './tools/renew-ssl-order.js';
import { createReissueSslOrderTool } from './tools/reissue-ssl-order.js';
import { createCancelSslOrderTool } from './tools/cancel-ssl-order.js';
import { createListCustomersTool } from './tools/list-customers.js';
import { createGetCustomerTool } from './tools/get-customer.js';
import { createCreateCustomerTool } from './tools/create-customer.js';
import { createUpdateCustomerTool } from './tools/update-customer.js';
import { createDeleteCustomerTool } from './tools/delete-customer.js';
import { createListEmailTemplatesTool } from './tools/list-email-templates.js';
import { createCreateEmailTemplateTool } from './tools/create-email-template.js';
import { createUpdateEmailTemplateTool } from './tools/update-email-template.js';
import { createDeleteEmailTemplateTool } from './tools/delete-email-template.js';
import { createListEmailVerificationDomainsTool } from './tools/list-email-verification-domains.js';
import { createStartEmailVerificationTool } from './tools/start-email-verification.js';
import { createRestartEmailVerificationTool } from './tools/restart-email-verification.js';
import { createGetDmarcTool } from './tools/get-dmarc.js';
import { createListDmarcSubscriptionsTool } from './tools/list-dmarc-subscriptions.js';
import { createCreateDmarcTool } from './tools/create-dmarc.js';
import { createRetryDmarcTool } from './tools/retry-dmarc.js';
import { createDmarcSsoLoginTool } from './tools/dmarc-sso-login.js';
import { createDeleteDmarcTool } from './tools/delete-dmarc.js';
import { createGetSpamExpertsDomainTool } from './tools/get-spam-experts-domain.js';
import { createSpamExpertsLoginUrlTool } from './tools/spam-experts-login-url.js';
import { createCreateSpamExpertsDomainTool } from './tools/create-spam-experts-domain.js';
import { createUpdateSpamExpertsDomainTool } from './tools/update-spam-experts-domain.js';
import { createDeleteSpamExpertsDomainTool } from './tools/delete-spam-experts-domain.js';
import { createListLicensePricesTool } from './tools/list-license-prices.js';
import { createListLicenseItemsTool } from './tools/list-license-items.js';
import { createListPleskLicensesTool } from './tools/list-plesk-licenses.js';
import { createGetPleskLicenseTool } from './tools/get-plesk-license.js';
import { createGetPleskKeyTool } from './tools/get-plesk-key.js';
import { createCreatePleskLicenseTool } from './tools/create-plesk-license.js';
import { createUpdatePleskLicenseTool } from './tools/update-plesk-license.js';
import { createResetPleskHwidTool } from './tools/reset-plesk-hwid.js';
import { createDeletePleskLicenseTool } from './tools/delete-plesk-license.js';

export interface Tool {
  name: string;
  description: string;
  inputSchema: ZodTypeAny;
  handler: (args: unknown, principal: Principal) => Promise<unknown>;
}

export interface BuildToolsDeps {
  openproviderClient: OpenproviderClient;
  tokenManager: OpenproviderTokenManager;
}

export function buildTools(deps: BuildToolsDeps): Tool[] {
  const { openproviderClient, tokenManager } = deps;
  return [
    createCheckDomainTool({ client: openproviderClient, tokenManager }),
    createListDomainsTool({ client: openproviderClient, tokenManager }),
    createGetDomainTool({ client: openproviderClient, tokenManager }),
    createListContactsTool({ client: openproviderClient, tokenManager }),
    createGetContactTool({ client: openproviderClient, tokenManager }),
    createRegisterDomainTool({ client: openproviderClient, tokenManager }),
    createUpdateDomainTool({ client: openproviderClient, tokenManager }),
    createCreateContactTool({ client: openproviderClient, tokenManager }),
    createUpdateContactTool({ client: openproviderClient, tokenManager }),
    createDeleteContactTool({ client: openproviderClient, tokenManager }),
    createSuggestDomainTool({ client: openproviderClient, tokenManager }),
    createGetDomainAuthcodeTool({ client: openproviderClient, tokenManager }),
    createResetDomainAuthcodeTool({ client: openproviderClient, tokenManager }),
    createApproveDomainTransferTool({ client: openproviderClient, tokenManager }),
    createSendFoa1DomainTransferTool({ client: openproviderClient, tokenManager }),
    createDeleteDomainTool({ client: openproviderClient, tokenManager }),
    createRestartDomainOperationTool({ client: openproviderClient, tokenManager }),
    createRenewDomainTool({ client: openproviderClient, tokenManager }),
    createTransferDomainTool({ client: openproviderClient, tokenManager }),
    createTradeDomainTool({ client: openproviderClient, tokenManager }),
    createRestoreDomainTool({ client: openproviderClient, tokenManager }),
    createListDnsZonesTool({ client: openproviderClient, tokenManager }),
    createGetDnsZoneTool({ client: openproviderClient, tokenManager }),
    createListDnsZoneRecordsTool({ client: openproviderClient, tokenManager }),
    createListNameserversTool({ client: openproviderClient, tokenManager }),
    createGetNameserverTool({ client: openproviderClient, tokenManager }),
    createListNsGroupsTool({ client: openproviderClient, tokenManager }),
    createGetNsGroupTool({ client: openproviderClient, tokenManager }),
    createListDnsTemplatesTool({ client: openproviderClient, tokenManager }),
    createGetDnsTemplateTool({ client: openproviderClient, tokenManager }),
    createCreateDnsZoneTool({ client: openproviderClient, tokenManager }),
    createUpdateDnsZoneTool({ client: openproviderClient, tokenManager }),
    createCreateNameserverTool({ client: openproviderClient, tokenManager }),
    createUpdateNameserverTool({ client: openproviderClient, tokenManager }),
    createCreateNsGroupTool({ client: openproviderClient, tokenManager }),
    createUpdateNsGroupTool({ client: openproviderClient, tokenManager }),
    createCreateDnsTemplateTool({ client: openproviderClient, tokenManager }),
    createCreateDomainTokenTool({ client: openproviderClient, tokenManager }),
    createDeleteDnsZoneTool({ client: openproviderClient, tokenManager }),
    createDeleteNameserverTool({ client: openproviderClient, tokenManager }),
    createDeleteNsGroupTool({ client: openproviderClient, tokenManager }),
    createDeleteDnsTemplateTool({ client: openproviderClient, tokenManager }),
    createListTldsTool({ client: openproviderClient, tokenManager }),
    createGetTldTool({ client: openproviderClient, tokenManager }),
    createGetDomainPriceTool({ client: openproviderClient, tokenManager }),
    createListTagsTool({ client: openproviderClient, tokenManager }),
    createCreateTagTool({ client: openproviderClient, tokenManager }),
    createDeleteTagTool({ client: openproviderClient, tokenManager }),
    createListSslProductsTool({ client: openproviderClient, tokenManager }),
    createGetSslProductTool({ client: openproviderClient, tokenManager }),
    createListSslOrdersTool({ client: openproviderClient, tokenManager }),
    createGetSslOrderTool({ client: openproviderClient, tokenManager }),
    createGetSslApproverEmailsTool({ client: openproviderClient, tokenManager }),
    createUpdateSslOrderTool({ client: openproviderClient, tokenManager }),
    createUpdateSslApproverEmailTool({ client: openproviderClient, tokenManager }),
    createResendSslApproverEmailTool({ client: openproviderClient, tokenManager }),
    createCreateCsrTool({ client: openproviderClient, tokenManager }),
    createDecodeCsrTool({ client: openproviderClient, tokenManager }),
    createCreateSslOtpTokenTool({ client: openproviderClient, tokenManager }),
    createCreateSslOrderTool({ client: openproviderClient, tokenManager }),
    createRenewSslOrderTool({ client: openproviderClient, tokenManager }),
    createReissueSslOrderTool({ client: openproviderClient, tokenManager }),
    createCancelSslOrderTool({ client: openproviderClient, tokenManager }),
    createListCustomersTool({ client: openproviderClient, tokenManager }),
    createGetCustomerTool({ client: openproviderClient, tokenManager }),
    createCreateCustomerTool({ client: openproviderClient, tokenManager }),
    createUpdateCustomerTool({ client: openproviderClient, tokenManager }),
    createDeleteCustomerTool({ client: openproviderClient, tokenManager }),
    createListEmailTemplatesTool({ client: openproviderClient, tokenManager }),
    createCreateEmailTemplateTool({ client: openproviderClient, tokenManager }),
    createUpdateEmailTemplateTool({ client: openproviderClient, tokenManager }),
    createDeleteEmailTemplateTool({ client: openproviderClient, tokenManager }),
    createListEmailVerificationDomainsTool({ client: openproviderClient, tokenManager }),
    createStartEmailVerificationTool({ client: openproviderClient, tokenManager }),
    createRestartEmailVerificationTool({ client: openproviderClient, tokenManager }),
    createGetDmarcTool({ client: openproviderClient, tokenManager }),
    createListDmarcSubscriptionsTool({ client: openproviderClient, tokenManager }),
    createCreateDmarcTool({ client: openproviderClient, tokenManager }),
    createRetryDmarcTool({ client: openproviderClient, tokenManager }),
    createDmarcSsoLoginTool({ client: openproviderClient, tokenManager }),
    createDeleteDmarcTool({ client: openproviderClient, tokenManager }),
    createGetSpamExpertsDomainTool({ client: openproviderClient, tokenManager }),
    createSpamExpertsLoginUrlTool({ client: openproviderClient, tokenManager }),
    createCreateSpamExpertsDomainTool({ client: openproviderClient, tokenManager }),
    createUpdateSpamExpertsDomainTool({ client: openproviderClient, tokenManager }),
    createDeleteSpamExpertsDomainTool({ client: openproviderClient, tokenManager }),
    createListLicensePricesTool({ client: openproviderClient, tokenManager }),
    createListLicenseItemsTool({ client: openproviderClient, tokenManager }),
    createListPleskLicensesTool({ client: openproviderClient, tokenManager }),
    createGetPleskLicenseTool({ client: openproviderClient, tokenManager }),
    createGetPleskKeyTool({ client: openproviderClient, tokenManager }),
    createCreatePleskLicenseTool({ client: openproviderClient, tokenManager }),
    createUpdatePleskLicenseTool({ client: openproviderClient, tokenManager }),
    createResetPleskHwidTool({ client: openproviderClient, tokenManager }),
    createDeletePleskLicenseTool({ client: openproviderClient, tokenManager }),
  ];
}
