const { getSettings } = require("@schemas/Guild");
const { commandHandler, contextHandler, statsHandler, suggestionHandler, ticketHandler } = require("@src/handlers");
const { InteractionType } = require("discord.js");

/**
 * @param {import('@src/structures').BotClient} client
 * @param {import('discord.js').BaseInteraction} interaction
 */
module.exports = async (client, interaction) => {
  if (!interaction.guild) {
    return interaction
      .reply({ content: "El comando sólo se puede ejecutar en un servidor de discordia", ephemeral: true })
      .catch(() => {});
  }

  // Comandos Slash
  if (interaction.isChatInputCommand()) {
    await commandHandler.handleSlashCommand(interaction);
  }

  // Menú contextual
  else if (interaction.isContextMenuCommand()) {
    const context = client.contextMenus.get(interaction.commandName);
    if (context) await contextHandler.handleContext(interaction, context);
    else return interaction.reply({ content: "Se ha producido un error", ephemeral: true }).catch(() => {});
  }

  // Botones
  else if (interaction.isButton()) {
    switch (interaction.customId) {
      case "TICKET_CREATE":
        return ticketHandler.handleTicketOpen(interaction);

      case "TICKET_CLOSE":
        return ticketHandler.handleTicketClose(interaction);

      case "SUGGEST_APPROVE":
        return suggestionHandler.handleApproveBtn(interaction);

      case "SUGGEST_REJECT":
        return suggestionHandler.handleRejectBtn(interaction);

      case "SUGGEST_DELETE":
        return suggestionHandler.handleDeleteBtn(interaction);
    }
  }

  // Modales
  else if (interaction.type === InteractionType.ModalSubmit) {
    switch (interaction.customId) {
      case "SUGGEST_APPROVE_MODAL":
        return suggestionHandler.handleApproveModal(interaction);

      case "SUGGEST_REJECT_MODAL":
        return suggestionHandler.handleRejectModal(interaction);

      case "SUGGEST_DELETE_MODAL":
        return suggestionHandler.handleDeleteModal(interaction);
    }
  }

  const settings = await getSettings(interaction.guild);

  // seguimiento de estadisticas
  if (settings.stats.enabled) statsHandler.trackInteractionStats(interaction).catch(() => {});
};
