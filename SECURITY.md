# Security policy

## Supported versions

Security fixes are provided for the latest published release and the `main` branch.

| Version | Supported |
| --- | --- |
| Latest release | Yes |
| `main` | Yes |
| Older releases | No |

## Reporting a vulnerability

Do not open a public issue for a suspected vulnerability, leaked credential, or exploit.

Use GitHub's **Report a vulnerability** button in the repository Security tab to submit a private report. Include:

- the affected commit or release;
- reproduction steps or a proof of concept;
- the expected security impact;
- any suggested mitigation.

You should receive an acknowledgement within seven days. Confirmed reports will be coordinated privately until a fix and advisory are ready. Please do not test against Roblox experiences or Discord servers you do not own or have explicit permission to assess.

## Operational security

- Never commit `.env` or real credentials.
- Restrict Roblox Open Cloud keys to the required universe, operations, IP ranges, and expiration period where possible.
- Rotate both the Discord token and Roblox key immediately if either may have leaked.
- Keep the moderation log channel private to trusted staff.
