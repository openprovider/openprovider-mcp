export class OpenproviderAuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'OpenproviderAuthError';
  }
}
export class OpenproviderRateLimitError extends Error {
  constructor(
    message: string,
    public retryAfterMs?: number,
  ) {
    super(message);
    this.name = 'OpenproviderRateLimitError';
  }
}
export class OpenproviderUnavailableError extends Error {
  constructor(
    message: string,
    /** Stable MCP-facing error code (surfaced as the JSON-RPC error data.code). */
    public readonly code?: string,
    /** The raw Openprovider error code from the `{code,desc}` envelope, if any. */
    public readonly opCode?: number,
  ) {
    super(message);
    this.name = 'OpenproviderUnavailableError';
  }
}
export class OpenproviderClientError extends Error {
  constructor(
    message: string,
    public status: number,
    /** Stable MCP-facing error code (surfaced as the JSON-RPC error data.code). */
    public readonly code?: string,
    /** The raw Openprovider error code from the `{code,desc}` envelope, if any. */
    public readonly opCode?: number,
  ) {
    super(message);
    this.name = 'OpenproviderClientError';
  }
}

/** Parse OP's `{code, desc, data}` envelope out of an error body for logging. */
export function opEnvelope(text: string): {
  opCode?: number | undefined;
  opDesc?: string | undefined;
} {
  try {
    const parsed = JSON.parse(text) as { code?: number; desc?: string };
    return { opCode: parsed.code, opDesc: parsed.desc };
  } catch {
    return {};
  }
}

export interface UpstreamErrorInfo {
  /** Stable MCP-facing error code. */
  code: string;
  /** Actionable, human-readable message. */
  message: string;
  /** True when retrying cannot possibly help (don't burn the 5xx retry budget). */
  terminal: boolean;
}

/**
 * Translate an Openprovider error response into a stable MCP error `code`, an
 * actionable message, and whether a retry could ever help.
 *
 * Openprovider returns several *deterministic business errors* as HTTP 500
 * (not just genuine outages) — e.g. 309 "contract not signed", 196 "invalid
 * credentials". Those are flagged `terminal` so the caller fails fast instead
 * of wasting the 5xx retry budget (and making the user wait ~5s) on an error
 * that will never change on retry.
 *
 * Unknown codes preserve the previous behavior exactly: code `upstream_error`
 * and the raw `upstream <status>: <body>` message.
 */
export function mapOpenproviderError(
  status: number,
  opCode: number | undefined,
  opDesc: string | undefined,
  rawText: string,
): UpstreamErrorInfo {
  const suffix = opDesc ? `: ${opDesc}` : '';
  switch (opCode) {
    case 309:
      return {
        code: 'registry_contract_not_signed',
        message:
          'Openprovider requires you to sign the latest registrant contract for this TLD ' +
          'before it can be registered. Sign it in your Openprovider control panel ' +
          `(under Agreements, or when prompted for the TLD), then retry. (Openprovider 309${suffix})`,
        terminal: true,
      };
    case 196:
      return {
        code: 'openprovider_invalid_credentials',
        message:
          'Openprovider rejected the API credentials for this tenant. Re-connect the ' +
          `Openprovider account, then retry. (Openprovider 196${suffix})`,
        terminal: true,
      };
    case 10006:
      return {
        code: 'openprovider_2fa_enabled',
        message:
          'Openprovider refused the API login because two-factor authentication is enabled on ' +
          'this user. Openprovider does not support 2FA on API logins — per its own guidance, ' +
          'do not enable 2FA for users connected to the API. Either disable 2FA for this user, ' +
          'or create a dedicated API user without 2FA and re-connect the Openprovider account ' +
          `in the dashboard. (Openprovider 10006${suffix})`,
        terminal: true,
      };
    case 170:
      return {
        code: 'contact_type_required',
        message:
          'Openprovider rejected the contact: a contact "type" field is required. ' +
          `(Openprovider 170${suffix})`,
        terminal: true,
      };
    case 321:
      return {
        code: 'tld_not_tradeable',
        message:
          'This TLD does not support the trade (owner-change) operation via the Openprovider ' +
          'API — e.g. .nl owner changes go through the registry (SIDN) directly, not trade_domain. ' +
          `(Openprovider 321${suffix})`,
        terminal: true,
      };
    case 25001:
      return {
        code: 'ssl_renew_too_early',
        message:
          'This SSL order cannot be renewed yet — it is too early in the certificate lifecycle. ' +
          `Renew closer to the expiration date. (Openprovider 25001${suffix})`,
        terminal: true,
      };
    case 30001:
      return {
        code: 'dmarc_order_not_retryable',
        message:
          'This EasyDMARC order is not in a retryable state — retry only applies to a ' +
          'failed order. Check its current status with get_dmarc or ' +
          `list_dmarc_subscriptions. (Openprovider 30001${suffix})`,
        terminal: true,
      };
    case 30003:
      return {
        code: 'order_already_active',
        message:
          'Openprovider already has an active order for this item, so a new one cannot be ' +
          'created. This is not a failure: if it is a DMARC/EasyDMARC subscription, the order ' +
          'already exists — view it with get_dmarc or list_dmarc_subscriptions instead of ' +
          `creating another. (Openprovider 30003${suffix})`,
        terminal: true,
      };
    default:
      return {
        code: 'upstream_error',
        message: rawText ? `upstream ${status}: ${rawText.slice(0, 200)}` : `upstream ${status}`,
        terminal: false,
      };
  }
}

export class OpenproviderAccountNotConnected extends Error {
  readonly code = 'openprovider_not_connected';
  constructor() {
    super(
      'No Openprovider account connected for this tenant. Run: openprovider-mcp tenant:onboard',
    );
    this.name = 'OpenproviderAccountNotConnected';
  }
}
