# Deployment

## Discord application

Create a Discord application and bot, then install it in the staff server with the `bot` and `applications.commands` scopes. The bot needs access to view and send messages and embeds in the configured audit channel. It does not request privileged Gateway intents.

Record the application ID, guild ID, bot token, and optional audit-channel ID. Enable Developer Mode in Discord when copying IDs.

## Roblox Open Cloud

Create a dedicated API key restricted to the target universe and only these operations:

- MessagingService publish;
- user restrictions read and write;
- universe restart.

Apply IP restrictions and an expiration date where your hosting environment permits them. Do not reuse a personal automation key with broader access.

## Configuration

Install dependencies and run:

```bash
npm ci --ignore-scripts
npm run setup
```

The wizard creates:

- `.env` for credentials and deployment identity;
- `config.json` for authorization and presentation settings.

Both files are ignored by Git. The two credential placeholders in `.env` must be replaced before startup.

| Environment variable | Purpose |
| --- | --- |
| `DISCORD_TOKEN` | Discord bot credential |
| `DISCORD_CLIENT_ID` | Discord application ID |
| `DISCORD_GUILD_ID` | Only guild allowed to execute commands |
| `ROBLOX_OPEN_CLOUD_API_KEY` | Universe-restricted Open Cloud credential |
| `ROBLOX_MESSAGING_SHARED_SECRET` | Authenticates kick messages to Roblox servers |
| `ROBLOX_UNIVERSE_ID` | Target Roblox universe |

| Configuration field | Purpose |
| --- | --- |
| `embedColor` | Six-character embed color |
| `logsChannelId` | Private staff audit channel; empty disables logging |
| `whitelistedRoles` | Discord roles allowed to moderate |
| `whitelistedUsers` | Discord users allowed to moderate |
| `whitelistedRobloxUsers` | Roblox accounts protected from moderation |
| `messagingTopic` | Topic shared with the Roblox server script |

## Roblox server script

Copy `RobloxScript/ModerationMessaging.server.lua` into `ServerScriptService` in every published place that can host players.

Set `TOPIC` to `config.json`'s `messagingTopic`, and set `MODERATION_SHARED_SECRET` to `.env`'s generated shared secret. The script intentionally stops during startup if the placeholder remains.

Publish the experience after updating the script. Test with a separate experience and non-privileged test accounts before connecting a production community.

## Node.js deployment

```bash
npm run register
npm run build
NODE_ENV=production npm start
```

Run command registration after command definitions or the target guild changes. Use a process supervisor such as systemd or your hosting platform's service manager for automatic restart and log collection.

## Docker Compose deployment

Complete setup on the host, then run:

```bash
docker compose up -d --build
docker compose logs -f moderation-bot
```

The container runs as a non-root user with a read-only filesystem, all Linux capabilities dropped, and `no-new-privileges` enabled. `.env` is injected as environment variables and `config.json` is mounted read-only.

Tagged releases publish multi-architecture images to:

```text
ghcr.io/focalorrr/roblox-moderation-bot
```

## Upgrades

1. Read `CHANGELOG.md` and the release notes.
2. Back up deployment-specific `.env` and `config.json` securely.
3. Pull the release or container tag.
4. Run type checking and tests when deploying from source.
5. Rerun `npm run register` when commands changed.
6. Confirm a test command and audit-log delivery before production moderation.

Pin production deployments to a release tag instead of `latest` when controlled rollouts are required.
