import { describe, expect, it } from "vitest";
import { PermissionsBitField } from "discord.js";
import { canUseModerationCommands, isConfiguredGuild, isProtectedRobloxUser } from "../src/discord/permissions.js";

const config = {
  whitelistedRoles: ["role-1"],
  whitelistedUsers: ["user-1"]
};

describe("permissions", () => {
  it("allows whitelisted users", () => {
    expect(canUseModerationCommands({ user: { id: "user-1" }, member: null } as never, config)).toBe(true);
  });

  it("allows administrators", () => {
    expect(canUseModerationCommands({
      user: { id: "user-2" },
      member: {
        permissions: new PermissionsBitField(PermissionsBitField.Flags.Administrator),
        roles: { cache: new Map() }
      }
    } as never, config)).toBe(true);
  });

  it("allows whitelisted roles", () => {
    expect(canUseModerationCommands({
      user: { id: "user-2" },
      member: {
        permissions: new PermissionsBitField(0n),
        roles: { cache: new Map([["role-1", true]]) }
      }
    } as never, config)).toBe(true);
  });

  it("protects Roblox users", () => {
    expect(isProtectedRobloxUser(123, ["123"])).toBe(true);
    expect(isProtectedRobloxUser(456, ["123"])).toBe(false);
  });

  it("only accepts the configured guild", () => {
    expect(isConfiguredGuild("guild-1", "guild-1")).toBe(true);
    expect(isConfiguredGuild("guild-2", "guild-1")).toBe(false);
    expect(isConfiguredGuild(null, "guild-1")).toBe(false);
  });
});
