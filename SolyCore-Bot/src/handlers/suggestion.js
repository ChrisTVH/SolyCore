const { getSettings } = require("@schemas/Guild");
const { findSuggestion, deleteSuggestionDb } = require("@schemas/Suggestions");
const { SUGGESTIONS } = require("@root/config");
const {
  ActionRowBuilder,
  ButtonBuilder,
  ModalBuilder,
  TextInputBuilder,
  EmbedBuilder,
  ButtonStyle,
  TextInputStyle,
} = require("discord.js");
const { stripIndents } = require("common-tags");

/**
 * @param {import('discord.js').Message} message
 */
const getStats = (message) => {
  const upVotes = (message.reactions.resolve(SUGGESTIONS.EMOJI.UP_VOTE)?.count || 0) - 1;
  const downVotes = (message.reactions.resolve(SUGGESTIONS.EMOJI.DOWN_VOTE)?.count || 0) - 1;
  return [upVotes, downVotes];
};

/**
 * @param {number} upVotes
 * @param {number} downVotes
 */
const getVotesMessage = (upVotes, downVotes) => {
  const total = upVotes + downVotes;
  if (total === 0) {
    return stripIndents`
  _Upvotes: NA_
  _Downvotes: NA_
  `;
  } else {
    return stripIndents`
  _Upvotes: ${upVotes} [${Math.round((upVotes / (upVotes + downVotes)) * 100)}%]_
  _Downvotes: ${downVotes} [${Math.round((downVotes / (upVotes + downVotes)) * 100)}%]_
  `;
  }
};

const hasPerms = (member, settings) => {
  return (
    member.permissions.has("ManageGuild") ||
    member.roles.cache.find((r) => settings.suggestions.staff_roles.includes(r.id))
  );
};

/**
 * @param {import('discord.js').GuildMember} member
 * @param {import('discord.js').TextBasedChannel} channel
 * @param {string} messageId
 * @param {string} [reason]
 */
async function approveSuggestion(member, channel, messageId, reason) {
  const { guild } = member;
  const settings = await getSettings(guild);

  // validate permissions
  if (!hasPerms(member, settings)) return "No tiene permiso para aprobar sugerencias.";

  // validate if document exists
  const doc = await findSuggestion(guild.id, messageId);
  if (!doc) return "Sugerencia no encontrada";
  if (doc.status === "APPROVED") return "Sugerencia ya aprobada";

  /**
   * @type {import('discord.js').Message}
   */
  let message;
  try {
    message = await channel.messages.fetch({ message: messageId, force: true });
  } catch (err) {
    return "Mensaje de sugerencia no encontrado";
  }

  let buttonsRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("SUGGEST_APPROVE")
      .setLabel("Aprobar")
      .setStyle(ButtonStyle.Success)
      .setDisabled(true),
    new ButtonBuilder().setCustomId("SUGGEST_REJECT").setLabel("Reject").setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId("SUGGEST_DELETE").setLabel("Delete").setStyle(ButtonStyle.Secondary)
  );

  const approvedEmbed = new EmbedBuilder()
    .setDescription(message.embeds[0].data.description)
    .setColor(SUGGESTIONS.APPROVED_EMBED)
    .setAuthor({ name: "Sugerencia aprobada" })
    .setFooter({ text: `Aprobado por ${member.user.tag}`, iconURL: member.displayAvatarURL() })
    .setTimestamp();

  const fields = [];

  // añadir estadísticas si no existen
  const statsField = message.embeds[0].fields.find((field) => field.name === "Stats");
  if (!statsField) {
    const [upVotes, downVotes] = getStats(message);
    doc.stats.upvotes = upVotes;
    doc.stats.downvotes = downVotes;
    fields.push({ name: "Stats", value: getVotesMessage(upVotes, downVotes) });
  } else {
    fields.push(statsField);
  }

  // motivo de la actualización
  if (reason) fields.push({ name: "Reason", value: "```" + reason + "```" });

  approvedEmbed.addFields(fields);

  try {
    doc.status = "APPROVED";
    doc.status_updates.push({ user_id: member.id, status: "APPROVED", reason, timestamp: new Date() });

    let approveChannel;
    if (settings.suggestions.approved_channel) {
      approveChannel = guild.channels.cache.get(settings.suggestions.approved_channel);
    }

    // el canal sugerencias-aprobar no está configurado
    if (!approveChannel) {
      await message.edit({ embeds: [approvedEmbed], components: [buttonsRow] });
      await message.reactions.removeAll();
    }

    // el canal sugerencias-aprobar está configurado
    else {
      const sent = await approveChannel.send({ embeds: [approvedEmbed], components: [buttonsRow] });
      doc.channel_id = approveChannel.id;
      doc.message_id = sent.id;
      await message.delete();
    }

    await doc.save();
    return "Sugerencia aprobada";
  } catch (ex) {
    guild.client.logger.error("approveSuggestion", ex);
    return "Sugerencia no aprobada";
  }
}

