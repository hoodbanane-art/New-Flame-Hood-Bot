import { randomBytes } from "node:crypto";
import { existsSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { parseConfig, type BotConfig } from "./config/config.js";

export type SetupAnswers = {
  discordClientId: string;
  discordGuildId: string;
  robloxUniverseId: string;
  logsChannelId: string;
  whitelistedRoles: string[];
  whitelistedUsers: string[];
  whitelistedRobloxUsers: string[];
  messagingTopic: string;
};

const numericId = /^\d+$/;

export function generateSharedSecret(): string {
  return randomBytes(32).toString("base64url");
}

export function buildEnvFile(answers: SetupAnswers, sharedSecret: string): string {
  return [
    "# Replace the two credential placeholders before starting the bot.",
    "DISCORD_TOKEN=replace_with_your_discord_bot_token",
    `DISCORD_CLIENT_ID=${answers.discordClientId}`,
    `DISCORD_GUILD_ID=${answers.discordGuildId}`,
    "ROBLOX_OPEN_CLOUD_API_KEY=replace_with_your_roblox_open_cloud_api_key",
    `ROBLOX_MESSAGING_SHARED_SECRET=${sharedSecret}`,
    `ROBLOX_UNIVERSE_ID=${answers.robloxUniverseId}`,
    ""
  ].join("\n");
}

export function buildConfig(answers: SetupAnswers): BotConfig {
  return parseConfig({
    embedColor: "393A43",
    logsChannelId: answers.logsChannelId,
    whitelistedRoles: answers.whitelistedRoles,
    whitelistedUsers: answers.whitelistedUsers,
    whitelistedRobloxUsers: answers.whitelistedRobloxUsers,
    messagingTopic: answers.messagingTopic
  });
}

function parseIdList(value: string): string[] {
  const ids = value.split(",").map((item) => item.trim()).filter(Boolean);
  if (ids.some((id) => !numericId.test(id))) {
    throw new Error("IDs must be numeric and separated by commas.");
  }
  return ids;
}

async function runSetup(): Promise<void> {
  const force = process.argv.includes("--force");
  if (!force && (existsSync(".env") || existsSync("config.json"))) {
    throw new Error(".env or config.json already exists. Move it first, or rerun with --force to replace it.");
  }

  const terminal = createInterface({ input, output });
  const askId = async (label: string, optional = false): Promise<string> => {
    while (true) {
      const value = (await terminal.question(`${label}${optional ? " (optional)" : ""}: `)).trim();
      if ((optional && value === "") || numericId.test(value)) {
        return value;
      }
      output.write("Enter a numeric ID.\n");
    }
  };

  const askIds = async (label: string): Promise<string[]> => {
    while (true) {
      try {
        return parseIdList(await terminal.question(`${label} (comma-separated, optional): `));
      } catch (error) {
        output.write(`${error instanceof Error ? error.message : "Invalid IDs."}\n`);
      }
    }
  };

  try {
    output.write("Roblox Discord Moderation Bot setup\n\n");
    const discordClientId = await askId("Discord application/client ID");
    const discordGuildId = await askId("Discord server/guild ID");
    const robloxUniverseId = await askId("Roblox universe ID");
    const logsChannelId = await askId("Discord audit-log channel ID", true);
    const whitelistedRoles = await askIds("Whitelisted Discord role IDs");
    const whitelistedUsers = await askIds("Whitelisted Discord user IDs");
    const whitelistedRobloxUsers = await askIds("Protected Roblox user IDs");
    const topicInput = (await terminal.question("MessagingService topic [DiscordModeration]: ")).trim();

    const answers: SetupAnswers = {
      discordClientId,
      discordGuildId,
      robloxUniverseId,
      logsChannelId,
      whitelistedRoles,
      whitelistedUsers,
      whitelistedRobloxUsers,
      messagingTopic: topicInput || "DiscordModeration"
    };
    const sharedSecret = generateSharedSecret();

    await writeFile(".env", buildEnvFile(answers, sharedSecret), { mode: 0o600 });
    await writeFile("config.json", `${JSON.stringify(buildConfig(answers), null, 2)}\n`, { mode: 0o600 });

    output.write("\nCreated .env and config.json.\n");
    output.write("Next: replace the credential placeholders in .env and copy its generated shared secret into the Roblox server script.\n");
  } finally {
    terminal.close();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runSetup().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
