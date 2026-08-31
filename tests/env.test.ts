import { describe, expect, it } from "vitest";
import { loadEnv } from "../src/config/env.js";

const validEnv = {
  DISCORD_TOKEN: "discord-token",
  DISCORD_CLIENT_ID: "100",
  DISCORD_GUILD_ID: "200",
  ROBLOX_OPEN_CLOUD_API_KEY: "roblox-key",
  ROBLOX_MESSAGING_SHARED_SECRET: "a".repeat(32),
  ROBLOX_UNIVERSE_ID: "300"
};

describe("environment", () => {
  it("accepts a complete environment", () => {
    expect(loadEnv(validEnv)).toMatchObject({
      DISCORD_GUILD_ID: "200",
      ROBLOX_UNIVERSE_ID: "300"
    });
  });

  it("rejects setup credential placeholders", () => {
    expect(() => loadEnv({
      ...validEnv,
      DISCORD_TOKEN: "replace_with_your_discord_bot_token"
    })).toThrow(/Replace credential placeholders/);
  });

  it("rejects short messaging secrets", () => {
    expect(() => loadEnv({
      ...validEnv,
      ROBLOX_MESSAGING_SHARED_SECRET: "short"
    })).toThrow(/at least 32 characters/);
  });
});
