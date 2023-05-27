const { vUnmuteTarget } = require("@helpers/ModUtils");

module.exports = async ({ member }, target, reason) => {
  const response = await vUnmuteTarget(member, target, reason);
  if (typeof response === "boolean") {
    return `La voz de ${target.user.tag} no está silenciada en este servidor`;
  }
  if (response === "MEMBER_PERM") {
    return `Usted no tiene permiso para anular el silencio de voz de ${target.user.tag}`;
  }
  if (response === "BOT_PERM") {
    return `No tengo permiso para anular el silencio de voz de ${target.user.tag}`;
  }
  if (response === "NO_VOICE") {
    return `${target.user.tag} no está en ningún canal de voz`;
  }
  if (response === "NOT_MUTED") {
    return `${target.user.tag} no se silencia su voz`;
  }
  return `Fallo al anular el silencio de voz de ${target.user.tag}`;
};
