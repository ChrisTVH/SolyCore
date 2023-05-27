const {
  ApplicationCommandOptionType,
  ChannelType,
  ModalBuilder,
  ActionRowBuilder,
  TextInputBuilder,
  TextInputStyle,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  EmbedBuilder,
} = require("discord.js");
const { isValidColor, isHex } = require("@helpers/Utils");

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "embed",
  description: "enviar mensaje en formato embed",
  category: "ADMIN",
  userPermissions: ["ManageMessages"],
  command: {
    enabled: true,
    usage: "<#canal>",
    minArgsCount: 1,
    aliases: ["say"],
  },
  slashCommand: {
    enabled: true,
    ephemeral: true,
    options: [
      {
        name: "channel",
        description: "canal para enviar el embed",
        type: ApplicationCommandOptionType.Channel,
        channelTypes: [ChannelType.GuildText],
        required: true,
      },
    ],
  },

  async messageRun(message, args) {
    const channel = message.mentions.channels.first() || message.guild.channels.cache.get(args[0]);
      if (!channel) return message.reply("Indique un canal válido");
      if (channel.type !== ChannelType.GuildText) return message.reply("Indique un canal válido");
    if (!channel.canSendEmbeds()) {
      return message.reply("No tengo permiso para enviar embeds en ese canal");
    }
      message.reply(`La configuración del Embed se inició en ${channel}`);
    await embedSetup(channel, message.member);
  },

  async interactionRun(interaction) {
    const channel = interaction.options.getChannel("channel");
    if (!channel.canSendEmbeds()) {
      return interaction.followUp("No tengo permiso para enviar embeds en ese canal");
    }
    interaction.followUp(`La configuración del Embed se inició en ${channel}`);
    await embedSetup(channel, interaction.member);
  },
};

/**
 * @param {import('discord.js').GuildTextBasedChannel} channel
 * @param {import('discord.js').GuildMember} member
 */
