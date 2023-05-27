const { vMuteTarget } = require("@helpers/ModUtils");

module.exports = async ({ member }, target, reason) => {
  const response = await vMuteTarget(member, target, reason);
  if (typeof response === "boolean") {
    return `${target.user.tag} su voz está silenciada en este servidor`;
  }
  if (response === "MEMBER_PERM") {
    return `Usted no tiene permiso para silenciar la voz de ${target.user.tag}`;
  }
  if (response === "BOT_PERM") {
    return `No tengo permiso para silenciar la voz de ${target.user.tag}`;
  }
  if (response === "NO_VOICE") {
    return `${target.user.tag} no está en ningún canal de voz`;
  }
  if (response === "ALREADY_MUTED") {
    return `${target.user.tag} ya está silenciado`;
  }
  return `Fallo al silenciar la voz de ${target.user.tag}`;
};
