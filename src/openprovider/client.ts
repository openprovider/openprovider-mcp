import CircuitBreaker from 'opossum';
import {
  OpenproviderAuthError,
  OpenproviderRateLimitError,
  OpenproviderUnavailableError,
  OpenproviderClientError,
  mapOpenproviderError,
  opEnvelope,
} from './errors.js';
import { redactSensitive } from '../observability/redact.js';
import { stripDomainSecrets } from './redact-response.js';
import {
  CheckDomainArgs,
  CheckDomainResult,
  ListDomainsArgs,
  ListContactsArgs,
  RegisterDomainArgs,
  UpdateDomainArgs,
  CreateContactArgs,
  UpdateContactArgs,
  SuggestDomainArgs,
  ResetAuthcodeArgs,
  ApproveTransferArgs,
  RenewDomainArgs,
  TransferDomainArgs,
  TradeDomainArgs,
  RestoreDomainArgs,
  RestartDomainOperationArgs,
  CreateDnsZoneArgs,
  UpdateDnsZoneArgs,
  CreateNameserverArgs,
  UpdateNameserverArgs,
  CreateNsGroupArgs,
  UpdateNsGroupArgs,
  CreateDnsTemplateArgs,
  CreateDomainTokenArgs,
  GetDomainPriceArgs,
  CreateTagArgs,
  DeleteTagArgs,
  GetSslApproverEmailsArgs,
  CreateSslOrderArgs,
  UpdateSslOrderArgs,
  ReissueSslOrderArgs,
  RenewSslOrderArgs,
  CancelSslOrderArgs,
  UpdateSslApproverEmailArgs,
  ResendSslApproverEmailArgs,
  CreateCsrArgs,
  DecodeCsrArgs,
  CreateSslOtpTokenArgs,
  CreateCustomerArgs,
  UpdateCustomerArgs,
  CreateEmailTemplateArgs,
  UpdateEmailTemplateArgs,
  StartEmailVerificationArgs,
  RestartEmailVerificationArgs,
  GetDmarcArgs,
  CreateDmarcArgs,
  RetryDmarcArgs,
  DmarcSsoLoginArgs,
  SpamExpertsLoginUrlArgs,
  CreateSpamExpertsDomainArgs,
  UpdateSpamExpertsDomainArgs,
  CreatePleskLicenseArgs,
  UpdatePleskLicenseArgs,
  ResetPleskHwidArgs,
} from './types.js';

/** Minimal logger surface — accepts pino, console, or anything else with these four methods. */
export interface ClientLogger {
  debug(obj: object, msg?: string): void;
  info(obj: object, msg?: string): void;
  warn(obj: object, msg?: string): void;
  error(obj: object, msg?: string): void;
}

export interface OpenproviderClientConfig {
  baseUrl?: string;
  fetchImpl?: typeof fetch;
  /** When set, every OP request emits a structured log line (success at debug, failures at warn/error). */
  logger?: ClientLogger;
  /** Per-request abort timeout (ms). Defaults to 60s — kept just under the 65s breaker timeout. */
  requestTimeoutMs?: number;
  /**
   * Longer abort timeout (ms) for slow registry write operations
   * (register/renew/transfer/trade/restore). Some ccTLD registries process
   * these synchronously for well over the 60s default, so the normal
   * AbortController would cut a legitimate registration. Defaults to 110s —
   * keep this BELOW the edge/load-balancer backend timeout (the GKE Gateway
   * backend timeout must be raised to >= 120s via a GCPBackendPolicy, else the
   * LB terminates the connection first: "SSE stream disconnected: terminated").
   */
  slowWriteTimeoutMs?: number;
  breakerOptions?: {
    timeout?: number;
    errorThresholdPercentage?: number;
    volumeThreshold?: number;
    resetTimeout?: number;
  };
}

