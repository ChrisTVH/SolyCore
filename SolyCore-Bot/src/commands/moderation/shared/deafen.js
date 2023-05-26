const { deafenTarget } = require("@helpers/ModUtils");

module.exports = async ({ member }, target, reason) => {
  const response = await deafenTarget(member, target, reason);
  if (typeof response === "boolean") {
    return `${target.user.tag} se ensordece en este servidor`;
  }
  if (response === "MEMBER_PERM") {
    return `Usted no tiene permiso para ensordecer ${target.user.tag}`;
  }
  if (response === "BOT_PERM") {
    return `No tengo permiso para ensordecer ${target.user.tag}`;
  }
  if (response === "NO_VOICE") {
    return `${target.user.tag} no se encuentra en ning�n canal de voz`;
  }
  if (response === "ALREADY_DEAFENED") {
    return `${target.user.tag} ya est� ensordecido`;
  }
  return `Fall� al ensordecer ${target.user.tag}`;
};
