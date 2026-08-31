import { describe, expect, it } from "vitest";
import { buildConfig, buildEnvFile, generateSharedSecret, type SetupAnswers } from "../src/setup.js";

const answers: SetupAnswers = {
  discordClientId: "100",
  discordGuildId: "200",
  robloxUniverseId: "300",
  logsChannelId: "400",
  whitelistedRoles: ["500"],
  whitelistedUsers: ["600"],
  whitelistedRobloxUsers: ["700"],
  messagingTopic: "DiscordModeration"
};

describe("setup", () => {
  it("generates a strong URL-safe shared secret", () => {
    const secret = generateSharedSecret();
    expect(secret.length).toBeGreaterThanOrEqual(32);
    expect(secret).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it("builds an environment file without real credential values", () => {
    const env = buildEnvFile(answers, "a".repeat(32));
    expect(env).toContain("DISCORD_GUILD_ID=200");
    expect(env).toContain(`ROBLOX_MESSAGING_SHARED_SECRET=${"a".repeat(32)}`);
    expect(env).toContain("DISCORD_TOKEN=replace_with_your_discord_bot_token");
  });

  it("builds a validated bot configuration", () => {
    expect(buildConfig(answers)).toMatchObject({
      logsChannelId: "400",
      whitelistedRoles: ["500"],
      whitelistedRobloxUsers: ["700"]
    });
  });
});
