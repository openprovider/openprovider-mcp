# Openprovider for Claude

Manage your Openprovider reseller account from Claude: search and register domains, edit DNS zones, order SSL certificates, and look after contacts, customers and Plesk licenses.

The plugin connects Claude to the hosted Openprovider MCP server at `https://mcp.openprovider.com/mcp`. The first time Claude uses it, you sign in to your Openprovider MCP account in the browser. The plugin stores no credentials and contains no code that runs on your machine.

## What it includes

- **MCP server:** the hosted Openprovider server, with about 98 tools for domains, DNS, SSL, customers, contacts, email and licenses.
- **Skills:**
  - `register-domain`: check availability and price, pick the owner handle, and register.
  - `manage-dns`: read and change DNS records in a zone.
  - `order-ssl-certificate`: choose a product, create a CSR, and place the order.

## Billable and destructive actions

Registering, renewing, transferring or deleting domains and ordering SSL certificates cost money or can't be undone. The server holds these calls as confirmation requests. An owner or admin of your Openprovider MCP account approves each one before it runs, from the dashboard or by asking Claude to confirm it.

## Data

The plugin sends requests only to `mcp.openprovider.com`, which calls the Openprovider API on your behalf with the account you signed in with. It reads and changes data in that Openprovider account. Openprovider's [privacy policy](https://www.openprovider.com/legal/privacy-policy) covers this data. See the [tool reference](https://github.com/openprovider/openprovider-mcp/blob/main/docs/tools.md) for every tool.

## License

MIT
