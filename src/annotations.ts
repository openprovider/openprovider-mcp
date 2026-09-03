/**
 * MCP tool annotations for every tool in the catalog, keyed by tool name and
 * attached to the tools/list response (spec 2025-03-26 ToolAnnotations).
 *
 * Clients use these hints to decide what may run unprompted, so the safety
 * direction is asymmetric: marking a write as read-only lets a client execute
 * it without confirmation, while the reverse merely causes an extra prompt.
 * When in doubt a tool is therefore NOT read-only and IS destructive.
 *
 * Classification notes from the audit:
 * - decode_csr parses a CSR without persisting anything -> read-only.
 * - The read-sounding token/login tools (create_csr, create_domain_token,
 *   create_ssl_otp_token, spam_experts_login_url, dmarc_sso_login) mint a
 *   credential or session upstream, so they are writes -- annotated
 *   non-read-only + non-destructive rather than split: each wraps exactly one
 *   upstream operation, so there is no read half to split off. That audit found
 *   no tool combining an independent read and write that would need a split.
 * - destructiveHint is true for deletes, updates (state replacement), resets,
 *   approvals, and every billable/irreversible purchase (register/renew/
 *   transfer/trade/restore/SSL orders/licences/DMARC/SpamExperts): money spent
 *   at a registry cannot be un-spent. This standalone build has NO approval
 *   step, so destructive tools execute immediately — clients should surface
 *   these hints prominently.
 * - idempotentHint is true where a repeat with identical args cannot act twice:
 *   deletes, full updates, cancel.
 * - openWorldHint is true for everything: every tool reaches Openprovider.
 *   (The hosted deployment's tenant-local confirmation tools do not exist in
 *   this standalone build, which is why this map has 95 entries, not 97.)
 */
export interface ToolAnnotations {
  title?: string;
  readOnlyHint?: boolean;
  destructiveHint?: boolean;
  idempotentHint?: boolean;
  openWorldHint?: boolean;
}

