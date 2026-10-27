---
name: manage-dns
description: Read, add and remove DNS records in an Openprovider DNS zone. Use when the user wants to point a domain somewhere, add MX, TXT, CNAME or A records, or check a zone.
---

# Manage DNS records with Openprovider

1. **Read the zone first.** Call `list_dns_zone_records` for the domain and show the user the current records that matter for the change.
2. **No zone yet?** Create it with `create_dns_zone`, passing `domain` as `name` and `extension`.
3. **Change records.** Call `update_dns_zone` with `domain` and `records`:
   - `records.add`: each record has `type`, `value` and `ttl`, plus `name` for a subdomain and `prio` for MX records.
   - `records.remove`: list the exact record to remove, with the same `name`, `type`, `value` and `ttl` it has now.
   - To change a record, remove the old one and add the new one in the same call.
4. **Confirm.** Read the zone again and show the user the result.

Deleting a whole zone with `delete_dns_zone` needs approval from an owner or admin. Tell the user before proposing it.
