# Openprovider MCP Server

**Official Model Context Protocol server for the Openprovider API.**

Maintained by Openprovider.

Connect Claude, or any [Model Context Protocol](https://modelcontextprotocol.io)
client, to your Openprovider account to manage domains, DNS, SSL certificates,
contacts, email and licences in natural language.

---

## What you get

**95 tools** across the Openprovider API:

| Area | Examples |
|---|---|
| Domains | `check_domain`, `register_domain`, `renew_domain`, `transfer_domain`, `update_domain`, `delete_domain`, `restore_domain`, `suggest_domain` |
| Transfers & auth codes | `get_domain_authcode`, `reset_domain_authcode`, `approve_domain_transfer`, `send_foa1_domain_transfer` |
| DNS | `list_dns_zones`, `create_dns_zone`, `update_dns_zone`, `list_dns_zone_records`, DNS templates, nameservers, NS groups |
| SSL | `list_ssl_products`, `create_ssl_order`, `renew_ssl_order`, `reissue_ssl_order`, `create_csr`, `decode_csr`, approver emails |
| Contacts & customers | `list_contacts`, `create_contact`, `update_contact`, `list_customers`, `create_customer` |
| Email | Email templates, email verification, SpamExperts domains |
| DMARC | `list_dmarc_subscriptions`, `create_dmarc`, `get_dmarc`, `retry_dmarc` |
| Licences | Plesk licences, licence prices and items |
| Pricing & TLDs | `get_domain_price`, `list_tlds`, `get_tld` |

A full reference with input schemas is in [docs/tools.md](docs/tools.md).

## Quick start

Requires **Node.js 20+** and an Openprovider account with API access enabled.

```bash
npx openprovider-mcp
```

### Claude Desktop / Claude Code

Add to your MCP client configuration:

```json
{
  "mcpServers": {
    "openprovider": {
      "command": "npx",
      "args": ["-y", "openprovider-mcp"],
      "env": {
        "OPENPROVIDER_USERNAME": "your-openprovider-username",
        "OPENPROVIDER_PASSWORD": "your-openprovider-password"
      }
    }
  }
}
```

For Claude Code:

```bash
claude mcp add openprovider npx -y openprovider-mcp \
  -e OPENPROVIDER_USERNAME=your-username \
  -e OPENPROVIDER_PASSWORD=your-password
```

### From source

```bash
git clone https://github.com/openprovider/openprovider-mcp.git
cd openprovider-mcp
npm install
npm run build
OPENPROVIDER_USERNAME=... OPENPROVIDER_PASSWORD=... npm start
```

## Configuration

| Variable | Required | Description |
|---|---|---|
| `OPENPROVIDER_USERNAME` | yes | Openprovider account username |
| `OPENPROVIDER_PASSWORD` | yes | That account's password |
| `OPENPROVIDER_BASE_URL` | no | Override the API base URL (defaults to the production API) |

Credentials are read from the environment, used only to obtain an API token from
Openprovider, and are never written to disk or logged.

> **Do not enable two-factor authentication on a user used for API access.**
> Openprovider rejects 2FA logins over the API — the server reports this as
> `Openprovider 10006: Two factor authenticator required`. Use a dedicated API
> user without 2FA.

## Hosted option

Openprovider also runs a hosted, multi-tenant deployment at
**https://mcp.openprovider.com** with a dashboard, API keys, team management,
approval policies and an audit log. See
[docs/MCP-SERVER.md](docs/MCP-SERVER.md) for client setup against the hosted
endpoint. This repository is the standalone, self-hosted server.

## Safety

Many tools perform **real, billable and often irreversible** operations —
registering, renewing, transferring and deleting domains, and ordering
certificates and licences. This standalone build executes them directly with no
approval step. Point it at an account you intend to change, and prefer a test
account while you are exploring.

## Documentation

- [Tool reference](docs/tools.md) — every tool and its input schema
- [Hosted endpoint setup guide](docs/MCP-SERVER.md) — for `mcp.openprovider.com`, not this standalone server
- [Troubleshooting](docs/troubleshooting.md)
- [Examples](examples/)
- [Openprovider API documentation](https://docs.openprovider.com)

## Security

Please report vulnerabilities privately — see [SECURITY.md](SECURITY.md).
Do not open a public issue for a security problem.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

MIT — see [LICENSE](LICENSE).
