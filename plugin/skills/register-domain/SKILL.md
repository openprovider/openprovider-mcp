---
name: register-domain
description: Check availability and price for a domain name and register it with Openprovider. Use when the user wants to find, buy or register a domain.
---

# Register a domain with Openprovider

1. **Check availability.** Call `check_domain` with the name split into `name` and `extension` (for `example.com`: `name` is `example`, `extension` is `com`). It accepts up to 15 domains per call. If the name is taken, offer alternatives from `suggest_domain`.
2. **Show the price.** Call `get_domain_price` and tell the user the price and currency before going further.
3. **Find the owner handle.** Registration needs an existing owner contact handle. Use `list_customers` to find the handle, or `create_customer` if the user has none. Admin, tech and billing handles default to the owner handle.
4. **Register.** Call `register_domain` with `domain`, `period` in years, and `owner_handle`. Without `name_servers` or `ns_group`, Openprovider's nameservers are used.
5. **Approve.** `register_domain` is billable, so the server returns a confirmation request instead of registering. Tell the user what will be charged. When they agree, call `confirm_pending` with the `confirmation_id` and the same arguments, or have an owner or admin approve it in the dashboard.

## Errors

- Code 309 means the reseller contract for that ccTLD isn't signed. The account owner has to sign it in the Openprovider control panel.
- Code 333 on ccTLDs such as `.nl` means an admin handle is required. Pass `admin_handle` explicitly.
