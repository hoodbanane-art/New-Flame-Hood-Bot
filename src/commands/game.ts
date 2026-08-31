import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChatInputCommandInteraction,
  ComponentType,
  SlashCommandBuilder
} from "discord.js";
import type { BotConfig } from "../config/config.js";
import { actionEmbed, banlistEmbed } from "../discord/embeds.js";
import { isProtectedRobloxUser } from "../discord/permissions.js";
import { sendLog } from "../discord/logging.js";
import type { RobloxClient } from "../roblox/robloxClient.js";
import { parseDuration } from "../utils/duration.js";

export const gameCommand = new SlashCommandBuilder()
  .setName("game")
  .setDescription("Roblox game moderation commands.")
  .addSubcommand((subcommand) => subcommand
    .setName("kick")
    .setDescription("Kick a Roblox user from all live servers.")
    .addStringOption((option) => option.setName("username").setDescription("Roblox username or user ID.").setRequired(true).setMaxLength(64))
    .addStringOption((option) => option.setName("reason").setDescription("Kick reason.").setRequired(true).setMaxLength(512)))
  .addSubcommand((subcommand) => subcommand
    .setName("ban")
    .setDescription("Ban a Roblox user from the universe.")
    .addStringOption((option) => option.setName("username").setDescription("Roblox username or user ID.").setRequired(true).setMaxLength(64))
    .addBooleanOption((option) => option.setName("banalts").setDescription("Also affect suspected alt accounts.").setRequired(true))
    .addStringOption((option) => option.setName("duration").setDescription("Example: 30m, 7d, 1mo, permanent.").setRequired(true).setMaxLength(32))
    .addStringOption((option) => option.setName("reason").setDescription("Ban reason.").setRequired(true).setMaxLength(512)))
  .addSubcommand((subcommand) => subcommand
    .setName("banlist")
    .setDescription("Show active Roblox bans."))
  .addSubcommand((subcommand) => subcommand
    .setName("unban")
    .setDescription("Unban a Roblox user from the universe.")
    .addStringOption((option) => option.setName("username").setDescription("Roblox username or user ID.").setRequired(true).setMaxLength(64))
    .addStringOption((option) => option.setName("reason").setDescription("Unban reason.").setRequired(true).setMaxLength(512)))
  .addSubcommand((subcommand) => subcommand
    .setName("restartservers")
    .setDescription("Restart all active servers for the configured Roblox universe."));

type GameCommandDeps = {
  config: BotConfig;
  roblox: RobloxClient;
};

export async function handleGameCommand(interaction: ChatInputCommandInteraction, deps: GameCommandDeps): Promise<void> {
  const subcommand = interaction.options.getSubcommand();

  try {
    if (subcommand === "banlist") {
      await handleBanlist(interaction, deps);
      return;
    }

    if (subcommand === "restartservers") {
      await confirmAndRun(interaction, deps.config, {
        title: "Confirm Server Restart",
        description: "This will ask Roblox to restart all active servers for the configured universe.",
        logTitle: "Restart Servers",
        run: async () => deps.roblox.restartServers()
      });
      return;
    }

    const targetInput = interaction.options.getString("username", true);
    const reason = interaction.options.getString("reason", true);
    const target = await deps.roblox.resolveUser(targetInput);

    if (isProtectedRobloxUser(target.id, deps.config.whitelistedRobloxUsers)) {
      await interaction.reply({
        ephemeral: true,
        embeds: [
          actionEmbed({
            config: deps.config,
            title: "Protected Roblox User",
            description: "That Roblox user is configured as protected and cannot be moderated by this bot.",
            target,
            reason
          })
        ]
      });
      await sendLog(interaction.client, deps.config, "Protected User Attempt", `${interaction.user.tag} tried to run /game ${subcommand} on ${target.name} (${target.id}).`);
      return;
    }

    if (subcommand === "kick") {
      await confirmAndRun(interaction, deps.config, {
        title: "Confirm Kick",
        description: `Kick ${target.name} from all live servers?`,
        target,
        reason,
        logTitle: "Kick",
        run: async () => {
          const requestId = await deps.roblox.publishKick({
            topic: deps.config.messagingTopic,
            user: target,
            reason,
            moderatorDiscordId: interaction.user.id
          });
          return `Messaging request ID: ${requestId}`;
        }
      });
      return;
    }

    if (subcommand === "ban") {
      const duration = parseDuration(interaction.options.getString("duration", true));
      const banAlts = interaction.options.getBoolean("banalts", true);

      await confirmAndRun(interaction, deps.config, {
        title: "Confirm Ban",
        description: `Ban ${target.name} from the configured universe?`,
        target,
        reason,
        logTitle: "Ban",
        extra: [
          { name: "Duration", value: duration.label, inline: true },
          { name: "Ban Alts", value: banAlts ? "Yes" : "No", inline: true }
        ],
        run: async () => deps.roblox.banUser({
          userId: target.id,
          reason,
          duration,
          banAlts
        })
      });
      return;
    }

    if (subcommand === "unban") {
      await confirmAndRun(interaction, deps.config, {
        title: "Confirm Unban",
        description: `Unban ${target.name} from the configured universe?`,
        target,
        reason,
        logTitle: "Unban",
        run: async () => deps.roblox.unbanUser(target.id, reason)
      });
      return;
    }

    await interaction.reply({ ephemeral: true, content: "Unknown subcommand." });
  } catch (error) {
    const message = error instanceof Error ? error.message : "An unknown error occurred.";
    const payload = {
      ephemeral: true,
      embeds: [
        actionEmbed({
          config: deps.config,
          title: "Command Failed",
          description: message
        })
      ]
    };

    if (interaction.deferred || interaction.replied) {
      await interaction.editReply(payload);
    } else {
      await interaction.reply(payload);
    }

    await sendLog(interaction.client, deps.config, "Roblox Command Failed", `${interaction.user.tag} ran /game ${subcommand}: ${message}`);
  }
}

