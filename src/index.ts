import { Client, Events, GatewayIntentBits, InteractionType } from "discord.js";
import { loadConfig } from "./config/config.js";
import { loadEnv } from "./config/env.js";
import { handleGameCommand } from "./commands/game.js";
import { canUseModerationCommands, isConfiguredGuild } from "./discord/permissions.js";
import { actionEmbed } from "./discord/embeds.js";
import { sendLog } from "./discord/logging.js";
import { RobloxClient } from "./roblox/robloxClient.js";

const env = loadEnv();
const config = loadConfig();
const roblox = new RobloxClient({
  apiKey: env.ROBLOX_OPEN_CLOUD_API_KEY,
  messagingSharedSecret: env.ROBLOX_MESSAGING_SHARED_SECRET,
  universeId: env.ROBLOX_UNIVERSE_ID
});

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

let shuttingDown = false;
const shutdown = (signal: NodeJS.Signals): void => {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;
  console.log(`Received ${signal}; disconnecting from Discord.`);
  client.destroy();
};

process.once("SIGINT", shutdown);
process.once("SIGTERM", shutdown);

client.once(Events.ClientReady, (readyClient) => {
  console.log(`Logged in as ${readyClient.user.tag}`);
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (interaction.type !== InteractionType.ApplicationCommand || !interaction.isChatInputCommand()) {
    return;
  }

  if (interaction.commandName !== "game") {
    return;
  }

  if (!isConfiguredGuild(interaction.guildId, env.DISCORD_GUILD_ID)) {
    await interaction.reply({
      ephemeral: true,
      content: "This command is only available in the configured moderation server."
    });
    return;
  }

  if (!canUseModerationCommands(interaction, config)) {
    await interaction.reply({
      ephemeral: true,
      embeds: [
        actionEmbed({
          config,
          title: "Permission Denied",
          description: "You need a whitelisted role, a whitelisted user ID, or Administrator permission to use this command."
        })
      ]
    });
    await sendLog(client, config, "Permission Denied", `${interaction.user.tag} tried to run /game without permission.`);
    return;
  }

  await handleGameCommand(interaction, { config, roblox });
});

await client.login(env.DISCORD_TOKEN);