/**
 * @param {import('discord.js').GuildMember} member
 * @param {import('discord.js').TextBasedChannel} channel
 * @param {string} messageId
 * @param {string} [reason]
 */
async function rejectSuggestion(member, channel, messageId, reason) {
  const { guild } = member;
  const settings = await getSettings(guild);

  // validate permissions
  if (!hasPerms(member, settings)) return "No tienes permiso para rechazar sugerencias.";

  // validate if document exists
  const doc = await findSuggestion(guild.id, messageId);
  if (!doc) return "Sugerencia no encontrada";
  if (doc.is_rejected) return "Sugerencia ya rechazada";

  let message;
  try {
    message = await channel.messages.fetch({ message: messageId });
  } catch (err) {
    return "Mensaje de sugerencia no encontrado";
  }

  let buttonsRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("SUGGEST_APPROVE").setLabel("Aprobar").setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId("SUGGEST_REJECT").setLabel("Rechazar").setStyle(ButtonStyle.Danger).setDisabled(true),
    new ButtonBuilder().setCustomId("SUGGEST_DELETE").setLabel("Borrar").setStyle(ButtonStyle.Secondary)
  );

  const rejectedEmbed = new EmbedBuilder()
    .setDescription(message.embeds[0].data.description)
    .setColor(SUGGESTIONS.DENIED_EMBED)
    .setAuthor({ name: "Sugerencia rechazada" })
    .setFooter({ text: `Rechazado por ${member.user.tag}`, iconURL: member.displayAvatarURL() })
    .setTimestamp();

  const fields = [];

  // añadir estadísticas si no existen
  const statsField = message.embeds[0].fields.find((field) => field.name === "Stats");
  if (!statsField) {
    const [upVotes, downVotes] = getStats(message);
    doc.stats.upvotes = upVotes;
    doc.stats.downvotes = downVotes;
    fields.push({ name: "Estadísticas", value: getVotesMessage(upVotes, downVotes) });
  } else {
    fields.push(statsField);
  }

  // motivo de la actualización
  if (reason) fields.push({ name: "Razón", value: "```" + reason + "```" });

  rejectedEmbed.addFields(fields);

  try {
    doc.status = "REJECTED";
    doc.status_updates.push({ user_id: member.id, status: "REJECTED", reason, timestamp: new Date() });

    let rejectChannel;
    if (settings.suggestions.rejected_channel) {
      rejectChannel = guild.channels.cache.get(settings.suggestions.rejected_channel);
    }

    // el canal sugerencias-rechazo no está configurado
    if (!rejectChannel) {
      await message.edit({ embeds: [rejectedEmbed], components: [buttonsRow] });
      await message.reactions.removeAll();
    }

    // se configura el canal sugerencias-rechazo
    else {
      const sent = await rejectChannel.send({ embeds: [rejectedEmbed], components: [buttonsRow] });
      doc.channel_id = rejectChannel.id;
      doc.message_id = sent.id;
      await message.delete();
    }

    await doc.save();
    return "Sugerencia rechazada";
  } catch (ex) {
    guild.client.logger.error("rejectSuggestion", ex);
    return "No rechazó la sugerencia";
  }
}