export interface OpenproviderClient {
  checkDomain(token: string, args: CheckDomainArgs): Promise<CheckDomainResult>;
  listDomains(token: string, args: ListDomainsArgs): Promise<unknown>;
  getDomain(token: string, id: number): Promise<unknown>;
  listContacts(token: string, args: ListContactsArgs): Promise<unknown>;
  getContact(token: string, id: number): Promise<unknown>;
  registerDomain(
    token: string,
    args: RegisterDomainArgs,
    idempotencyKey?: string,
  ): Promise<unknown>;
  updateDomain(
    token: string,
    id: number,
    args: UpdateDomainArgs,
    idempotencyKey?: string,
  ): Promise<unknown>;
  createContact(token: string, args: CreateContactArgs, idempotencyKey?: string): Promise<unknown>;
  updateContact(
    token: string,
    id: number,
    args: UpdateContactArgs,
    idempotencyKey?: string,
  ): Promise<unknown>;
  deleteContact(token: string, id: number, idempotencyKey?: string): Promise<unknown>;
  suggestDomain(token: string, args: SuggestDomainArgs): Promise<unknown>;
  getDomainAuthcode(token: string, id: number): Promise<unknown>;
  resetDomainAuthcode(token: string, args: ResetAuthcodeArgs): Promise<unknown>;
  approveDomainTransfer(token: string, args: ApproveTransferArgs): Promise<unknown>;
  sendFoa1DomainTransfer(token: string, id: number): Promise<unknown>;
  deleteDomain(token: string, id: number): Promise<unknown>;
  restartDomainOperation(token: string, args: RestartDomainOperationArgs): Promise<unknown>;
  renewDomain(token: string, args: RenewDomainArgs): Promise<unknown>;
  transferDomain(token: string, args: TransferDomainArgs): Promise<unknown>;
  tradeDomain(token: string, args: TradeDomainArgs): Promise<unknown>;
  restoreDomain(token: string, args: RestoreDomainArgs): Promise<unknown>;
  // DNS methods
  listDnsZones(token: string): Promise<unknown>;
  getDnsZone(token: string, name: string): Promise<unknown>;
  listDnsZoneRecords(token: string, name: string): Promise<unknown>;
  listNameservers(token: string): Promise<unknown>;
  getNameserver(token: string, name: string): Promise<unknown>;
  listNsGroups(token: string): Promise<unknown>;
  getNsGroup(token: string, nsGroup: string): Promise<unknown>;
  listDnsTemplates(token: string): Promise<unknown>;
  getDnsTemplate(token: string, id: number): Promise<unknown>;
  createDnsZone(token: string, args: CreateDnsZoneArgs): Promise<unknown>;
  updateDnsZone(token: string, args: UpdateDnsZoneArgs): Promise<unknown>;
  createNameserver(token: string, args: CreateNameserverArgs): Promise<unknown>;
  updateNameserver(token: string, args: UpdateNameserverArgs): Promise<unknown>;
  createNsGroup(token: string, args: CreateNsGroupArgs): Promise<unknown>;
  updateNsGroup(token: string, args: UpdateNsGroupArgs): Promise<unknown>;
  createDnsTemplate(token: string, args: CreateDnsTemplateArgs): Promise<unknown>;
  createDomainToken(token: string, args: CreateDomainTokenArgs): Promise<unknown>;
  deleteDnsZone(token: string, name: string): Promise<unknown>;
  deleteNameserver(token: string, name: string): Promise<unknown>;
  deleteNsGroup(token: string, nsGroup: string): Promise<unknown>;
  deleteDnsTemplate(token: string, id: number): Promise<unknown>;
  // Catalog + tag methods
  listTlds(token: string): Promise<unknown>;
  getTld(token: string, name: string): Promise<unknown>;
  getDomainPrice(token: string, args: GetDomainPriceArgs): Promise<unknown>;
  listTags(token: string): Promise<unknown>;
  createTag(token: string, args: CreateTagArgs): Promise<unknown>;
  deleteTag(token: string, args: DeleteTagArgs): Promise<unknown>;
  // SSL methods
  listSslProducts(token: string): Promise<unknown>;
  getSslProduct(token: string, id: number): Promise<unknown>;
  listSslOrders(token: string): Promise<unknown>;
  getSslOrder(token: string, id: number): Promise<unknown>;
  getSslApproverEmails(token: string, args: GetSslApproverEmailsArgs): Promise<unknown>;
  createSslOrder(token: string, args: CreateSslOrderArgs): Promise<unknown>;
  renewSslOrder(token: string, args: RenewSslOrderArgs): Promise<unknown>;
  reissueSslOrder(token: string, args: ReissueSslOrderArgs): Promise<unknown>;
  cancelSslOrder(token: string, args: CancelSslOrderArgs): Promise<unknown>;
  updateSslOrder(token: string, args: UpdateSslOrderArgs): Promise<unknown>;
  updateSslApproverEmail(token: string, args: UpdateSslApproverEmailArgs): Promise<unknown>;
  resendSslApproverEmail(token: string, args: ResendSslApproverEmailArgs): Promise<unknown>;
  createCsr(token: string, args: CreateCsrArgs): Promise<unknown>;
  decodeCsr(token: string, args: DecodeCsrArgs): Promise<unknown>;
  createSslOtpToken(token: string, args: CreateSslOtpTokenArgs): Promise<unknown>;
  // Customer methods
  listCustomers(token: string): Promise<unknown>;
  getCustomer(token: string, handle: string): Promise<unknown>;
  createCustomer(token: string, args: CreateCustomerArgs): Promise<unknown>;
  updateCustomer(token: string, args: UpdateCustomerArgs): Promise<unknown>;
  deleteCustomer(token: string, handle: string): Promise<unknown>;
  // Email template methods
  listEmailTemplates(token: string): Promise<unknown>;
  createEmailTemplate(token: string, args: CreateEmailTemplateArgs): Promise<unknown>;
  updateEmailTemplate(token: string, args: UpdateEmailTemplateArgs): Promise<unknown>;
  deleteEmailTemplate(token: string, id: number): Promise<unknown>;
  // Email verification methods
  listEmailVerificationDomains(token: string): Promise<unknown>;
  startEmailVerification(token: string, args: StartEmailVerificationArgs): Promise<unknown>;
  restartEmailVerification(token: string, args: RestartEmailVerificationArgs): Promise<unknown>;
  // EasyDmarc methods
  getDmarc(token: string, args: GetDmarcArgs): Promise<unknown>;
  listDmarcSubscriptions(token: string): Promise<unknown>;
  createDmarc(token: string, args: CreateDmarcArgs): Promise<unknown>;
  retryDmarc(token: string, args: RetryDmarcArgs): Promise<unknown>;
  dmarcSsoLogin(token: string, args: DmarcSsoLoginArgs): Promise<unknown>;
  deleteDmarc(token: string, id: number): Promise<unknown>;
  // SpamExperts methods
  getSpamExpertsDomain(token: string, domainName: string): Promise<unknown>;
  spamExpertsLoginUrl(token: string, args: SpamExpertsLoginUrlArgs): Promise<unknown>;
  createSpamExpertsDomain(token: string, args: CreateSpamExpertsDomainArgs): Promise<unknown>;
  updateSpamExpertsDomain(token: string, args: UpdateSpamExpertsDomainArgs): Promise<unknown>;
  deleteSpamExpertsDomain(token: string, domainName: string): Promise<unknown>;
  // License methods
  listLicensePrices(token: string): Promise<unknown>;
  listLicenseItems(token: string): Promise<unknown>;
  listPleskLicenses(token: string): Promise<unknown>;
  getPleskLicense(token: string, keyId: number): Promise<unknown>;
  getPleskKey(token: string, keyId: number): Promise<unknown>;
  createPleskLicense(token: string, args: CreatePleskLicenseArgs): Promise<unknown>;
  updatePleskLicense(token: string, args: UpdatePleskLicenseArgs): Promise<unknown>;
  resetPleskHwid(token: string, args: ResetPleskHwidArgs): Promise<unknown>;
  deletePleskLicense(token: string, keyId: number): Promise<unknown>;
}

