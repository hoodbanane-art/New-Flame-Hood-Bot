import { PermissionFlagsBits, type ChatInputCommandInteraction, type GuildMember } from "discord.js";
import type { BotConfig } from "../config/config.js";

export function canUseModerationCommands(
  interaction: Pick<ChatInputCommandInteraction, "member" | "user">,
  config: Pick<BotConfig, "whitelistedRoles" | "whitelistedUsers">
): boolean {
  if (config.whitelistedUsers.includes(interaction.user.id)) {
    return true;
  }

  const member = interaction.member;
  if (!member || typeof member === "string") {
    return false;
  }

  const permissions = (member as GuildMember).permissions;
  if (permissions?.has(PermissionFlagsBits.Administrator)) {
    return true;
  }

  const guildMember = member as GuildMember;
  return config.whitelistedRoles.some((roleId) => guildMember.roles.cache.has(roleId));
}

export function isConfiguredGuild(guildId: string | null, configuredGuildId: string): boolean {
  return guildId === configuredGuildId;
}

export function isProtectedRobloxUser(userId: number, protectedUsers: string[]): boolean {
  return protectedUsers.includes(String(userId));
}
