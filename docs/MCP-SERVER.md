# Openprovider MCP Server

Connect AI assistants like Claude, Cursor, and other MCP-compatible tools to
your Openprovider account. Once connected, you can manage domains, DNS, SSL
certificates, customers, email, and licenses through natural-language
conversation — with policy controls, spend caps, and human approval gates on
every billable or destructive action.

The server implements the [Model Context Protocol](https://modelcontextprotocol.io)
(MCP) over Streamable HTTP. It is multi-tenant: each team connects its own
Openprovider reseller credentials and gets isolated data, policies, and audit
trails.

## Key capabilities

- **97 tools** covering the Openprovider API surface:
  - **Domains** — check availability (with pricing), register, renew, transfer,
    trade, restore, suggest names, manage auth codes and transfers
  - **DNS** — zones, records, nameservers, nameserver groups, templates
  - **Contacts & customers** — create, update, delete, list
  - **SSL** — products, orders, CSR create/decode, approver emails
  - **Email** — templates, verification, DMARC, Spam Experts
  - **Licenses** — Plesk license lifecycle
- **Policy engine** — per-tenant allow / confirm / deny modes per tool, TLD
  allowlists/denylists, monthly spend caps in EUR
- **Approval flow** — billable and destructive operations return a confirmation
  request instead of executing; an owner or admin approves before anything is
  charged
- **Role-based access** — owner, admin, operator, viewer, and read-only auditor
  roles per team member
- **Tamper-evident audit log** — every tool call is recorded in a hash-chained
  ledger, viewable from the dashboard

## Prerequisites

1. **An account on the dashboard.** Sign up at `https://mcp.openprovider.com/dashboard/signup`.
   (Reading this on a deployment of your own? The hostname above is rewritten to
   whichever host you loaded this page from, so the examples are already correct
   for your environment.)
2. **Openprovider reseller credentials connected.** From the dashboard, open
   **Openprovider** and enter your Openprovider username and password. The
   password is encrypted with a per-tenant key and never stored in plaintext.
3. **An API key.** From the dashboard, open **API keys** and issue a new key.
   The key looks like `op_live_…` and is **shown exactly once** — store it in a
   password manager. Keys can be revoked at any time from the same page.

## Setup: Claude Desktop

Claude Desktop talks to remote MCP servers through the `mcp-remote` bridge
(requires Node.js 18+ on your machine).

1. Open the config file:
   - macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - Windows: `%APPDATA%\Claude\claude_desktop_config.json`
2. Add the server:

```json
{
  "mcpServers": {
    "openprovider": {
      "command": "npx",
      "args": [
        "-y",
        "mcp-remote",
        "https://mcp.openprovider.com/mcp",
        "--header",
        "Authorization: Bearer op_live_YOUR_KEY_HERE"
      ]
    }
  }
}
```

3. Fully quit Claude Desktop (not just close the window) and relaunch.
4. The Openprovider tools appear under the 🔌 icon in a new conversation.

## Setup: Claude Code

Claude Code supports remote MCP servers natively — no bridge needed:

```bash
claude mcp add --transport http openprovider https://mcp.openprovider.com/mcp \
  --header "Authorization: Bearer op_live_YOUR_KEY_HERE"
```

Or in `.mcp.json` at your project root:

```json
{
  "mcpServers": {
    "openprovider": {
      "type": "http",
      "url": "https://mcp.openprovider.com/mcp",
      "headers": {
        "Authorization": "Bearer op_live_YOUR_KEY_HERE"
      }
    }
  }
}
```

## Setup: Cursor

In **Settings → MCP → Add new global MCP server**, or `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "openprovider": {
      "url": "https://mcp.openprovider.com/mcp",
      "headers": {
        "Authorization": "Bearer op_live_YOUR_KEY_HERE"
      }
    }
  }
}
```

If your Cursor version does not support remote URLs directly, use the same
`npx mcp-remote` command-form shown in the Claude Desktop section.

## Authentication

All requests authenticate with a tenant API key passed as a Bearer token:

```
Authorization: Bearer op_live_…
```

- Keys are issued and revoked from the dashboard **API keys** page. Only the
  argon2id hash is stored server-side; the plaintext is shown once at issuance.
- A key inherits the **service principal** role: it can read everything its
  tenant owns and propose writes, but billable/destructive operations still
  require human approval (see below) unless tenant policy says otherwise.
- Prefer one key per client/integration so you can revoke them independently.
- Rotate keys by issuing a new one, updating your client config, then revoking
  the old one.

## Usage examples

Ask your assistant things like:

> *"Check if `acme-rockets.com` and `acme-rockets.io` are available, with prices."*

> *"List my DNS zones and show the records for example.com."*

> *"Suggest 10 domain names for a coffee subscription startup."*

> *"Renew example.com for 1 year."* — this one is billable, so read on.

### The approval flow (billable / destructive operations)

Operations that cost money or destroy data (register, renew, transfer, delete
domain, SSL orders, Plesk licenses, …) do not execute immediately. Instead the
tool returns a **confirmation request**:

```json
{
  "confirmationId": "1f0c5e2e-…",
  "summary": "renew_domain (est. €12.50)",
  "estimatedCostEur": 12.5,
  "requiredApproverRoles": ["owner", "admin"],
  "expiresAt": "2026-06-11T10:30:00.000Z"
}
```

An **owner or admin** then approves it, either:

- **In chat** — ask the assistant to run `confirm_pending` with the
  confirmation ID (the approver's own session/key must carry an approver role), or
- **In the dashboard** — open **Confirmations** and click approve.

Confirmations expire after 5 minutes, are single-use, are bound to the exact
arguments that were proposed, and re-check the live price at approval time — if
the price drifted upward beyond tolerance, the confirmation is rejected and
must be re-proposed.

### Spend caps

Each tenant has a monthly spend cap in EUR (default **€0 — all billable
operations blocked** until an owner raises it). Set it from the dashboard
**Policy** page. Approved operations reserve against the cap atomically, so
concurrent approvals cannot overshoot it.

## Limits to know

| Limit | Value |
|---|---|
| `check_domain` batch size | 15 domains per call (Openprovider rejects more) |
| Confirmation TTL | 5 minutes |
| Default spend cap | €0 (raise it before billable operations) |
| Request timeout to Openprovider | 30 s with automatic retry on 5xx/429 |

## Troubleshooting

**`401 Unauthorized` / tools don't load**
The API key is missing, revoked, expired, or mistyped. Issue a fresh key from
the dashboard and update your client config. Remember the plaintext is shown
only once.

**`policy_denied` / `tool_not_permitted`**
Tenant policy denies this tool for your role, or you're a viewer/auditor
attempting a write. An owner can adjust tool modes on the **Policy** page.

**`spend_cap_exceeded`**
The estimated cost would exceed the monthly cap. Raise the cap on the
**Policy** page or wait for the window to reset.

**`confirmation_expired` / `confirmation_not_found`**
Confirmations are single-use and expire after 5 minutes. Re-run the original
request to get a fresh confirmation.

**`openprovider_not_connected`**
The tenant has no Openprovider credentials onboarded. Connect them from the
dashboard **Openprovider** page.

**`upstream 500: {"desc":"Access denied.","code":10005}`**
Openprovider rejected the call at their edge — typically an IP allowlist on
the Openprovider account that doesn't include the server's egress IP, or
account-level API restrictions. Verify the Openprovider account's API settings.

**Claude Desktop shows no tools after config change**
Fully quit the app (macOS: Cmd-Q) and relaunch — the config is read only at
startup. Then check `~/Library/Logs/Claude/mcp*.log` for connection errors.

**SSE disconnect / reconnect noise in `mcp-remote` logs**
Long-idle SSE streams may be dropped by intermediate proxies and re-established
automatically. Harmless as long as tool calls succeed.

## Resources

- **This guide on the web:** `https://mcp.openprovider.com/docs`
- **Tool reference (all 97 tools) on the web:** `https://mcp.openprovider.com/docs/tools`

- [Model Context Protocol documentation](https://modelcontextprotocol.io)
- [Openprovider API documentation](https://docs.openprovider.com)
- Dashboard: `https://mcp.openprovider.com/dashboard` — policies, API keys,
  confirmations, audit log, team management
