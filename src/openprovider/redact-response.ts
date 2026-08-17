/**
 * Domain transfer credentials that must NOT be returned in bulk/read responses.
 * `auth_code` is the EPP transfer code and `internal_auth_code` the registry
 * credential — either lets a holder move a domain to another registrar. When
 * `list_domains` / `get_domain` echoed Openprovider's raw response verbatim, a
 * single compromised token could harvest every domain's transfer codes at once
 * (pentest CRITICAL-02). We strip them from those responses; deliberate,
 * per-domain retrieval remains available via the dedicated get_domain_authcode
 * tool (GET /domains/:id/authcode).
 */
const DOMAIN_SECRET_KEYS = new Set(['auth_code', 'internal_auth_code']);

/**
 * Recursively remove domain transfer-credential keys from an Openprovider
 * response value (handles nested objects like `additional_data.auth_code` and
 * arrays like the `list_domains` results). Non-object values pass through.
 */
export function stripDomainSecrets(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stripDomainSecrets);
  if (value !== null && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (DOMAIN_SECRET_KEYS.has(k)) continue;
      out[k] = stripDomainSecrets(v);
    }
    return out;
  }
  return value;
}
