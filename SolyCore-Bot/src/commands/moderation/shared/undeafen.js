const { unDeafenTarget } = require("@helpers/ModUtils");

module.exports = async ({ member }, target, reason) => {
  const response = await unDeafenTarget(member, target, reason);
  if (typeof response === "boolean") {
    return `${target.user.tag} ya no es ensordecido en este servidor`;
  }
  if (response === "MEMBER_PERM") {
    return `Usted no tiene permiso para ensordecer ${target.user.tag}`;
  }
  if (response === "BOT_PERM") {
    return `No tengo permiso para ensordecer ${target.user.tag}`;
  }
  if (response === "NO_VOICE") {
    return `${target.user.tag} no está en ningún canal de voz`;
  }
  if (response === "NOT_DEAFENED") {
    return `${target.user.tag} no está ensordecido`;
  }
  return `Falló al quitar el ensordecer ${target.user.tag}`;
};