const DEFAULT_BASE = 'https://api.openprovider.eu/v1beta';

export function createOpenproviderClient(
  config: OpenproviderClientConfig = {},
): OpenproviderClient {
  const baseUrl = config.baseUrl ?? DEFAULT_BASE;
  const fetcher = config.fetchImpl ?? fetch;
  const log = config.logger;
  const requestTimeoutMs = config.requestTimeoutMs ?? 60_000;
  const slowWriteTimeoutMs = config.slowWriteTimeoutMs ?? 110_000;

  async function request(
    method: string,
    path: string,
    token: string,
    body?: unknown,
    extraHeaders?: Record<string, string>,
    timeoutMs: number = requestTimeoutMs,
  ): Promise<unknown> {
    const attempt = async (n: number): Promise<unknown> => {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), timeoutMs);
      const startedAt = Date.now();
      // Redacted view of the outgoing body for logging.  redactSensitive strips
      // keys like `password`, `client_secret`, `contact.password` (see
      // src/observability/redact.ts).  GET requests have no body.
      const requestBody = body !== undefined ? redactSensitive(body) : undefined;
      // Pre-flight log so the exact request being sent is visible *before* the
      // response — useful when the call hangs / times out and there is no
      // post-response log to look at.
      log?.info(
        {
          event: 'op_request_sending',
          method,
          baseUrl,
          path,
          url: `${baseUrl}${path}`,
          requestBody,
        },
        'openprovider request',
      );
      try {
        const res = await fetcher(`${baseUrl}${path}`, {
          method,
          headers: {
            'content-type': 'application/json',
            authorization: `Bearer ${token}`,
            // No custom User-Agent: Openprovider's API rejects the literal
            // string "openprovider-mcp/0.2.0-phase2" with code 10005 (verified
            // by sending the same authenticated request with vs without this
            // header from the same source IP).  Let undici send its default.
            ...(extraHeaders ?? {}),
          },
          body: body === undefined ? null : JSON.stringify(body),
          signal: ctrl.signal,
        });
        const durationMs = Date.now() - startedAt;
        if (res.status >= 500) {
          // Read the body up-front. OP sometimes returns 500 with a business
          // error envelope (`{"code":196}` invalid credentials, `{"code":309}`
          // registrant contract not signed) rather than a 401/4xx. Those are
          // deterministic — retrying can't help — so we fail fast on them and
          // surface an actionable code/message instead of a bare upstream_error.
          const text = await res.text().catch(() => '');
          const { opCode, opDesc } = opEnvelope(text);
          const info = mapOpenproviderError(res.status, opCode, opDesc, text);
          if (!info.terminal && n < 3) {
            const backoff = [250, 1000, 4000][n] ?? 4000;
            log?.warn(
              {
                event: 'op_request_retry',
                method,
                baseUrl,
                path,
                requestBody,
                status: res.status,
                opCode,
                attempt: n + 1,
                backoffMs: backoff,
                durationMs,
              },
              'openprovider 5xx — retrying',
            );
            await new Promise((r) => setTimeout(r, backoff));
            return attempt(n + 1);
          }
          log?.error(
            {
              event: 'op_request_failed',
              method,
              baseUrl,
              path,
              url: `${baseUrl}${path}`,
              requestBody,
              status: res.status,
              opCode,
              opDesc,
              terminal: info.terminal,
              attempt: n + 1,
              durationMs,
            },
            info.terminal
              ? 'openprovider 5xx business error'
              : 'openprovider 5xx exhausted retries',
          );
          throw new OpenproviderUnavailableError(info.message, info.code, opCode);
        }
        if (res.status === 429) {
          const retryAfter = res.headers.get('retry-after');
          if (n < 2) {
            const wait = retryAfter ? Number(retryAfter) * 1000 : 1000;
            log?.warn(
              {
                event: 'op_request_rate_limited',
                method,
                baseUrl,
                path,
                requestBody,
                attempt: n + 1,
                retryAfterMs: wait,
                durationMs,
              },
              'openprovider 429 — retrying',
            );
            await new Promise((r) => setTimeout(r, wait));
            return attempt(n + 1);
          }
          log?.error(
            {
              event: 'op_request_failed',
              method,
              baseUrl,
              path,
              url: `${baseUrl}${path}`,
              requestBody,
              status: 429,
              durationMs,
            },
            'openprovider 429 exhausted retries',
          );
          throw new OpenproviderRateLimitError('upstream 429');
        }
        if (res.status === 401) {
          log?.error(
            {
              event: 'op_request_failed',
              method,
              baseUrl,
              path,
              url: `${baseUrl}${path}`,
              requestBody,
              status: 401,
              durationMs,
            },
            'openprovider 401',
          );
          throw new OpenproviderAuthError('upstream 401');
        }
        if (res.status >= 400) {
          const text = await res.text();
          const { opCode, opDesc } = opEnvelope(text);
          const info = mapOpenproviderError(res.status, opCode, opDesc, text);
          log?.warn(
            {
              event: 'op_request_failed',
              method,
              baseUrl,
              path,
              url: `${baseUrl}${path}`,
              requestBody,
              status: res.status,
              opCode,
              opDesc,
              durationMs,
            },
            'openprovider 4xx',
          );
          throw new OpenproviderClientError(info.message, res.status, info.code, opCode);
        }
        log?.info(
          {
            event: 'op_request_ok',
            method,
            baseUrl,
            path,
            requestBody,
            status: res.status,
            durationMs,
          },
          'openprovider ok',
        );
        return (await res.json()) as unknown;
      } catch (err) {
        // Typed upstream errors (4xx/5xx/429/401) are intentional — pass through.
        if (
          err instanceof OpenproviderClientError ||
          err instanceof OpenproviderRateLimitError ||
          err instanceof OpenproviderAuthError ||
          err instanceof OpenproviderUnavailableError
        ) {
          throw err;
        }
        // Otherwise this is a transport-level failure: our abort (timeout) or a
        // connection error (e.g. undici "terminated" on a stale keep-alive
        // socket). Surface a descriptive message instead of a bare, message-less
        // error that the caller can only report as "upstream_error".
        const aborted = ctrl.signal.aborted;
        const detail = err instanceof Error ? err.message : String(err);
        log?.error(
          {
            event: 'op_request_network_error',
            method,
            baseUrl,
            path,
            url: `${baseUrl}${path}`,
            aborted,
            durationMs: Date.now() - startedAt,
            err: detail,
          },
          'openprovider network error',
        );
        throw new OpenproviderUnavailableError(
          aborted
            ? `openprovider request timed out after ${timeoutMs}ms (${method} ${path})`
            : `openprovider connection error (${method} ${path}): ${detail}`,
        );
      } finally {
        clearTimeout(timer);
      }
    };
    return attempt(0);
  }

  function toQuery(params: Record<string, unknown>): string {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null) sp.set(k, String(v));
    }
    const s = sp.toString();
    return s ? `?${s}` : '';
  }

  const checkDomainBreaker = new CircuitBreaker(
    async (token: string, args: CheckDomainArgs) => request('POST', '/domains/check', token, args),
    {
      timeout: config.breakerOptions?.timeout ?? 65_000,
      errorThresholdPercentage: config.breakerOptions?.errorThresholdPercentage ?? 50,
      volumeThreshold: config.breakerOptions?.volumeThreshold ?? 20,
      resetTimeout: config.breakerOptions?.resetTimeout ?? 30_000,
    },
  );
  return {
    async listDomains(token, args) {
      const a = ListDomainsArgs.parse(args);
      const body = await request('GET', `/domains${toQuery(a)}`, token);
      // Strip transfer codes from the bulk read (pentest CRITICAL-02); use
      // get_domain_authcode for deliberate per-domain retrieval.
      return stripDomainSecrets((body as { data?: unknown }).data ?? body);
    },
    async getDomain(token, id) {
      const body = await request('GET', `/domains/${id}`, token);
      return stripDomainSecrets((body as { data?: unknown }).data ?? body);
    },
    async listContacts(token, args) {
      const a = ListContactsArgs.parse(args);
      const body = await request('GET', `/contacts${toQuery(a)}`, token);
      return (body as { data?: unknown }).data ?? body;
    },
    async getContact(token, id) {
      const body = await request('GET', `/contacts/${id}`, token);
      return (body as { data?: unknown }).data ?? body;
    },
    async registerDomain(token, args, idempotencyKey) {
      const parsed = RegisterDomainArgs.parse(args);
      const headers = idempotencyKey ? { 'x-idempotency-key': idempotencyKey } : undefined;
      const body = await request('POST', '/domains', token, parsed, headers, slowWriteTimeoutMs);
      return (body as { data?: unknown }).data ?? body;
    },
    async updateDomain(token, id, args, idempotencyKey) {
      const parsed = UpdateDomainArgs.parse(args);
      const headers = idempotencyKey ? { 'x-idempotency-key': idempotencyKey } : undefined;
      // `id` is in the path; send only the remaining fields as body.
      const bodyArgs = Object.fromEntries(Object.entries(parsed).filter(([k]) => k !== 'id'));
      const body = await request('PUT', `/domains/${id}`, token, bodyArgs, headers);
      return (body as { data?: unknown }).data ?? body;
    },
    async createContact(token, args, idempotencyKey) {
      const parsed = CreateContactArgs.parse(args);
      const headers = idempotencyKey ? { 'x-idempotency-key': idempotencyKey } : undefined;
      const body = await request('POST', '/contacts', token, parsed, headers);
      return (body as { data?: unknown }).data ?? body;
    },
    async updateContact(token, id, args, idempotencyKey) {
      const parsed = UpdateContactArgs.parse(args);
      const headers = idempotencyKey ? { 'x-idempotency-key': idempotencyKey } : undefined;
      // `id` is in the path; send only the remaining fields as body.
      const bodyArgs = Object.fromEntries(Object.entries(parsed).filter(([k]) => k !== 'id'));
      const body = await request('PUT', `/contacts/${id}`, token, bodyArgs, headers);
      return (body as { data?: unknown }).data ?? body;
    },
    async deleteContact(token, id, idempotencyKey) {
      const headers = idempotencyKey ? { 'x-idempotency-key': idempotencyKey } : undefined;
      const body = await request('DELETE', `/contacts/${id}`, token, undefined, headers);
      return (body as { data?: unknown }).data ?? body;
    },
    async suggestDomain(token, args) {
      const parsed = SuggestDomainArgs.parse(args);
      const body = await request('POST', '/domains/suggest-name', token, parsed);
      return (body as { data?: unknown }).data ?? body;
    },
    async getDomainAuthcode(token, id) {
      const body = await request('GET', `/domains/${id}/authcode`, token);
      return (body as { data?: unknown }).data ?? body;
    },
    async resetDomainAuthcode(token, args) {
      const parsed = ResetAuthcodeArgs.parse(args);
      const body = await request('POST', `/domains/${parsed.id}/authcode/reset`, token, parsed);
      return (body as { data?: unknown }).data ?? body;
    },
    async approveDomainTransfer(token, args) {
      const parsed = ApproveTransferArgs.parse(args);
      const body = await request('POST', `/domains/${parsed.id}/transfer/approve`, token, parsed);
      return (body as { data?: unknown }).data ?? body;
    },
    async sendFoa1DomainTransfer(token, id) {
      const body = await request('POST', `/domains/${id}/transfer/send-foa1`, token, { id });
      return (body as { data?: unknown }).data ?? body;
    },
    async deleteDomain(token, id) {
      const body = await request('DELETE', `/domains/${id}`, token);
      return (body as { data?: unknown }).data ?? body;
    },
    async restartDomainOperation(token, args) {
      const parsed = RestartDomainOperationArgs.parse(args);
      const body = await request(
        'POST',
        `/domains/${parsed.id}/last-operation/restart`,
        token,
        parsed,
      );
      return (body as { data?: unknown }).data ?? body;
    },
    async renewDomain(token, args) {
      const parsed = RenewDomainArgs.parse(args);
      const body = await request(
        'POST',
        `/domains/${parsed.id}/renew`,
        token,
        parsed,
        undefined,
        slowWriteTimeoutMs,
      );
      return (body as { data?: unknown }).data ?? body;
    },
    async transferDomain(token, args) {
      const parsed = TransferDomainArgs.parse(args);
      const body = await request(
        'POST',
        '/domains/transfer',
        token,
        parsed,
        undefined,
        slowWriteTimeoutMs,
      );
      return (body as { data?: unknown }).data ?? body;
    },
    async tradeDomain(token, args) {
      const parsed = TradeDomainArgs.parse(args);
      const body = await request(
        'POST',
        '/domains/trade',
        token,
        parsed,
        undefined,
        slowWriteTimeoutMs,
      );
      return (body as { data?: unknown }).data ?? body;
    },
    async restoreDomain(token, args) {
      const parsed = RestoreDomainArgs.parse(args);
      const body = await request(
        'POST',
        `/domains/${parsed.id}/restore`,
        token,
        parsed,
        undefined,
        slowWriteTimeoutMs,
      );
      return (body as { data?: unknown }).data ?? body;
    },
    // DNS reads
    async listDnsZones(token) {
      const b = await request('GET', '/dns/zones', token);
      return (b as { data?: unknown }).data ?? b;
    },
    async getDnsZone(token, name) {
      const b = await request('GET', `/dns/zones/${encodeURIComponent(name)}`, token);
      return (b as { data?: unknown }).data ?? b;
    },
    async listDnsZoneRecords(token, name) {
      const b = await request('GET', `/dns/zones/${encodeURIComponent(name)}/records`, token);
      return (b as { data?: unknown }).data ?? b;
    },
    async listNameservers(token) {
      const b = await request('GET', '/dns/nameservers', token);
      return (b as { data?: unknown }).data ?? b;
    },
    async getNameserver(token, name) {
      const b = await request('GET', `/dns/nameservers/${encodeURIComponent(name)}`, token);
      return (b as { data?: unknown }).data ?? b;
    },
    async listNsGroups(token) {
      const b = await request('GET', '/dns/nameservers/groups', token);
      return (b as { data?: unknown }).data ?? b;
    },
    async getNsGroup(token, nsGroup) {
      const b = await request(
        'GET',
        `/dns/nameservers/groups/${encodeURIComponent(nsGroup)}`,
        token,
      );
      return (b as { data?: unknown }).data ?? b;
    },
    async listDnsTemplates(token) {
      const b = await request('GET', '/dns/templates', token);
      return (b as { data?: unknown }).data ?? b;
    },
    async getDnsTemplate(token, id) {
      const b = await request('GET', `/dns/templates/${id}`, token);
      return (b as { data?: unknown }).data ?? b;
    },
    // DNS writes
    async createDnsZone(token, args) {
      const parsed = CreateDnsZoneArgs.parse(args);
      const b = await request('POST', '/dns/zones', token, parsed);
      return (b as { data?: unknown }).data ?? b;
    },
    async updateDnsZone(token, args) {
      const parsed = UpdateDnsZoneArgs.parse(args);
      const name = `${parsed.domain.name}.${parsed.domain.extension}`;
      const b = await request('PUT', `/dns/zones/${encodeURIComponent(name)}`, token, parsed);
      return (b as { data?: unknown }).data ?? b;
    },
    async createNameserver(token, args) {
      const parsed = CreateNameserverArgs.parse(args);
      const b = await request('POST', '/dns/nameservers', token, parsed);
      return (b as { data?: unknown }).data ?? b;
    },
    async updateNameserver(token, args) {
      const parsed = UpdateNameserverArgs.parse(args);
      const b = await request(
        'PUT',
        `/dns/nameservers/${encodeURIComponent(parsed.name)}`,
        token,
        parsed,
      );
      return (b as { data?: unknown }).data ?? b;
    },
    async createNsGroup(token, args) {
      const parsed = CreateNsGroupArgs.parse(args);
      const b = await request('POST', '/dns/nameservers/groups', token, parsed);
      return (b as { data?: unknown }).data ?? b;
    },
    async updateNsGroup(token, args) {
      const parsed = UpdateNsGroupArgs.parse(args);
      const b = await request(
        'PUT',
        `/dns/nameservers/groups/${encodeURIComponent(parsed.ns_group)}`,
        token,
        parsed,
      );
      return (b as { data?: unknown }).data ?? b;
    },
    async createDnsTemplate(token, args) {
      const parsed = CreateDnsTemplateArgs.parse(args);
      const b = await request('POST', '/dns/templates', token, parsed);
      return (b as { data?: unknown }).data ?? b;
    },
    async createDomainToken(token, args) {
      const parsed = CreateDomainTokenArgs.parse(args);
      const b = await request('POST', '/dns/domain-token', token, parsed);
      return (b as { data?: unknown }).data ?? b;
    },
    // DNS deletes
    async deleteDnsZone(token, name) {
      const b = await request('DELETE', `/dns/zones/${encodeURIComponent(name)}`, token);
      return (b as { data?: unknown }).data ?? b;
    },
    async deleteNameserver(token, name) {
      const b = await request('DELETE', `/dns/nameservers/${encodeURIComponent(name)}`, token);
      return (b as { data?: unknown }).data ?? b;
    },
    async deleteNsGroup(token, nsGroup) {
      const b = await request(
        'DELETE',
        `/dns/nameservers/groups/${encodeURIComponent(nsGroup)}`,
        token,
      );
      return (b as { data?: unknown }).data ?? b;
    },
    async deleteDnsTemplate(token, id) {
      const b = await request('DELETE', `/dns/templates/${id}`, token);
      return (b as { data?: unknown }).data ?? b;
    },
    // Catalog + tag methods
    async listTlds(token) {
      const b = await request('GET', '/tlds', token);
      return (b as { data?: unknown }).data ?? b;
    },
    async getTld(token, name) {
      const b = await request('GET', `/tlds/${encodeURIComponent(name)}`, token);
      return (b as { data?: unknown }).data ?? b;
    },
    async getDomainPrice(token, args) {
      const parsed = GetDomainPriceArgs.parse(args);
      const params = new URLSearchParams();
      params.append('domain.name', parsed.domain.name);
      params.append('domain.extension', parsed.domain.extension);
      params.append('operation', parsed.operation);
      if (parsed.additional_data?.idn_script) {
        params.append('additional_data.idn_script', parsed.additional_data.idn_script);
      }
      const b = await request('GET', `/domains/prices?${params.toString()}`, token);
      return (b as { data?: unknown }).data ?? b;
    },
    async listTags(token) {
      const b = await request('GET', '/tags', token);
      return (b as { data?: unknown }).data ?? b;
    },
    async createTag(token, args) {
      const parsed = CreateTagArgs.parse(args);
      const b = await request('POST', '/tags', token, parsed);
      return (b as { data?: unknown }).data ?? b;
    },
    async deleteTag(token, args) {
      const parsed = DeleteTagArgs.parse(args);
      const params = new URLSearchParams({ key: parsed.key, value: parsed.value });
      const b = await request('DELETE', `/tags?${params.toString()}`, token);
      return (b as { data?: unknown }).data ?? b;
    },
    // SSL reads
    async listSslProducts(token) {
      // with_price=true is required for OP to include the per-period `prices[]`
      // array on each product; without it the SSL pricer finds no price entry
      // and every create/reissue fails as `unsupported_period`. (Verified
      // against the Openprovider v1beta SSL OpenAPI + live 2026-07.)
      const b = await request('GET', '/ssl/products?with_price=true', token);
      return (b as { data?: unknown }).data ?? b;
    },
    async getSslProduct(token, id) {
      const b = await request('GET', `/ssl/products/${id}`, token);
      return (b as { data?: unknown }).data ?? b;
    },
    async listSslOrders(token) {
      const b = await request('GET', '/ssl/orders', token);
      return (b as { data?: unknown }).data ?? b;
    },
    async getSslOrder(token, id) {
      const b = await request('GET', `/ssl/orders/${id}`, token);
      return (b as { data?: unknown }).data ?? b;
    },
    async getSslApproverEmails(token, args) {
      const parsed = GetSslApproverEmailsArgs.parse(args);
      const params = new URLSearchParams({ domain: parsed.domain });
      const b = await request('GET', `/ssl/approver-emails?${params.toString()}`, token);
      return (b as { data?: unknown }).data ?? b;
    },
    // SSL writes
    async createSslOrder(token, args) {
      const parsed = CreateSslOrderArgs.parse(args);
      const b = await request('POST', '/ssl/orders', token, parsed);
      return (b as { data?: unknown }).data ?? b;
    },
    async renewSslOrder(token, args) {
      const parsed = RenewSslOrderArgs.parse(args);
      const b = await request('POST', `/ssl/orders/${parsed.id}/renew`, token, parsed);
      return (b as { data?: unknown }).data ?? b;
    },
    async reissueSslOrder(token, args) {
      const parsed = ReissueSslOrderArgs.parse(args);
      const b = await request('POST', `/ssl/orders/${parsed.id}/reissue`, token, parsed);
      return (b as { data?: unknown }).data ?? b;
    },
    async cancelSslOrder(token, args) {
      const parsed = CancelSslOrderArgs.parse(args);
      const b = await request('POST', `/ssl/orders/${parsed.id}/cancel`, token, parsed);
      return (b as { data?: unknown }).data ?? b;
    },
    async updateSslOrder(token, args) {
      const parsed = UpdateSslOrderArgs.parse(args);
      const b = await request('PUT', `/ssl/orders/${parsed.id}`, token, parsed);
      return (b as { data?: unknown }).data ?? b;
    },
    async updateSslApproverEmail(token, args) {
      const parsed = UpdateSslApproverEmailArgs.parse(args);
      const b = await request('PUT', `/ssl/orders/${parsed.id}/approver-email`, token, parsed);
      return (b as { data?: unknown }).data ?? b;
    },
    async resendSslApproverEmail(token, args) {
      const parsed = ResendSslApproverEmailArgs.parse(args);
      const b = await request(
        'POST',
        `/ssl/orders/${parsed.id}/approver-email/resend`,
        token,
        parsed,
      );
      return (b as { data?: unknown }).data ?? b;
    },
    async createCsr(token, args) {
      const parsed = CreateCsrArgs.parse(args);
      const b = await request('POST', '/ssl/csr', token, parsed);
      return (b as { data?: unknown }).data ?? b;
    },
    async decodeCsr(token, args) {
      const parsed = DecodeCsrArgs.parse(args);
      const b = await request('POST', '/ssl/csr/decode', token, parsed);
      return (b as { data?: unknown }).data ?? b;
    },
    async createSslOtpToken(token, args) {
      const parsed = CreateSslOtpTokenArgs.parse(args);
      const b = await request('POST', `/ssl/orders/${parsed.id}/otp-tokens`, token, parsed);
      return (b as { data?: unknown }).data ?? b;
    },
    // Customer methods
    async listCustomers(token) {
      const b = await request('GET', '/customers', token);
      return (b as { data?: unknown }).data ?? b;
    },
    async getCustomer(token, handle) {
      const b = await request('GET', `/customers/${encodeURIComponent(handle)}`, token);
      return (b as { data?: unknown }).data ?? b;
    },
    async createCustomer(token, args) {
      const parsed = CreateCustomerArgs.parse(args);
      const b = await request('POST', '/customers', token, parsed);
      return (b as { data?: unknown }).data ?? b;
    },
    async updateCustomer(token, args) {
      const parsed = UpdateCustomerArgs.parse(args);
      const b = await request(
        'PUT',
        `/customers/${encodeURIComponent(parsed.handle)}`,
        token,
        parsed,
      );
      return (b as { data?: unknown }).data ?? b;
    },
    async deleteCustomer(token, handle) {
      const b = await request('DELETE', `/customers/${encodeURIComponent(handle)}`, token);
      return (b as { data?: unknown }).data ?? b;
    },
    // Email template methods
    async listEmailTemplates(token) {
      const b = await request('GET', '/emails', token);
      return (b as { data?: unknown }).data ?? b;
    },
    async createEmailTemplate(token, args) {
      const parsed = CreateEmailTemplateArgs.parse(args);
      const b = await request('POST', '/emails', token, parsed);
      return (b as { data?: unknown }).data ?? b;
    },
    async updateEmailTemplate(token, args) {
      const parsed = UpdateEmailTemplateArgs.parse(args);
      const b = await request('PUT', `/emails/${parsed.id}`, token, parsed);
      return (b as { data?: unknown }).data ?? b;
    },
    async deleteEmailTemplate(token, id) {
      const b = await request('DELETE', `/emails/${id}`, token);
      return (b as { data?: unknown }).data ?? b;
    },
    // Email verification methods
    async listEmailVerificationDomains(token) {
      const b = await request('GET', '/customers/verifications/emails/domains', token);
      return (b as { data?: unknown }).data ?? b;
    },
    async startEmailVerification(token, args) {
      const parsed = StartEmailVerificationArgs.parse(args);
      const b = await request('POST', '/customers/verifications/emails/start', token, parsed);
      return (b as { data?: unknown }).data ?? b;
    },
    async restartEmailVerification(token, args) {
      const parsed = RestartEmailVerificationArgs.parse(args);
      const b = await request('POST', '/customers/verifications/emails/restart', token, parsed);
      return (b as { data?: unknown }).data ?? b;
    },
    // EasyDmarc methods
    async getDmarc(token, args) {
      const parsed = GetDmarcArgs.parse(args);
      const params = new URLSearchParams();
      params.append('domain.name', parsed.domain.name);
      params.append('domain.extension', parsed.domain.extension);
      const b = await request('GET', `/easydmarcs?${params.toString()}`, token);
      return (b as { data?: unknown }).data ?? b;
    },
    async listDmarcSubscriptions(token) {
      const b = await request('GET', '/easydmarcs/list', token);
      return (b as { data?: unknown }).data ?? b;
    },
    async createDmarc(token, args) {
      const parsed = CreateDmarcArgs.parse(args);
      const b = await request('POST', '/easydmarcs', token, parsed);
      return (b as { data?: unknown }).data ?? b;
    },
    async retryDmarc(token, args) {
      const parsed = RetryDmarcArgs.parse(args);
      const b = await request('POST', `/easydmarcs/${parsed.id}/retry`, token, parsed);
      return (b as { data?: unknown }).data ?? b;
    },
    async dmarcSsoLogin(token, args) {
      const parsed = DmarcSsoLoginArgs.parse(args);
      const b = await request('GET', `/easydmarcs/${parsed.id}/sso`, token);
      return (b as { data?: unknown }).data ?? b;
    },
    async deleteDmarc(token, id) {
      const b = await request('DELETE', `/easydmarcs/${id}`, token);
      return (b as { data?: unknown }).data ?? b;
    },
    // SpamExperts methods
    async getSpamExpertsDomain(token, domainName) {
      const b = await request(
        'GET',
        `/spam-expert/domains/${encodeURIComponent(domainName)}`,
        token,
      );
      return (b as { data?: unknown }).data ?? b;
    },
    async spamExpertsLoginUrl(token, args) {
      const parsed = SpamExpertsLoginUrlArgs.parse(args);
      const b = await request('POST', '/spam-expert/generate-login-url', token, parsed);
      return (b as { data?: unknown }).data ?? b;
    },
    async createSpamExpertsDomain(token, args) {
      const parsed = CreateSpamExpertsDomainArgs.parse(args);
      const b = await request('POST', '/spam-expert/domains', token, parsed);
      return (b as { data?: unknown }).data ?? b;
    },
    async updateSpamExpertsDomain(token, args) {
      const parsed = UpdateSpamExpertsDomainArgs.parse(args);
      const b = await request(
        'PUT',
        `/spam-expert/domains/${encodeURIComponent(parsed.domain_name)}`,
        token,
        parsed,
      );
      return (b as { data?: unknown }).data ?? b;
    },
    async deleteSpamExpertsDomain(token, domainName) {
      const b = await request(
        'DELETE',
        `/spam-expert/domains/${encodeURIComponent(domainName)}`,
        token,
      );
      return (b as { data?: unknown }).data ?? b;
    },
    // License methods
    async listLicensePrices(token) {
      const b = await request('GET', '/licenses', token);
      return (b as { data?: unknown }).data ?? b;
    },
    async listLicenseItems(token) {
      const b = await request('GET', '/licenses/items', token);
      return (b as { data?: unknown }).data ?? b;
    },
    async listPleskLicenses(token) {
      const b = await request('GET', '/licenses/plesk', token);
      return (b as { data?: unknown }).data ?? b;
    },
    async getPleskLicense(token, keyId) {
      const b = await request('GET', `/licenses/plesk/${keyId}`, token);
      return (b as { data?: unknown }).data ?? b;
    },
    async getPleskKey(token, keyId) {
      const b = await request('GET', `/licenses/plesk/key/${keyId}`, token);
      return (b as { data?: unknown }).data ?? b;
    },
    async createPleskLicense(token, args) {
      const parsed = CreatePleskLicenseArgs.parse(args);
      const b = await request('POST', '/licenses/plesk', token, parsed);
      return (b as { data?: unknown }).data ?? b;
    },
    async updatePleskLicense(token, args) {
      const parsed = UpdatePleskLicenseArgs.parse(args);
      const b = await request('PUT', `/licenses/plesk/${parsed.key_id}`, token, parsed);
      return (b as { data?: unknown }).data ?? b;
    },
    async resetPleskHwid(token, args) {
      const parsed = ResetPleskHwidArgs.parse(args);
      const b = await request(
        'POST',
        `/licenses/hwids/reset/${encodeURIComponent(parsed.product)}/${parsed.key_id}`,
        token,
        parsed,
      );
      return (b as { data?: unknown }).data ?? b;
    },
    async deletePleskLicense(token, keyId) {
      const b = await request('DELETE', `/licenses/plesk/${keyId}`, token);
      return (b as { data?: unknown }).data ?? b;
    },
    async checkDomain(token, args) {
      const parsedArgs = CheckDomainArgs.parse(args);
      let body: unknown;
      try {
        body = await checkDomainBreaker.fire(token, parsedArgs);
      } catch (err) {
        // Pass through known domain errors directly.
        if (err instanceof OpenproviderAuthError) throw err;
        if (err instanceof OpenproviderUnavailableError) throw err;
        if (err instanceof OpenproviderRateLimitError) throw err;
        if (err instanceof OpenproviderClientError) throw err;
        // opossum open-circuit error (EOPENBREAKER) → translate to unavailable.
        if (
          err instanceof Error &&
          ((err as Error & { code?: string }).code === 'EOPENBREAKER' ||
            err.message.includes('Breaker is open') ||
            err.message.includes('circuit'))
        ) {
          throw new OpenproviderUnavailableError('circuit open');
        }
        throw err;
      }
      const data = (body as { data?: unknown }).data ?? body;
      return CheckDomainResult.parse(data);
    },
  };
}
