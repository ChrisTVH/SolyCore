const { purgeMessages } = require("@helpers/ModUtils");

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "purgetoken",
  description: "elimina la cantidad especificada de mensajes que contienen el token",
  category: "MODERATION",
  userPermissions: ["ManageMessages"],
  botPermissions: ["ManageMessages", "ReadMessageHistory"],
  command: {
    enabled: true,
    usage: "<token> [cantidad]",
    minArgsCount: 1,
  },

  async messageRun(message, args) {
    const token = args[0];
    const amount = (args.length > 1 && args[1]) || 99;

    if (amount) {
      if (isNaN(amount)) return message.safeReply("Sólo se admiten números");
      if (parseInt(amount) > 99) return message.safeReply("La cantidad máxima de mensajes que puedo borrar es 99");
    }

    const { channel } = message;
    const response = await purgeMessages(message.member, message.channel, "TOKEN", amount, token);

    if (typeof response === "number") {
      return channel.safeSend(`${response} mensajes eliminados con éxito`, 5);
    } else if (response === "BOT_PERM") {
      return message.safeReply("No tengo permisos para `Leer el historial de mensajes` y `Gestión de mensajes` para borrar mensajes", 5);
    } else if (response === "MEMBER_PERM") {
      return message.safeReply("No tienes permiso de `Lectura del historial de mensajes` y `Gestión de mensajes` para borrar mensajes", 5);
    } else if (response === "NO_MESSAGES") {
      return channel.safeSend("No se han encontrado mensajes que se puedan limpiar", 5);
    } else {
      return message.safeReply(`Se ha producido un error. Error al borrar mensajes`);
    }
  },
};
