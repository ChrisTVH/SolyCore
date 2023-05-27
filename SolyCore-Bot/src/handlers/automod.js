const { EmbedBuilder } = require("discord.js");
const { containsLink, containsDiscordInvite } = require("@helpers/Utils");
const { getMember } = require("@schemas/Member");
const { addModAction } = require("@helpers/ModUtils");
const { AUTOMOD } = require("@root/config");
const { addAutoModLogToDb } = require("@schemas/AutomodLogs");

const antispamCache = new Map();
const MESSAGE_SPAM_THRESHOLD = 3000;

// Limpiar la caché
setInterval(() => {
  antispamCache.forEach((value, key) => {
    if (Date.now() - value.timestamp > MESSAGE_SPAM_THRESHOLD) {
      antispamCache.delete(key);
    }
  });
}, 10 * 60 * 1000);

/**
 * Compruebe si el mensaje necesita ser moderado y si tiene los permisos necesarios
 * @param {import('discord.js').Message} message
 */
const shouldModerate = (message) => {
  const { member, guild, channel } = message;

  // Ignorar si el bot no puede borrar los mensajes del canal
  if (!channel.permissionsFor(guild.members.me)?.has("ManageMessages")) return false;

  // Ignorar a los posibles moderadores del servidor
  if (member.permissions.has(["KickMembers", "BanMembers", "ManageGuild"])) return false;

  // Ignorar a los posibles moderadores del canal
  if (channel.permissionsFor(message.member).has("ManageMessages")) return false;
  return true;
};

/**
 * Realizar la moderación del mensaje
 * @param {import('discord.js').Message} message
 * @param {object} settings
 */
async function performAutomod(message, settings) {
  const { automod } = settings;

  if (automod.wh_channels.includes(message.channelId)) return;
  if (!automod.debug && !shouldModerate(message)) return;

  const { channel, member, guild, content, author, mentions } = message;
  const logChannel = settings.modlog_channel ? channel.guild.channels.cache.get(settings.modlog_channel) : null;

  let shouldDelete = false;
  let strikesTotal = 0;

  const fields = [];

  // Menciones maximas
  if (mentions.members.size > automod.max_mentions) {
    fields.push({ name: "Mentions", value: `${mentions.members.size}/${automod.max_mentions}`, inline: true });
    // strikesTotal += mentions.members.size - automod.max_mentions;
    strikesTotal += 1;
  }

  // Menciones maximas de roles
  if (mentions.roles.size > automod.max_role_mentions) {
    fields.push({ name: "RoleMentions", value: `${mentions.roles.size}/${automod.max_role_mentions}`, inline: true });
    // strikesTotal += mentions.roles.size - automod.max_role_mentions;
    strikesTotal += 1;
  }

  if (automod.anti_massmention > 0) {
    // revisa todas las menciones
    if (mentions.everyone) {
      fields.push({ name: "Todas las menciones", value: "✓", inline: true });
      strikesTotal += 1;
    }

    // comprobar el uso de User/role
    if (mentions.users.size + mentions.roles.size > automod.anti_massmention) {
      fields.push({
        name: "Menciones Usuario/Role",
        value: `${mentions.users.size + mentions.roles.size}/${automod.anti_massmention}`,
        inline: true,
      });
      // strikesTotal += mentions.users.size + mentions.roles.size - automod.anti_massmention;
      strikesTotal += 1;
    }
  }

  // Lineas maximas
  if (automod.max_lines > 0) {
    const count = content.split("\n").length;
    if (count > automod.max_lines) {
      fields.push({ name: "Nuevas lineas", value: `${count}/${automod.max_lines}`, inline: true });
      shouldDelete = true;
      // strikesTotal += Math.ceil((count - automod.max_lines) / automod.max_lines);
      strikesTotal += 1;
    }
  }

  // Antienganches
  if (automod.anti_attachments) {
    if (message.attachments.size > 0) {
      fields.push({ name: "Archivos adjuntos encontrados", value: "✓", inline: true });
      shouldDelete = true;
      strikesTotal += 1;
    }
  }

  // Anti links
  if (automod.anti_links) {
    if (containsLink(content)) {
      fields.push({ name: "Enlaces encontrados", value: "✓", inline: true });
      shouldDelete = true;
      strikesTotal += 1;
    }
  }

  // Anti Spam
  if (!automod.anti_links && automod.anti_spam) {
    if (containsLink(content)) {
      const key = author.id + "|" + message.guildId;
      if (antispamCache.has(key)) {
        let antispamInfo = antispamCache.get(key);
        if (
          antispamInfo.channelId !== message.channelId &&
          antispamInfo.content === content &&
          Date.now() - antispamInfo.timestamp < MESSAGE_SPAM_THRESHOLD
        ) {
          fields.push({ name: "Detección antispam", value: "✓", inline: true });
          shouldDelete = true;
          strikesTotal += 1;
        }
      } else {
        let antispamInfo = {
          channelId: message.channelId,
          content,
          timestamp: Date.now(),
        };
        antispamCache.set(key, antispamInfo);
      }
    }
  }

  // Anti Invitaciones
  if (!automod.anti_links && automod.anti_invites) {
    if (containsDiscordInvite(content)) {
      fields.push({ name: "Invitaciones de discord", value: "✓", inline: true });
      shouldDelete = true;
      strikesTotal += 1;
    }
  }

  // borrar mensaje si se puede borrar
  if (shouldDelete && message.deletable) {
    message
      .delete()
      .then(() => channel.safeSend("> ¡Auto-Moderación! Mensaje eliminado", 5))
      .catch(() => {});
  }

  if (strikesTotal > 0) {
    // añadir strikes a los miembros
    const memberDb = await getMember(guild.id, author.id);
    memberDb.strikes += strikesTotal;

    // registrar en db
    const reason = fields.map((field) => field.name + ": " + field.value).join("\n");
    addAutoModLogToDb(member, content, reason, strikesTotal).catch(() => {});

    // enviar registro automod
    if (logChannel) {
      const logEmbed = new EmbedBuilder()
        .setAuthor({ name: "Moderación automática" })
        .setThumbnail(author.displayAvatarURL())
        .setColor(AUTOMOD.LOG_EMBED)
        .addFields(fields)
        .setDescription(`**Canal:** ${channel.toString()}\n**Contenido:**\n${content}`)
        .setFooter({
          text: `Por ${author.tag} | ${author.id}`,
          iconURL: author.avatarURL(),
        });

      logChannel.safeSend({ embeds: [logEmbed] });
    }

    // Detalles de los strikes al DM
    const strikeEmbed = new EmbedBuilder()
      .setColor(AUTOMOD.DM_EMBED)
      .setThumbnail(guild.iconURL())
      .setAuthor({ name: "Moderación automática" })
      .addFields(fields)
      .setDescription(
        `Has recibido ${strikesTotal} strikes!\n\n` +
          `**Servidor:** ${guild.name}\n` +
          `**Strikes totales:** ${memberDb.strikes} fuera de ${automod.strikes}`
      );

    author.send({ embeds: [strikeEmbed] }).catch((ex) => {});

    // comprobar si se han recibido los strikes máximos
    if (memberDb.strikes >= automod.strikes) {
      // Restablecer los strikes
      memberDb.strikes = 0;

      // Añadir acción de moderación
      await addModAction(guild.members.me, member, "Automod: Máximo de strikes recibidos", automod.action).catch(
        () => {}
      );
    }

    await memberDb.save();
  }
}

module.exports = {
  performAutomod,
};
