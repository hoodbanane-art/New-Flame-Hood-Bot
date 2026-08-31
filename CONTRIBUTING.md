# Contributing

Thank you for helping improve Roblox Discord Moderation Bot.

## Before you start

- Search existing issues before opening a new one.
- Use a GitHub Discussion for setup questions when Discussions are enabled.
- Open an issue before large behavior or protocol changes so the design can be agreed on first.
- Follow the [Code of Conduct](CODE_OF_CONDUCT.md) and [Security Policy](SECURITY.md).

## Local development

Requirements:

- Node.js 22 or newer
- npm 10 or newer

Install and validate the project:

```bash
npm ci --ignore-scripts
npm run typecheck
npm test
npm run build
```

Copy `.env.example` to `.env` only when manually testing against your own Discord application and Roblox experience. Tests must not depend on live credentials or external services.

## Pull requests

1. Fork the repository and create a focused branch.
2. Add or update tests for behavior changes.
3. Run type checking, tests, and the production build.
4. Update documentation for user-visible changes.
5. Keep commits focused and describe the reason for the change.

Pull requests should avoid unrelated formatting changes and never include credentials, user data, or moderation records.

## Commit style

Use a concise imperative summary, for example:

```text
Validate moderation request timestamps
```

## Roblox protocol changes

Changes to the MessagingService payload must update all of the following together:

- `src/roblox/robloxClient.ts`;
- `RobloxScript/ModerationMessaging.server.lua`;
- protocol-related tests;
- deployment documentation.
