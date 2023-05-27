const { disconnectTarget } = require("@helpers/ModUtils");

module.exports = async ({ member }, target, reason) => {
  const response = await disconnectTarget(member, target, reason);
  if (typeof response === "boolean") {
    return `${target.user.tag} se desconecta del canal de voz`;
  }
  if (response === "MEMBER_PERM") {
    return `No tiene permiso para desconectar ${target.user.tag}`;
  }
  if (response === "BOT_PERM") {
    return `No tengo permiso para desconectar ${target.user.tag}`;
  }
  if (response === "NO_VOICE") {
    return `${target.user.tag} no está en ningún canal de voz`;
  }
  return `Error al desconectar ${target.user.tag}`;
};
