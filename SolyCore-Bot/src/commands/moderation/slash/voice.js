const deafen = require("../shared/deafen");
const vmute = require("../shared/vmute");
const vunmute = require("../shared/vunmute");
const undeafen = require("../shared/undeafen");
const disconnect = require("../shared/disconnect");
const move = require("../shared/move");
const { ApplicationCommandOptionType, ChannelType } = require("discord.js");

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "voice",
  description: "comandos de moderación de voz",
  category: "MODERATION",
  userPermissions: ["MuteMembers", "MoveMembers", "DeafenMembers"],
  botPermissions: ["MuteMembers", "MoveMembers", "DeafenMembers"],
  command: {
    enabled: false,
  },
  slashCommand: {
    enabled: true,
    options: [
      {
        name: "mute",
        description: "silenciar la voz de un miembro",
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: "user",
            description: "el miembro objetivo",
            type: ApplicationCommandOptionType.User,
            required: true,
          },
          {
            name: "reason",
            description: "razón para silenciar",
            type: ApplicationCommandOptionType.String,
            required: false,
          },
        ],
      },
      {
        name: "unmute",
        description: "anular el silencio de la voz de un miembro silenciado",
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: "user",
            description: "el miembro objetivo",
            type: ApplicationCommandOptionType.User,
            required: true,
          },
          {
            name: "reason",
            description: "motivo de la anulación del silencio",
            type: ApplicationCommandOptionType.String,
            required: false,
          },
        ],
      },
      {
        name: "deafen",
        description: "ensordecer a un miembro en el canal de voz",
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: "user",
            description: "el miembro objetivo",
            type: ApplicationCommandOptionType.User,
            required: true,
          },
          {
            name: "reason",
            description: "motivo del ensordecimiento",
            type: ApplicationCommandOptionType.String,
            required: false,
          },
        ],
      },
      {
        name: "undeafen",
        description: "ensordecer a un miembro en el canal de voz",
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: "user",
            description: "el miembro objetivo",
            type: ApplicationCommandOptionType.User,
            required: true,
          },
          {
            name: "reason",
            description: "razón del ensordecimiento",
            type: ApplicationCommandOptionType.String,
            required: false,
          },
        ],
      },
      {
        name: "kick",
        description: "expulsar a un miembro del canal de voz",
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: "user",
            description: "el miembro objetivo",
            type: ApplicationCommandOptionType.User,
            required: true,
          },
          {
            name: "reason",
            description: "razón para silenciar",
            type: ApplicationCommandOptionType.String,
            required: false,
          },
        ],
      },
      {
        name: "move",
        description: "mover a un miembro de un canal de voz a otro",
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: "user",
            description: "el miembro objetivo",
            type: ApplicationCommandOptionType.User,
            required: true,
          },
          {
            name: "channel",
            description: "el canal al que mover al miembro",
            type: ApplicationCommandOptionType.Channel,
            channelTypes: [ChannelType.GuildVoice, ChannelType.GuildStageVoice],
            required: true,
          },
          {
            name: "reason",
            description: "razón del silencio",
            type: ApplicationCommandOptionType.String,
            required: false,
          },
        ],
      },
    ],
  },

  async interactionRun(interaction) {
    const sub = interaction.options.getSubcommand();
    const reason = interaction.options.getString("reason");

    const user = interaction.options.getUser("user");
    const target = await interaction.guild.members.fetch(user.id);

    let response;

    if (sub === "mute") response = await vmute(interaction, target, reason);
    else if (sub === "unmute") response = await vunmute(interaction, target, reason);
    else if (sub === "deafen") response = await deafen(interaction, target, reason);
    else if (sub === "undeafen") response = await undeafen(interaction, target, reason);
    else if (sub === "kick") response = await disconnect(interaction, target, reason);
    else if (sub == "move") {
      const channel = interaction.options.getChannel("channel");
      response = await move(interaction, target, reason, channel);
    }

    await interaction.followUp(response);
  },
};
