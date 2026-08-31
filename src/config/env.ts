import "dotenv/config";
import { z } from "zod";

const credentialSchema = z.string().min(1).refine(
  (value) => !value.startsWith("replace_with_"),
  "Replace credential placeholders before starting the bot"
);

const envSchema = z.object({
  DISCORD_TOKEN: credentialSchema,
  DISCORD_CLIENT_ID: z.string().min(1),
  DISCORD_GUILD_ID: z.string().min(1),
  ROBLOX_OPEN_CLOUD_API_KEY: credentialSchema,
  ROBLOX_MESSAGING_SHARED_SECRET: z.string().min(32, "ROBLOX_MESSAGING_SHARED_SECRET must be at least 32 characters"),
  ROBLOX_UNIVERSE_ID: z.string().regex(/^\d+$/, "ROBLOX_UNIVERSE_ID must be numeric")
});

export type Env = z.infer<typeof envSchema>;

export function loadEnv(env: NodeJS.ProcessEnv = process.env): Env {
  return envSchema.parse(env);
}
