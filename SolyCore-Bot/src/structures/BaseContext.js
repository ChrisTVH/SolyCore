/**
 * @typedef {Object} ContextData
 * @property {string} name - El nombre del comando (debe estar en minúsculas)
 * @property {string} description - Breve descripción del comando
 * @property {import('discord.js').ApplicationCommandType} type - El tipo de comando de la aplicación
 * @property {boolean} [enabled] - Si el comando slash está activado o no
 * @property {boolean} [ephemeral] - Si la respuesta debe ser efímera
 * @property {boolean} [defaultPermission] - Si se debe habilitar el permiso por defecto
 * @property {import('discord.js').PermissionResolvable[]} [userPermissions] - Permisos requeridos por el usuario para utilizar el comando.
 * @property {number} [cooldown] - Enfriamiento del comando en segundos
 * @property {function(import('discord.js').ContextMenuCommandInteraction)} run - La llamada de retorno que se ejecutará cuando se invoque el contexto
 */

/**
 * @type {ContextData} data - La información de contexto
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