async function embedSetup(channel, member) {
  const sentMsg = await channel.send({
    content: "Haga clic en el botón de abajo para empezar",
    components: [
      new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("EMBED_ADD").setLabel("Crear un Embed").setStyle(ButtonStyle.Primary)
      ),
    ],
  });

  const btnInteraction = await channel
    .awaitMessageComponent({
      componentType: ComponentType.Button,
      filter: (i) => i.customId === "EMBED_ADD" && i.member.id === member.id && i.message.id === sentMsg.id,
      time: 20000,
    })
    .catch((ex) => {});

  if (!btnInteraction) return sentMsg.edit({ content: "No se ha recibido ninguna respuesta", components: [] });

  await btnInteraction.showModal(
    new ModalBuilder({
      customId: "EMBED_MODAL",
      title: "Generador de Embeds",
      components: [
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId("title")
            .setLabel("Titulo del embed")
            .setStyle(TextInputStyle.Short)
            .setRequired(false)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId("author")
            .setLabel("Autor del embed")
            .setStyle(TextInputStyle.Short)
            .setRequired(false)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId("description")
            .setLabel("Descripción del embed")
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(false)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId("color")
            .setLabel("Color del embed")
            .setStyle(TextInputStyle.Short)
            .setRequired(false)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId("footer")
            .setLabel("Pie de pagina del embed")
            .setStyle(TextInputStyle.Short)
            .setRequired(false)
        ),
      ],
    })
  );

  // recibir entrada modal
  const modal = await btnInteraction
    .awaitModalSubmit({
      time: 1 * 60 * 1000,
      filter: (m) => m.customId === "EMBED_MODAL" && m.member.id === member.id && m.message.id === sentMsg.id,
    })
    .catch((ex) => {});

    if (!modal) return sentMsg.edit({ content: "No se recibe respuesta, se cancela la configuración", components: [] });

  modal.reply({ content: "Embed enviado", ephemeral: true }).catch((ex) => {});

  const title = modal.fields.getTextInputValue("title");
  const author = modal.fields.getTextInputValue("author");
  const description = modal.fields.getTextInputValue("description");
  const footer = modal.fields.getTextInputValue("footer");
  const color = modal.fields.getTextInputValue("color");

  if (!title && !author && !description && !footer)
    return sentMsg.edit({ content: "No se puede enviar un embed vacío.", components: [] });

  const embed = new EmbedBuilder();
  if (title) embed.setTitle(title);
  if (author) embed.setAuthor({ name: author });
  if (description) embed.setDescription(description);
  if (footer) embed.setFooter({ text: footer });
  if ((color && isValidColor(color)) || (color && isHex(color))) embed.setColor(color);

  // botón añadir/eliminar campo
  const buttonRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("EMBED_FIELD_ADD").setLabel("Añadir campo").setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId("EMBED_FIELD_REM").setLabel("Borrar campo").setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId("EMBED_FIELD_DONE").setLabel("Hecho").setStyle(ButtonStyle.Primary)
  );

  await sentMsg.edit({
    content: "Por favor, añada campos utilizando los botones de abajo. Haga clic en Hecho cuando haya terminado.",
    embeds: [embed],
    components: [buttonRow],
  });

  const collector = channel.createMessageComponentCollector({
    componentType: ComponentType.Button,
    filter: (i) => i.member.id === member.id,
    message: sentMsg,
    idle: 5 * 60 * 1000,
  });

  collector.on("collect", async (interaction) => {
    if (interaction.customId === "EMBED_FIELD_ADD") {
      await interaction.showModal(
        new ModalBuilder({
          customId: "EMBED_ADD_FIELD_MODAL",
          title: "Añadir campo",
          components: [
            new ActionRowBuilder().addComponents(
              new TextInputBuilder()
                .setCustomId("name")
                .setLabel("Nombre del campo")
                .setStyle(TextInputStyle.Short)
                .setRequired(true)
            ),
            new ActionRowBuilder().addComponents(
              new TextInputBuilder()
                .setCustomId("value")
                .setLabel("Valor del campo")
                .setStyle(TextInputStyle.Paragraph)
                .setRequired(true)
            ),
            new ActionRowBuilder().addComponents(
              new TextInputBuilder()
                .setCustomId("inline")
                .setLabel("¿En la línea? (true/false)")
                .setStyle(TextInputStyle.Short)
                .setValue("true")
                .setRequired(true)
            ),
          ],
        })
      );

      // recibir entrada modal
      const modal = await interaction
        .awaitModalSubmit({
          time: 5 * 60 * 1000,
          filter: (m) => m.customId === "EMBED_ADD_FIELD_MODAL" && m.member.id === member.id,
        })
        .catch((ex) => {});

      if (!modal) return sentMsg.edit({ components: [] });

      modal.reply({ content: "Campo añadido", ephemeral: true }).catch((ex) => {});

      const name = modal.fields.getTextInputValue("name");
      const value = modal.fields.getTextInputValue("value");
      let inline = modal.fields.getTextInputValue("inline").toLowerCase();

      if (inline === "true") inline = true;
      else if (inline === "false") inline = false;
      else inline = true; // por defecto verdadero

      const fields = embed.data.fields || [];
      fields.push({ name, value, inline });
      embed.setFields(fields);
    }

    // remove field
    else if (interaction.customId === "EMBED_FIELD_REM") {
      const fields = embed.data.fields;
      if (fields) {
        fields.pop();
        embed.setFields(fields);
        interaction.reply({ content: "Campo borrado", ephemeral: true });
      } else {
        interaction.reply({ content: "No hay campos para borrar", ephemeral: true });
      }
    }

    // done
    else if (interaction.customId === "EMBED_FIELD_DONE") {
      return collector.stop();
    }

    await sentMsg.edit({ embeds: [embed] });
  });

  collector.on("end", async (_collected, _reason) => {
    await sentMsg.edit({ content: "", components: [] });
  });
}
