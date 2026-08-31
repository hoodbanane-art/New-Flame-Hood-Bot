import { describe, expect, it } from "vitest";
import { embedColorNumber, parseConfig } from "../src/config/config.js";

describe("config", () => {
  it("parses valid config", () => {
    const config = parseConfig({
      embedColor: "393A43",
      logsChannelId: "123",
      whitelistedRoles: ["456"],
      whitelistedUsers: ["789"],
      whitelistedRobloxUsers: [12345],
      messagingTopic: "DiscordModeration"
    });

    expect(config.whitelistedRobloxUsers).toEqual(["12345"]);
    expect(embedColorNumber(config)).toBe(0x393A43);
  });

  it("rejects malformed color and IDs", () => {
    expect(() => parseConfig({ embedColor: "nope", logsChannelId: "abc" })).toThrow();
  });
});
