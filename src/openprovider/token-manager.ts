import {
  OpenproviderAuthError,
  OpenproviderUnavailableError,
  mapOpenproviderError,
  opEnvelope,
} from './errors.js';

/** Minimal structural logger type — matches the pino instance used elsewhere. */
export interface TokenManagerLogger {
  info(obj: Record<string, unknown>, msg?: string): void;
  warn(obj: Record<string, unknown>, msg?: string): void;
  error(obj: Record<string, unknown>, msg?: string): void;
}

export interface TokenCache {
  get(tenantId: string): Promise<{ token: string; expiresAt: Date } | null>;
  set(tenantId: string, value: { token: string; expiresAt: Date }): void | Promise<void>;
  clear(tenantId: string): void | Promise<void>;
}

export interface TokenManagerConfig {
  baseUrl?: string;
  fetchImpl?: typeof fetch;
  fetchCredentials: (tenantId: string) => Promise<{ username: string; password: string }>;
  cache: TokenCache;
  defaultTtlMs?: number;
  logger?: TokenManagerLogger;
  /**
   * Backoff schedule for retrying a non-terminal 5xx on /auth/login. Its length
   * is the retry budget. Overridable so tests don't sleep for real.
   */
  retryBackoffMs?: number[];
}

export interface OpenproviderTokenManager {
  getToken(tenantId: string): Promise<string>;
  invalidate(tenantId: string): Promise<void>;
}

const DEFAULT_BASE = 'https://api.openprovider.eu/v1beta';
const DEFAULT_TTL = 12 * 60 * 60 * 1000; // 12h, conservative
/** Mirrors the authenticated client's 5xx backoff (src/openprovider/client.ts). */
const DEFAULT_RETRY_BACKOFF_MS = [250, 1000, 4000];

export function createOpenproviderTokenManager(
  config: TokenManagerConfig,
): OpenproviderTokenManager {
  const baseUrl = config.baseUrl ?? DEFAULT_BASE;
  const fetcher = config.fetchImpl ?? fetch;
  const inflight = new Map<string, Promise<string>>();

  async function login(tenantId: string, attempt = 0): Promise<string> {
    const creds = await config.fetchCredentials(tenantId);
    const startedAt = Date.now();
    const res = await fetcher(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ username: creds.username, password: creds.password }),
    });
    const durationMs = Date.now() - startedAt;
    if (res.status === 401) throw new OpenproviderAuthError('invalid Openprovider credentials');

    // Read the body as text first. The previous implementation used
    // `res.json().catch(() => ({}))`, which silently swallowed any non-JSON
    // error page — so an upstream 5xx surfaced as a bare `login failed: 500`
    // with no code, no desc and no log line, leaving nothing to diagnose.
    const text = await res.text().catch(() => '');
    let body: { code?: number; desc?: string; data?: { token?: string } } = {};
    try {
      body = JSON.parse(text) as typeof body;
    } catch {
      // Non-JSON body (e.g. an HTML gateway error) — keep `text` for the message.
    }

    // Openprovider reports bad credentials as code 196, sometimes with a non-401 status
    // (observed HTTP 500) or even a 200 envelope. Map it explicitly.
    if (body.code === 196) {
      config.logger?.error(
        {
          event: 'op_login_invalid_credentials',
          tenantId,
          status: res.status,
          opCode: 196,
          opDesc: body.desc,
          durationMs,
        },
        'openprovider login rejected the credentials',
      );
      throw new OpenproviderAuthError('invalid Openprovider credentials');
    }

    if (res.status >= 500) {
      // Mirror the authenticated client's 5xx policy (see client.ts): OP returns
      // deterministic business errors as 500, which must fail fast, while genuine
      // outages are worth retrying. Login previously did neither.
      const { opCode, opDesc } = opEnvelope(text);
      const info = mapOpenproviderError(res.status, opCode, opDesc, text);
      const schedule = config.retryBackoffMs ?? DEFAULT_RETRY_BACKOFF_MS;
      if (!info.terminal && attempt < schedule.length) {
        const backoff = schedule[attempt] ?? 4000;
        config.logger?.warn(
          {
            event: 'op_login_retry',
            tenantId,
            status: res.status,
            opCode,
            opDesc,
            attempt: attempt + 1,
            backoffMs: backoff,
            durationMs,
          },
          'openprovider login 5xx — retrying',
        );
        await new Promise((r) => setTimeout(r, backoff));
        return login(tenantId, attempt + 1);
      }
      config.logger?.error(
        {
          event: 'op_login_failed',
          tenantId,
          username: creds.username,
          baseUrl,
          status: res.status,
          opCode,
          opDesc,
          // Bounded slice of the raw body — the single most useful field when OP
          // returns a 5xx that is neither 196 nor a known business code.
          responseBody: text.slice(0, 500),
          terminal: info.terminal,
          attempt: attempt + 1,
          durationMs,
        },
        info.terminal
          ? 'openprovider login 5xx business error'
          : 'openprovider login 5xx exhausted retries',
      );
      throw new OpenproviderUnavailableError(
        `Openprovider login failed: ${info.message}`,
        info.code,
        opCode,
      );
    }

    if (!res.ok) {
      throw new Error(
        text ? `login failed: ${res.status}: ${text.slice(0, 200)}` : `login failed: ${res.status}`,
      );
    }
    const token = body.data?.token;
    if (!token) throw new Error('login response missing data.token');
    const expiresAt = new Date(Date.now() + (config.defaultTtlMs ?? DEFAULT_TTL));
    await config.cache.set(tenantId, { token, expiresAt });
    return token;
  }

  return {
    async getToken(tenantId) {
      const cached = await config.cache.get(tenantId);
      if (cached && cached.expiresAt.getTime() > Date.now()) return cached.token;
      const existing = inflight.get(tenantId);
      if (existing) return existing;
      const p = login(tenantId).finally(() => inflight.delete(tenantId));
      inflight.set(tenantId, p);
      return p;
    },
    async invalidate(tenantId) {
      await config.cache.clear(tenantId);
    },
  };
}