/**
 * @param {import('discord.js').GuildMember} member
 * @param {import('discord.js').TextBasedChannel} channel
 * @param {string} messageId
 * @param {string} [reason]
 */
async function deleteSuggestion(member, channel, messageId, reason) {
  const { guild } = member;
  const settings = await getSettings(guild);

  // validar permisos
  if (!hasPerms(member, settings)) return "No tienes permiso para borrar sugerencias.";

  try {
    await channel.messages.delete(messageId);
    await deleteSuggestionDb(guild.id, messageId, member.id, reason);
    return "Sugerencia suprimida";
  } catch (ex) {
    guild.client.logger.error("deleteSuggestion", ex);
    return "No se ha podido eliminar la sugerencia. Por favor, borre manualmente.";
  }
}

/**
 * @param {import('discord.js').ButtonInteraction} interaction
 */
async function handleApproveBtn(interaction) {
  await interaction.showModal(
    new ModalBuilder({
      title: "Aprobar sugerencia",
      customId: "SUGGEST_APPROVE_MODAL",
      components: [
        new ActionRowBuilder().addComponents([
          new TextInputBuilder()
            .setCustomId("reason")
            .setLabel("reason")
            .setStyle(TextInputStyle.Paragraph)
            .setMinLength(4),
        ]),
      ],
    })
  );
}

/**
 * @param {import('discord.js').ModalSubmitInteraction} modal
 */
async function handleApproveModal(modal) {
  await modal.deferReply({ ephemeral: true });
  const reason = modal.fields.getTextInputValue("reason");
  const response = await approveSuggestion(modal.member, modal.channel, modal.message.id, reason);
  await modal.followUp(response);
}

/**
 * @param {import('discord.js').ButtonInteraction} interaction
 */
async function handleRejectBtn(interaction) {
  await interaction.showModal(
    new ModalBuilder({
      title: "Rechazar sugerencia",
      customId: "SUGGEST_REJECT_MODAL",
      components: [
        new ActionRowBuilder().addComponents([
          new TextInputBuilder()
            .setCustomId("reason")
            .setLabel("reason")
            .setStyle(TextInputStyle.Paragraph)
            .setMinLength(4),
        ]),
      ],
    })
  );
}

/**
 * @param {import('discord.js').ModalSubmitInteraction} modal
 */
async function handleRejectModal(modal) {
  await modal.deferReply({ ephemeral: true });
  const reason = modal.fields.getTextInputValue("reason");
  const response = await rejectSuggestion(modal.member, modal.channel, modal.message.id, reason);
  await modal.followUp(response);
}

/**
 * @param {import('discord.js').ButtonInteraction} interaction
 */
async function handleDeleteBtn(interaction) {
  await interaction.showModal(
    new ModalBuilder({
      title: "Borrar sugerencia",
      customId: "SUGGEST_DELETE_MODAL",
      components: [
        new ActionRowBuilder().addComponents([
          new TextInputBuilder()
            .setCustomId("reason")
            .setLabel("reason")
            .setStyle(TextInputStyle.Paragraph)
            .setMinLength(4),
        ]),
      ],
    })
  );
}

/**
 * @param {import('discord.js').ModalSubmitInteraction} modal
 */
async function handleDeleteModal(modal) {
  await modal.deferReply({ ephemeral: true });
  const reason = modal.fields.getTextInputValue("reason");
  const response = await deleteSuggestion(modal.member, modal.channel, modal.message.id, reason);
  await modal.followUp({ content: response, ephemeral: true });
}

module.exports = {
  handleApproveBtn,
  handleApproveModal,
  handleRejectBtn,
  handleRejectModal,
  handleDeleteBtn,
  handleDeleteModal,
  approveSuggestion,
  rejectSuggestion,
  deleteSuggestion,
};
