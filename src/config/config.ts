import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { z } from "zod";

const snowflakeSchema = z.string().regex(/^\d+$/, "Discord IDs must be numeric strings");
const robloxUserIdSchema = z.union([z.string().regex(/^\d+$/), z.number().int().positive()])
  .transform((value) => String(value));

const configSchema = z.object({
  embedColor: z.string().regex(/^[0-9a-fA-F]{6}$/).default("393A43"),
  logsChannelId: z.union([snowflakeSchema, z.literal("")]).default(""),
  whitelistedRoles: z.array(snowflakeSchema).default([]),
  whitelistedUsers: z.array(snowflakeSchema).default([]),
  whitelistedRobloxUsers: z.array(robloxUserIdSchema).default([]),
  messagingTopic: z.string().min(1).max(80).default("DiscordModeration")
});

export type BotConfig = z.infer<typeof configSchema>;

export function parseConfig(value: unknown): BotConfig {
  return configSchema.parse(value);
}

export function loadConfig(path = resolve(process.cwd(), "config.json")): BotConfig {
  const raw = readFileSync(path, "utf8");
  return parseConfig(JSON.parse(raw));
}

export function embedColorNumber(config: Pick<BotConfig, "embedColor">): number {
  return Number.parseInt(config.embedColor, 16);
}
