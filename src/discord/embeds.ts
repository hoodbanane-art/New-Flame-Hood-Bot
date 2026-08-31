import { EmbedBuilder, type APIEmbedField } from "discord.js";
import { embedColorNumber, type BotConfig } from "../config/config.js";
import type { RobloxUser, UserRestriction } from "../roblox/types.js";

type ActionEmbedOptions = {
  config: BotConfig;
  title: string;
  description?: string;
  moderatorTag?: string;
  target?: RobloxUser;
  reason?: string;
  extraFields?: APIEmbedField[];
};

export function actionEmbed(options: ActionEmbedOptions): EmbedBuilder {
  const fields: APIEmbedField[] = [];

  if (options.moderatorTag) {
    fields.push({ name: "Moderator", value: options.moderatorTag, inline: true });
  }

  if (options.target) {
    fields.push({
      name: "Target",
      value: `${options.target.name} (${options.target.id})`,
      inline: true
    });
  }

  if (options.reason) {
    fields.push({ name: "Reason", value: options.reason.slice(0, 1024), inline: false });
  }

  if (options.extraFields) {
    fields.push(...options.extraFields);
  }

  return new EmbedBuilder()
    .setColor(embedColorNumber(options.config))
    .setTitle(options.title)
    .setDescription(options.description ?? null)
    .addFields(fields)
    .setTimestamp();
}

export function banlistEmbed(config: BotConfig, restrictions: UserRestriction[], page: number): EmbedBuilder {
  const activeRestrictions = restrictions.filter((restriction) => restriction.gameJoinRestriction?.active);
  const description = activeRestrictions.length > 0
    ? activeRestrictions.map((restriction, index) => {
      const userId = restriction.user?.replace("users/", "") ?? restriction.path?.split("/").at(-1) ?? "Unknown";
      const reason = restriction.gameJoinRestriction?.displayReason ?? "No reason provided";
      const duration = restriction.gameJoinRestriction?.duration ?? "Permanent";
      return `**${index + 1}.** Roblox ID \`${userId}\` | ${duration}\n${reason}`;
    }).join("\n\n")
    : "No active bans were returned by Roblox.";

  return new EmbedBuilder()
    .setColor(embedColorNumber(config))
    .setTitle(`Active Roblox Bans - Page ${page}`)
    .setDescription(description.slice(0, 4096))
    .setTimestamp();
}
