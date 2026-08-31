# Architecture

## Components

| Component | Responsibility | Trusted data |
| --- | --- | --- |
| Discord bot | Authorization, confirmation, command routing, and audit output | Discord token, moderator identity |
| Roblox client | Open Cloud requests and response normalization | Roblox API key, universe ID |
| MessagingService listener | Validates and applies cross-server kick messages | Shared secret, request ID, message timestamp |
| Configuration | Allow lists, protected accounts, topic, and log channel | Discord and Roblox IDs |

The bot is stateless. Roblox remains the authority for user restrictions, while Discord supplies the staff identity and command interface.

## Request paths

### Ban, unban, list, and restart

1. Discord delivers a guild slash-command interaction.
2. The bot verifies the configured guild and the moderator's user, role, or Administrator permission.
3. State-changing commands require an ephemeral confirmation from the same Discord user.
4. The bot calls the relevant Roblox Open Cloud endpoint with a universe-restricted API key.
5. The result is shown privately and an action summary is sent to the configured audit channel.

### Kick

1. Authorization and confirmation run as above.
2. The bot publishes a versioned JSON message to the configured MessagingService topic.
3. Every live Roblox server receives the message.
4. The server script checks the Roblox delivery timestamp, payload version, shared secret, request ID, target ID, and reason length.
5. Duplicate or stale messages are rejected; a matching online player is kicked.

## Trust boundaries

- Discord command input is untrusted until the guild and moderator checks pass.
- Roblox usernames, API responses, and pagination tokens are treated as external input.
- MessagingService delivery does not itself prove that the message came from this bot, so the application-level shared secret is required.
- `.env`, `config.json`, and the Roblox server script are deployment-specific and must be available only to operators.
- Discord audit output disables mentions to prevent user-controlled notification abuse.

## Intentional limitations

- One deployment maps one Discord guild to one Roblox universe.
- The bot does not store moderation history outside Roblox and the Discord log channel.
- There is no hosted multi-tenant service; operators retain their own credentials and infrastructure.
- MessagingService delivery is best effort, so a player can leave before a kick reaches their server. Persistent bans use user restrictions instead.
