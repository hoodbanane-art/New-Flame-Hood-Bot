import type { Client } from "discord.js";
import type { BotConfig } from "../config/config.js";
import { actionEmbed } from "./embeds.js";

export async function sendLog(
  client: Client,
  config: BotConfig,
  title: string,
  description: string
): Promise<void> {
  if (!config.logsChannelId) {
    return;
  }

  const channel = await client.channels.fetch(config.logsChannelId).catch(() => null);
  if (!channel?.isTextBased()) {
    return;
  }

  if (!("send" in channel) || typeof channel.send !== "function") {
    return;
  }

  await channel.send({
    allowedMentions: { parse: [] },
    embeds: [
      actionEmbed({
        config,
        title,
        description
      })
    ]
  }).catch(() => undefined);
}
