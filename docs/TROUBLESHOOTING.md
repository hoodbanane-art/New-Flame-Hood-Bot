# Troubleshooting

## The bot exits during startup

Configuration is validated before Discord login. Read the validation message, check that `.env` and `config.json` exist in the current working directory, and replace all `replace_with_...` credential placeholders.

## The `/game` command is missing

Run `npm run register` using the client ID, guild ID, and token for the same Discord application. Guild commands normally appear quickly. Confirm the application was installed with the `applications.commands` scope.

## Permission is denied

The interaction must originate from `DISCORD_GUILD_ID`. The Discord user must be explicitly allow-listed, have an allow-listed role, or have Administrator permission. IDs must be quoted numeric strings in `config.json`.

## Roblox returns HTTP 401 or 403

- Verify the Open Cloud key is current and copied without whitespace.
- Confirm it belongs to an account or group with access to the universe.
- Check universe restrictions, operation scopes, IP restrictions, and expiration.
- Rotate the key if it may have been exposed.

## Bans work but kicks do not

- Confirm the server script is in `ServerScriptService` in every playable place.
- Publish the latest experience version.
- Make `TOPIC` match `messagingTopic` exactly.
- Make `MODERATION_SHARED_SECRET` match `.env` exactly and contain at least 32 characters.
- Inspect Roblox server output for `[DiscordModeration]` warnings.
- Confirm the message arrives within 90 seconds and server clocks are not being manipulated in tests.

## Audit logs do not appear

Ensure `logsChannelId` is correct and the bot can view the channel, send messages, and embed links. Logging failures do not block moderation commands.

## Docker container exits or restarts

```bash
docker compose config
docker compose logs --tail=200 moderation-bot
```

Confirm `.env` and `config.json` exist before starting Compose and that `config.json` is a file rather than a directory created by an absent bind-mount source.

## Asking for help

Search existing issues, then use the bug template with the release or commit, deployment method, reproduction steps, and sanitized logs. Never include tokens, API keys, shared secrets, private user information, or moderation records.
