# Security Policy

## Reporting a vulnerability

**Please do not open a public GitHub issue for security problems.**

Report vulnerabilities privately to **security@openprovider.nl** — Openprovider's
published security contact (see
[security.txt](https://www.openprovider.com/.well-known/security.txt)).

Please include, as far as you can:

- what the issue is and why it is a security problem
- the steps to reproduce it, ideally with a minimal proof of concept
- the affected version (the MCP server reports its build as
  `serverInfo.version` in the `initialize` response)
- the impact you believe it has, and any suggested remediation

You will receive an acknowledgement that your report was received. We will keep
you informed as we investigate, and we will let you know when a fix ships.
Please give us a reasonable opportunity to remediate before any public
disclosure.

## Scope

In scope — this repository, the Openprovider MCP server:

- authentication and authorization of MCP clients (API keys, scopes, roles)
- tenant isolation: any path by which one tenant can read or affect another
- handling of Openprovider credentials and secrets
- the confirmation/approval flow for state-changing tools
- injection, deserialization, SSRF, or request-smuggling issues in the server
- leakage of sensitive values (credentials, auth codes, tokens) into responses
  or logs

Out of scope:

- vulnerabilities in the Openprovider API itself, or in the Openprovider control
  panel — report those to **security@openprovider.nl** as well, but note that
  they are not fixed in this repository
- denial of service through volumetric traffic, and any testing that degrades
  service for other users
- social engineering, phishing, or physical attacks against Openprovider staff
- missing hardening headers or best-practice findings with no demonstrated
  impact, unsupported by a concrete attack scenario
- automated scanner output submitted without a validated, reproducible finding

## Please do not

While testing, do not access, modify, or delete data belonging to any account
other than your own, and do not register, transfer, or delete domains that are
not yours. Domain operations are real, billable, and in many cases irreversible.
Use your own test account.

## Credentials in reports

If your report involves a leaked credential — an `op_live_` API key, an
Openprovider password, a domain auth code — treat it as compromised and rotate
it immediately, and do not include the full value in your report. A prefix is
enough for us to identify it.

## Supported versions

Security fixes are applied to the latest released version. Please confirm an
issue reproduces on the current release before reporting it.
