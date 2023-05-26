/**
 * @typedef {Object} Validation
 * @property {function} callback - La condici�n para validar
 * @property {string} message - El mensaje que se mostrar� si no se cumple la condici�n de devoluci�n de llamada
 */

/**
 * @typedef {Object} SubCommand
 * @property {string} trigger - invocar el subcomando
 * @property {string} description - descripci�n del subcomando
 */

/**
 * @typedef {"ADMIN"|"ANIME"|"AUTOMOD"|"ECONOMY"|"FUN"|"IMAGE"|"INFORMATION"|"INVITE"|"MODERATION"|"ERELA_JS"|"NONE"|"OWNER"|"SOCIAL"|"SUGGESTION"|"TICKET"|"UTILITY"} CommandCategory
 */

/**
 * @typedef {Object} InteractionInfo
 * @property {boolean} enabled - Si el comando slash est� activado o no
 * @property {boolean} ephemeral - Si la respuesta deber�a ser ef�mera
 * @property {import('discord.js').ApplicationCommandOptionData[]} options - opciones de comando
 */

/**
 * @typedef {Object} CommandInfo
 * @property {boolean} enabled - Si el comando est� activado o no
 * @property {string[]} [aliases] - Nombres alternativos para el comando (todos deben estar en min�sculas)
 * @property {string} [usage=""] - La cadena de formato de uso del comando
 * @property {number} [minArgsCount=0] - N�mero m�nimo de argumentos que toma el comando (por defecto es 0)
 * @property {SubCommand[]} [subcommands=[]] - Lista de subcomandos
 */

/**
 * @typedef {Object} CommandData
 * @property {string} name - El nombre del comando (debe estar en min�sculas)
 * @property {string} description - Breve descripci�n del comando
 * @property {number} cooldown - Enfriamiento del comando en segundos
 * @property {CommandCategory} category - La categor�a a la que pertenece este comando
 * @property {import('discord.js').PermissionResolvable[]} [botPermissions] - Permisos requeridos por el cliente para utilizar el comando.
 * @property {import('discord.js').PermissionResolvable[]} [userPermissions] - Permisos requeridos por el usuario para utilizar el comando
 * @property {Validation[]} [validations] - Lista de validaciones que deben realizarse antes de ejecutar el comando
 * @property {CommandInfo} command - Breve descripci�n del comando
 * @property {InteractionInfo} slashCommand - Breve descripci�n del comando
 * @property {function(import('discord.js').Message, string[], object)} messageRun - La llamada de retorno que se ejecutar� cuando se invoque el comando
 * @property {function(import('discord.js').ChatInputCommandInteraction, object)} interactionRun - La llamada de retorno que se ejecutar� cuando se invoque la interacci�n
 */

/**
 * Placeholder para los datos del comando
 * @type {CommandData}
 */
module.exports = {
  name: "",
  description: "",
  cooldown: 0,
  isPremium: false,
  category: "NONE",
  botPermissions: [],
  userPermissions: [],
  validations: [],
  command: {
    enabled: true,
    aliases: [],
    usage: "",
    minArgsCount: 0,
    subcommands: [],
  },
  slashCommand: {
    enabled: true,
    ephemeral: false,
    options: [],
  },
  messageRun: (message, args, data) => {},
  interactionRun: (interaction, data) => {},
};