export const TOOL_ANNOTATIONS: Record<string, ToolAnnotations> = {
  approve_domain_transfer: {
    title: 'Approve domain transfer',
    readOnlyHint: false,
    destructiveHint: true,
    openWorldHint: true,
  },
  cancel_ssl_order: {
    title: 'Cancel SSL order',
    readOnlyHint: false,
    destructiveHint: true,
    idempotentHint: true,
    openWorldHint: true,
  },
  check_domain: { title: 'Check domain availability', readOnlyHint: true, openWorldHint: true },
  create_contact: {
    title: 'Create contact',
    readOnlyHint: false,
    destructiveHint: false,
    openWorldHint: true,
  },
  create_csr: {
    title: 'Generate certificate CSR',
    readOnlyHint: false,
    destructiveHint: false,
    openWorldHint: true,
  },
  create_customer: {
    title: 'Create customer',
    readOnlyHint: false,
    destructiveHint: false,
    openWorldHint: true,
  },
  create_dmarc: {
    title: 'Create DMARC subscription',
    readOnlyHint: false,
    destructiveHint: true,
    openWorldHint: true,
  },
  create_dns_template: {
    title: 'Create DNS template',
    readOnlyHint: false,
    destructiveHint: false,
    openWorldHint: true,
  },
  create_dns_zone: {
    title: 'Create DNS zone',
    readOnlyHint: false,
    destructiveHint: false,
    openWorldHint: true,
  },
  create_domain_token: {
    title: 'Create domain DNS token',
    readOnlyHint: false,
    destructiveHint: false,
    openWorldHint: true,
  },
  create_email_template: {
    title: 'Create email template',
    readOnlyHint: false,
    destructiveHint: false,
    openWorldHint: true,
  },
  create_nameserver: {
    title: 'Create nameserver',
    readOnlyHint: false,
    destructiveHint: false,
    openWorldHint: true,
  },
  create_ns_group: {
    title: 'Create NS group',
    readOnlyHint: false,
    destructiveHint: false,
    openWorldHint: true,
  },
  create_plesk_license: {
    title: 'Create Plesk license',
    readOnlyHint: false,
    destructiveHint: true,
    openWorldHint: true,
  },
  create_spam_experts_domain: {
    title: 'Create spam experts domain',
    readOnlyHint: false,
    destructiveHint: true,
    openWorldHint: true,
  },
  create_ssl_order: {
    title: 'Create SSL order',
    readOnlyHint: false,
    destructiveHint: true,
    openWorldHint: true,
  },
  create_ssl_otp_token: {
    title: 'Create SSL one-time token',
    readOnlyHint: false,
    destructiveHint: false,
    openWorldHint: true,
  },
  create_tag: {
    title: 'Create tag',
    readOnlyHint: false,
    destructiveHint: false,
    openWorldHint: true,
  },
  decode_csr: { title: 'Decode certificate CSR', readOnlyHint: true, openWorldHint: true },
  delete_contact: {
    title: 'Delete contact',
    readOnlyHint: false,
    destructiveHint: true,
    idempotentHint: true,
    openWorldHint: true,
  },
  delete_customer: {
    title: 'Delete customer',
    readOnlyHint: false,
    destructiveHint: true,
    idempotentHint: true,
    openWorldHint: true,
  },
  delete_dmarc: {
    title: 'Delete DMARC subscription',
    readOnlyHint: false,
    destructiveHint: true,
    idempotentHint: true,
    openWorldHint: true,
  },
  delete_dns_template: {
    title: 'Delete DNS template',
    readOnlyHint: false,
    destructiveHint: true,
    idempotentHint: true,
    openWorldHint: true,
  },
  delete_dns_zone: {
    title: 'Delete DNS zone',
    readOnlyHint: false,
    destructiveHint: true,
    idempotentHint: true,
    openWorldHint: true,
  },
  delete_domain: {
    title: 'Delete domain',
    readOnlyHint: false,
    destructiveHint: true,
    idempotentHint: true,
    openWorldHint: true,
  },
  delete_email_template: {
    title: 'Delete email template',
    readOnlyHint: false,
    destructiveHint: true,
    idempotentHint: true,
    openWorldHint: true,
  },
  delete_nameserver: {
    title: 'Delete nameserver',
    readOnlyHint: false,
    destructiveHint: true,
    idempotentHint: true,
    openWorldHint: true,
  },
  delete_ns_group: {
    title: 'Delete NS group',
    readOnlyHint: false,
    destructiveHint: true,
    idempotentHint: true,
    openWorldHint: true,
  },
  delete_plesk_license: {
    title: 'Delete Plesk license',
    readOnlyHint: false,
    destructiveHint: true,
    idempotentHint: true,
    openWorldHint: true,
  },
  delete_spam_experts_domain: {
    title: 'Delete spam experts domain',
    readOnlyHint: false,
    destructiveHint: true,
    idempotentHint: true,
    openWorldHint: true,
  },
  delete_tag: {
    title: 'Delete tag',
    readOnlyHint: false,
    destructiveHint: true,
    idempotentHint: true,
    openWorldHint: true,
  },
  dmarc_sso_login: {
    title: 'Create DMARC dashboard login link',
    readOnlyHint: false,
    destructiveHint: false,
    openWorldHint: true,
  },
  get_contact: { title: 'Get contact', readOnlyHint: true, openWorldHint: true },
  get_customer: { title: 'Get customer', readOnlyHint: true, openWorldHint: true },
  get_dmarc: { title: 'Get DMARC subscription', readOnlyHint: true, openWorldHint: true },
  get_dns_template: { title: 'Get DNS template', readOnlyHint: true, openWorldHint: true },
  get_dns_zone: { title: 'Get DNS zone', readOnlyHint: true, openWorldHint: true },
  get_domain: { title: 'Get domain', readOnlyHint: true, openWorldHint: true },
  get_domain_authcode: {
    title: 'Get domain transfer code',
    readOnlyHint: true,
    openWorldHint: true,
  },
  get_domain_price: { title: 'Get domain price', readOnlyHint: true, openWorldHint: true },
  get_nameserver: { title: 'Get nameserver', readOnlyHint: true, openWorldHint: true },
  get_ns_group: { title: 'Get NS group', readOnlyHint: true, openWorldHint: true },
  get_plesk_key: { title: 'Get Plesk licence key', readOnlyHint: true, openWorldHint: true },
  get_plesk_license: { title: 'Get Plesk license', readOnlyHint: true, openWorldHint: true },
  get_spam_experts_domain: {
    title: 'Get spam experts domain',
    readOnlyHint: true,
    openWorldHint: true,
  },
  get_ssl_approver_emails: {
    title: 'List allowed SSL approver emails',
    readOnlyHint: true,
    openWorldHint: true,
  },
  get_ssl_order: { title: 'Get SSL order', readOnlyHint: true, openWorldHint: true },
  get_ssl_product: { title: 'Get SSL product', readOnlyHint: true, openWorldHint: true },
  get_tld: { title: 'Get TLD details', readOnlyHint: true, openWorldHint: true },
  list_contacts: { title: 'List contacts', readOnlyHint: true, openWorldHint: true },
  list_customers: { title: 'List customers', readOnlyHint: true, openWorldHint: true },
  list_dmarc_subscriptions: {
    title: 'List DMARC subscriptions',
    readOnlyHint: true,
    openWorldHint: true,
  },
  list_dns_templates: { title: 'List DNS templates', readOnlyHint: true, openWorldHint: true },
  list_dns_zone_records: {
    title: 'List DNS zone records',
    readOnlyHint: true,
    openWorldHint: true,
  },
  list_dns_zones: { title: 'List DNS zones', readOnlyHint: true, openWorldHint: true },
  list_domains: { title: 'List domains', readOnlyHint: true, openWorldHint: true },
  list_email_templates: { title: 'List email templates', readOnlyHint: true, openWorldHint: true },
  list_email_verification_domains: {
    title: 'List email verification domains',
    readOnlyHint: true,
    openWorldHint: true,
  },
  list_license_items: { title: 'List license items', readOnlyHint: true, openWorldHint: true },
  list_license_prices: { title: 'List license prices', readOnlyHint: true, openWorldHint: true },
  list_nameservers: { title: 'List nameservers', readOnlyHint: true, openWorldHint: true },
  list_ns_groups: { title: 'List NS groups', readOnlyHint: true, openWorldHint: true },
  list_plesk_licenses: { title: 'List Plesk licenses', readOnlyHint: true, openWorldHint: true },
  list_ssl_orders: { title: 'List SSL orders', readOnlyHint: true, openWorldHint: true },
  list_ssl_products: { title: 'List SSL products', readOnlyHint: true, openWorldHint: true },
  list_tags: { title: 'List tags', readOnlyHint: true, openWorldHint: true },
  list_tlds: { title: 'List TLDs', readOnlyHint: true, openWorldHint: true },
  register_domain: {
    title: 'Register domain',
    readOnlyHint: false,
    destructiveHint: true,
    openWorldHint: true,
  },
  reissue_ssl_order: {
    title: 'Reissue SSL order',
    readOnlyHint: false,
    destructiveHint: true,
    openWorldHint: true,
  },
  renew_domain: {
    title: 'Renew domain',
    readOnlyHint: false,
    destructiveHint: true,
    openWorldHint: true,
  },
  renew_ssl_order: {
    title: 'Renew SSL order',
    readOnlyHint: false,
    destructiveHint: true,
    openWorldHint: true,
  },
  resend_ssl_approver_email: {
    title: 'Resend SSL approval email',
    readOnlyHint: false,
    destructiveHint: false,
    openWorldHint: true,
  },
  reset_domain_authcode: {
    title: 'Reset domain transfer code',
    readOnlyHint: false,
    destructiveHint: true,
    openWorldHint: true,
  },
  reset_plesk_hwid: {
    title: 'Reset Plesk hardware binding',
    readOnlyHint: false,
    destructiveHint: true,
    openWorldHint: true,
  },
  restart_domain_operation: {
    title: 'Restart failed domain operation',
    readOnlyHint: false,
    destructiveHint: true,
    openWorldHint: true,
  },
  restart_email_verification: {
    title: 'Restart email verification',
    readOnlyHint: false,
    destructiveHint: false,
    openWorldHint: true,
  },
  restore_domain: {
    title: 'Restore domain',
    readOnlyHint: false,
    destructiveHint: true,
    openWorldHint: true,
  },
  retry_dmarc: {
    title: 'Retry DMARC order',
    readOnlyHint: false,
    destructiveHint: false,
    openWorldHint: true,
  },
  send_foa1_domain_transfer: {
    title: 'Send transfer approval email (FOA1)',
    readOnlyHint: false,
    destructiveHint: false,
    openWorldHint: true,
  },
  spam_experts_login_url: {
    title: 'Create SpamExperts login link',
    readOnlyHint: false,
    destructiveHint: false,
    openWorldHint: true,
  },
  start_email_verification: {
    title: 'Start email verification',
    readOnlyHint: false,
    destructiveHint: false,
    openWorldHint: true,
  },
  suggest_domain: { title: 'Suggest domain names', readOnlyHint: true, openWorldHint: true },
  trade_domain: {
    title: 'Trade domain',
    readOnlyHint: false,
    destructiveHint: true,
    openWorldHint: true,
  },
  transfer_domain: {
    title: 'Transfer domain',
    readOnlyHint: false,
    destructiveHint: true,
    openWorldHint: true,
  },
  update_contact: {
    title: 'Update contact',
    readOnlyHint: false,
    destructiveHint: true,
    idempotentHint: true,
    openWorldHint: true,
  },
  update_customer: {
    title: 'Update customer',
    readOnlyHint: false,
    destructiveHint: true,
    idempotentHint: true,
    openWorldHint: true,
  },
  update_dns_zone: {
    title: 'Update DNS zone',
    readOnlyHint: false,
    destructiveHint: true,
    idempotentHint: true,
    openWorldHint: true,
  },
  update_domain: {
    title: 'Update domain',
    readOnlyHint: false,
    destructiveHint: true,
    idempotentHint: true,
    openWorldHint: true,
  },
  update_email_template: {
    title: 'Update email template',
    readOnlyHint: false,
    destructiveHint: true,
    idempotentHint: true,
    openWorldHint: true,
  },
  update_nameserver: {
    title: 'Update nameserver',
    readOnlyHint: false,
    destructiveHint: true,
    idempotentHint: true,
    openWorldHint: true,
  },
  update_ns_group: {
    title: 'Update NS group',
    readOnlyHint: false,
    destructiveHint: true,
    idempotentHint: true,
    openWorldHint: true,
  },
  update_plesk_license: {
    title: 'Update Plesk license',
    readOnlyHint: false,
    destructiveHint: true,
    idempotentHint: true,
    openWorldHint: true,
  },
  update_spam_experts_domain: {
    title: 'Update spam experts domain',
    readOnlyHint: false,
    destructiveHint: true,
    idempotentHint: true,
    openWorldHint: true,
  },
  update_ssl_approver_email: {
    title: 'Change SSL approver email',
    readOnlyHint: false,
    destructiveHint: true,
    idempotentHint: true,
    openWorldHint: true,
  },
  update_ssl_order: {
    title: 'Update SSL order',
    readOnlyHint: false,
    destructiveHint: true,
    idempotentHint: true,
    openWorldHint: true,
  },
};
