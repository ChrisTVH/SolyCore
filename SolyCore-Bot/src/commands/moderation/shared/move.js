const { moveTarget } = require("@helpers/ModUtils");

module.exports = async ({ member }, target, reason, channel) => {
  const response = await moveTarget(member, target, reason, channel);
  if (typeof response === "boolean") {
    return `${target.user.tag} se movido con éxito a: ${channel}`;
  }
  if (response === "MEMBER_PERM") {
    return `No tienes permiso para desconectar ${target.user.tag}`;
  }
  if (response === "BOT_PERM") {
      return `No tengo permiso para desconectar ${target.user.tag}`;
  }
  if (response === "NO_VOICE") {
    return `${target.user.tag} no está en ningún canal de voz`;
  }
  if (response === "TARGET_PERM") {
      return `${target.user.tag} no tiene permiso para unirse ${channel}`;
  }
  if (response === "ALREADY_IN_CHANNEL") {
    return `${target.user.tag} ya está conectado a ${channel}`;
  }
  return `Fallo al mover a ${target.user.tag} a ${channel}`;
};
