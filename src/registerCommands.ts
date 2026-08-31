import { REST, Routes } from "discord.js";
import { gameCommand } from "./commands/game.js";
import { loadEnv } from "./config/env.js";

const env = loadEnv();
const rest = new REST({ version: "10" }).setToken(env.DISCORD_TOKEN);

await rest.put(
  Routes.applicationGuildCommands(env.DISCORD_CLIENT_ID, env.DISCORD_GUILD_ID),
  {
    body: [gameCommand.toJSON()]
  }
);

console.log("Registered /game commands.");
