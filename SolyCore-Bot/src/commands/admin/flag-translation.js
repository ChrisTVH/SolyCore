const { ApplicationCommandOptionType } = require("discord.js");

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "flagtranslation",
  description: "configurar la traducci�n de banderas en el servidor",
  category: "ADMIN",
  userPermissions: ["ManageGuild"],
  command: {
    enabled: true,
    aliases: ["flagtr"],
    minArgsCount: 1,
    usage: "<on|off>",
  },
  slashCommand: {
    enabled: true,
    ephemeral: true,
    options: [
      {
        name: "status",
        description: "activado o desactivado",
        required: true,
        type: ApplicationCommandOptionType.String,
        choices: [
          {
            name: "ON",
            value: "ON",
          },
          {
            name: "OFF",
            value: "OFF",
          },
        ],
      },
    ],
  },

  async messageRun(message, args, data) {
    const status = args[0].toLowerCase();
    if (!["on", "off"].includes(status)) return message.safeReply("Estado no v�lido. El valor debe ser `on/off`");

    const response = await setFlagTranslation(status, data.settings);
    await message.safeReply(response);
  },

  async interactionRun(interaction, data) {
    const response = await setFlagTranslation(interaction.options.getString("status"), data.settings);
    await interaction.followUp(response);
  },
};

async function setFlagTranslation(input, settings) {
  const status = input.toLowerCase() === "on" ? true : false;

  settings.flag_translation.enabled = status;
  await settings.save();

  return `�Configuraci�n guardada! La traducci�n de la bandera es ahora ${status ? "habilitado" : "deshabilitado"}`;
}