type ConfirmOptions = {
  title: string;
  description: string;
  logTitle: string;
  target?: Parameters<typeof actionEmbed>[0]["target"];
  reason?: string;
  extra?: Parameters<typeof actionEmbed>[0]["extraFields"];
  run: () => Promise<unknown>;
};

async function confirmAndRun(
  interaction: ChatInputCommandInteraction,
  config: BotConfig,
  options: ConfirmOptions
): Promise<void> {
  const confirmId = `confirm:${interaction.id}`;
  const cancelId = `cancel:${interaction.id}`;
  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId(confirmId).setLabel("Confirm").setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId(cancelId).setLabel("Cancel").setStyle(ButtonStyle.Secondary)
  );

  const response = await interaction.reply({
    ephemeral: true,
    embeds: [
      actionEmbed({
        config,
        title: options.title,
        description: options.description,
        moderatorTag: interaction.user.tag,
        target: options.target,
        reason: options.reason,
        extraFields: options.extra
      })
    ],
    components: [row]
  });

  const button = await response.awaitMessageComponent({
    componentType: ComponentType.Button,
    time: 30_000,
    filter: (componentInteraction) => componentInteraction.user.id === interaction.user.id
  }).catch(() => null);

  if (!button) {
    await interaction.editReply({
      embeds: [
        actionEmbed({
          config,
          title: "Confirmation Timed Out",
          description: "No action was taken."
        })
      ],
      components: []
    });
    await sendLog(interaction.client, config, `${options.logTitle} Timed Out`, `${interaction.user.tag} did not confirm the action.`);
    return;
  }

  if (button.customId === cancelId) {
    await button.update({
      embeds: [
        actionEmbed({
          config,
          title: "Action Cancelled",
          description: "No action was taken.",
          target: options.target,
          reason: options.reason
        })
      ],
      components: []
    });
    await sendLog(interaction.client, config, `${options.logTitle} Cancelled`, `${interaction.user.tag} cancelled the action.`);
    return;
  }

  await button.update({
    embeds: [
      actionEmbed({
        config,
        title: "Working...",
        description: "Sending request to Roblox.",
        target: options.target,
        reason: options.reason
      })
    ],
    components: []
  });

  const result = await options.run();
  const resultText = typeof result === "string" ? result : "Roblox accepted the request.";

  await interaction.editReply({
    embeds: [
      actionEmbed({
        config,
        title: `${options.logTitle} Complete`,
        description: resultText,
        moderatorTag: interaction.user.tag,
        target: options.target,
        reason: options.reason,
        extraFields: options.extra
      })
    ],
    components: []
  });

  await sendLog(interaction.client, config, `${options.logTitle} Complete`, `${interaction.user.tag} completed ${options.logTitle.toLowerCase()}. ${resultText}`);
}

async function handleBanlist(interaction: ChatInputCommandInteraction, deps: GameCommandDeps): Promise<void> {
  await interaction.deferReply({ ephemeral: true });

  const pages: string[] = [""];
  let pageIndex = 0;
  let response = await deps.roblox.listActiveBans();

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId(`banlist-prev:${interaction.id}`).setLabel("Previous").setStyle(ButtonStyle.Secondary).setDisabled(true),
    new ButtonBuilder().setCustomId(`banlist-next:${interaction.id}`).setLabel("Next").setStyle(ButtonStyle.Primary).setDisabled(!response.nextPageToken)
  );

  const message = await interaction.editReply({
    embeds: [banlistEmbed(deps.config, response.userRestrictions ?? [], pageIndex + 1)],
    components: [row]
  });

  const collector = message.createMessageComponentCollector({
    componentType: ComponentType.Button,
    time: 120_000,
    filter: (componentInteraction) => componentInteraction.user.id === interaction.user.id
  });

  collector.on("collect", async (componentInteraction) => {
    if (componentInteraction.customId.startsWith("banlist-next") && response.nextPageToken) {
      pages[pageIndex + 1] = response.nextPageToken;
      pageIndex += 1;
      response = await deps.roblox.listActiveBans(pages[pageIndex]);
    } else if (componentInteraction.customId.startsWith("banlist-prev") && pageIndex > 0) {
      pageIndex -= 1;
      response = await deps.roblox.listActiveBans(pages[pageIndex]);
    }

    const updatedRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId(`banlist-prev:${interaction.id}`).setLabel("Previous").setStyle(ButtonStyle.Secondary).setDisabled(pageIndex === 0),
      new ButtonBuilder().setCustomId(`banlist-next:${interaction.id}`).setLabel("Next").setStyle(ButtonStyle.Primary).setDisabled(!response.nextPageToken)
    );

    await componentInteraction.update({
      embeds: [banlistEmbed(deps.config, response.userRestrictions ?? [], pageIndex + 1)],
      components: [updatedRow]
    });
  });

  collector.on("end", async () => {
    await interaction.editReply({ components: [] }).catch(() => undefined);
  });
}
