---
name: order-ssl-certificate
description: Choose an SSL product, generate a CSR and order a certificate through Openprovider. Use when the user wants to buy, renew or reissue an SSL certificate.
---

# Order an SSL certificate with Openprovider

1. **Choose a product.** Call `list_ssl_products` and help the user pick one. Use `get_ssl_product` for details and price.
2. **Get a CSR.** Use the user's CSR, or generate one with `create_csr`. Check it with `decode_csr`. Keep the PEM's real line breaks, because a CSR with escaped `\n` characters is rejected as invalid.
3. **Pick the approver email.** For email validation, call `get_ssl_approver_emails` with the domain and the `product_id`, then let the user choose one.
4. **Order.** Call `create_ssl_order` with `product_id`, `period`, `csr`, the approver email and the organization and technical contact handles.
5. **Approve.** Ordering is billable, so the server returns a confirmation request. Tell the user the cost, and after they agree, call `confirm_pending` or have an owner or admin approve it in the dashboard.
6. **Follow up.** Track the order with `get_ssl_order`. Use `resend_ssl_approver_email` if the approval email went missing.

Renewing, reissuing and cancelling (`renew_ssl_order`, `reissue_ssl_order`, `cancel_ssl_order`) also need approval.
