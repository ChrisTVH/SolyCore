/**
 * @typedef {Object} ContextData
 * @property {string} name - El nombre del comando (debe estar en min�sculas)
 * @property {string} description - Breve descripci�n del comando
 * @property {import('discord.js').ApplicationCommandType} type - El tipo de comando de la aplicaci�n
 * @property {boolean} [enabled] - Si el comando slash est� activado o no
 * @property {boolean} [ephemeral] - Si la respuesta debe ser ef�mera
 * @property {boolean} [defaultPermission] - Si se debe habilitar el permiso por defecto
 * @property {import('discord.js').PermissionResolvable[]} [userPermissions] - Permisos requeridos por el usuario para utilizar el comando.
 * @property {number} [cooldown] - Enfriamiento del comando en segundos
 * @property {function(import('discord.js').ContextMenuCommandInteraction)} run - La llamada de retorno que se ejecutar� cuando se invoque el contexto
 */

/**
 * @type {ContextData} data - La informaci�n de contexto
 */
module.exports = {
  name: "",
  description: "",
  type: "",
  enabled: false,
  ephemeral: false,
  options: true,
  userPermissions: [],
  cooldown: 0,
};
