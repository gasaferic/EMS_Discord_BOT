const Discord = require('discord.js');
const events = require('events');
// const LangManager = require('./LangManager');
const Utils = require('../Utils');

class BadgeGuild {
  constructor(data) {
    this.guildId = data.guildId;
    this.client = data.client;
    this.badgeGuildSettings = data.badgeGuildSettings;
    this.mySQLManager = data.mySQLManager;
    this.utils = new Utils();

    this.targetRoles = this.badgeGuildSettings.getValue("targetRoles");

    this.eventEmitter = new events.EventEmitter();
    this.eventEmitter.on('updateGuildSettingsRoles', (roles) => {
      if (roles) { this.utils.updateEmbedFields(this.targetRoles, this.currentServer.roles.cache, this.embedMessage); }
      this.mySQLManager.updateGuildSettingsById(this.guildId, this.badgeGuildSettings.getJSONString());
    })
  }

  clientReady() {
    // console.log(this.currentServer.roles.cache.get("865568905686548490"), this.currentServer.roles.cache.get("865568888292507648"))

    this.currentServer = this.client.guilds.cache.get(this.guildId);

    this.targetRoles.sort((firstRole, secondRole) => this.currentServer.roles.cache.get(secondRole.id).rawPosition - this.currentServer.roles.cache.get(firstRole.id).rawPosition);

    this.commandManager = new CommandManager(this, config.commands);
    if ((this.badgeChannel = this.currentServer.channels.cache.get(this.badgeGuildSettings.getValue("badgeChannel"))) == undefined) { this.currentServer.channels.cache.get(this.currentServer.systemChannelID).send(this.utils.getEmbedMessage({ colorHex: "#c91212", title: "Impostazioni bot", description: "Non è stato impostato un canale per il timbro dei badge, impostalo eseguendo il comando !setbadgechannel nel canale interessato", timestamp: true })); return; }
    if ((this.logChannel = this.currentServer.channels.cache.get(this.badgeGuildSettings.getValue("logChannel"))) == undefined) { this.currentServer.channels.cache.get(this.currentServer.systemChannelID).send(this.utils.getEmbedMessage({ colorHex: "#c91212", title: "Impostazioni bot", description: "Non è stato impostato un canale per il log delle entrate/uscite in servizio, impostalo eseguendo il comando !setlogchannel nel canale interessato", timestamp: true })); return; }

    this.badgeChannel.messages.fetch({ limit: 100 }).then(messages => { messages.forEach(message => { if (message.author.id == this.client.user.id) { message.delete(); } }) })

    this.sendBadgeEmbed();

    console.log('Bot caricato nel server', this.guildId);
  }

  sendBadgeEmbed() {
    const embedTimbro = new Discord.MessageEmbed()
    .setColor('#1900ff')
    .setTitle('Timbro Badge')
    .setDescription('Ricordatevi di timbrare e stimbrare ogni volta che si entra o si esce dal servizio EMS. Il calcolo delle ore parte da un minimo di 1 ora.')
    .setThumbnail('https://media.discordapp.net/attachments/864090286119714836/864111861552381997/ems-image.png?width=801&height=547')
    .setTimestamp()
    .setFooter('Bot creato da ToxicVolpix#7169 & Gasaferic#8789. Contattateci in privato per qualsiasi problema riscontrato con il bot');

    this.targetRoles.forEach((ruolo) => {
      embedTimbro.addFields({ name: ruolo.name, value: "Nessuno in servizio" })
    })
    
    let dutyOnButton = new Discord.MessageButton()
    .setLabel("Timbra l'entrata in servizio")
    .setId("dutyOn")
    .setStyle("SUCCESS");

    let dutyOffButton = new this.discordButtons.MessageButton()
    .setLabel("Timbra l'uscita dal servizio")
    .setId("dutyOff")
    .setStyle("DESTRUCTIVE");

    let messageActionRow = new Discord.MessageActionRow();
    messageActionRow.addComponents(dutyOnButton, dutyOffButton);

    this.badgeChannel.roomChannel.send({ embeds: [embedTimbro], components: [messageActionRow] }).then(sentMessage => { this.embedMessage = sentMessage });
  }

  async handleButton(button) {
    var currentRole = this.utils.getRoleNameById(this.currentServer.roles.cache, this.utils.getHighestRole(this.targetRoles, button.clicker.member._roles.cache));
    var currentlyInServizio = this.utils.getField(this.targetRoles, this.utils.getHighestRole(this.targetRoles, button.clicker.member._roles), 'inServizio')
    if (currentlyInServizio === undefined) { await button.reply.send(this.utils.getEmbedMessage({ colorHex: "#fcc603", title: "Informazione Servizio", description: "Non fai parte dell'ospedale!", timestamp: true }), true); return; }
    var success;
    if (button.customId == "dutyOff") {
      if (!this.utils.isInServizio(currentlyInServizio, button.clicker.user.id)) { await button.reply.send(this.utils.getEmbedMessage({ colorHex: "#fcc603", title: "Informazione Servizio", description: "Non sei in servizio!", timestamp: true }), true); return; }
      this.utils.updateGradiInServizio(currentlyInServizio, { username: (button.clicker.member.nickname !== null ? button.clicker.member.nickname : button.clicker.user.username), id: button.clicker.user.id }, false, this.logChannel)
      await button.reply.send(this.utils.getEmbedMessage({ colorHex: "#c91212", title: "Informazione Servizio", description: "Sei uscito/a dal servizio", timestamp: true }), true)
      success = true;
    } else if (button.customId == "dutyOn") {
      if (this.utils.isInServizio(currentlyInServizio, button.clicker.user.id)) { await button.reply.send(this.utils.getEmbedMessage({ colorHex: "#fcc603", title: "Informazione Servizio", description: "Sei già in servizio!", timestamp: true }), true); return; }
      this.utils.updateGradiInServizio(currentlyInServizio, { username: (button.clicker.member.nickname !== null ? button.clicker.member.nickname : button.clicker.user.username), id: button.clicker.user.id }, true)
      await button.reply.send(this.utils.getEmbedMessage({ colorHex: "#32a852", title: "Informazione Servizio", description: "Sei entrato/a in servizio", timestamp: true }), true);
      success = true;
    }
    if (success) { this.utils.updateMessageField(button.message, currentRole, currentlyInServizio); }
  }

  guildMemberUpdate(oldMember, newMember) {
    // console.log('guildMemberUpdate', this.guildId)
    var currentlyInServizio = this.utils.getField(this.targetRoles, this.utils.getHighestRole(this.targetRoles, oldMember._roles), 'inServizio')
    if (currentlyInServizio === undefined || !this.utils.isInServizio(currentlyInServizio, oldMember.user.id)) { return; }
    if (oldMember._roles.length !== newMember._roles.length) {
      var oldRole = this.utils.getRoleNameById(this.currentServer.roles.cache, this.utils.getHighestRole(this.targetRoles, oldMember._roles));
      var currentRole = this.utils.getRoleNameById(this.currentServer.roles.cache, this.utils.getHighestRole(this.targetRoles, newMember._roles));
      if (oldRole !== currentRole) {
        this.utils.updateGradiInServizio(currentlyInServizio, { username: (oldMember.nickname !== null ? oldMember.nickname : oldMember.user.username), id: oldMember.user.id }, false, this.logChannel)
        this.utils.updateMessageField(this.embedMessage, oldRole, currentlyInServizio);
        if (currentRole !== undefined) {
          currentlyInServizio = this.utils.getField(this.targetRoles, this.utils.getHighestRole(this.targetRoles, newMember._roles), 'inServizio')
          // Se si vuole reinserire tra i lavoratori in servizio una volta cambiato il ruolo togliere il commento
          // this.utils.updateGradiInServizio(currentlyInServizio, { username: (newMember.nickname !== null ? newMember.nickname : newMember.user.username), id: newMember.user.id }, true)
          this.utils.updateMessageField(this.embedMessage, currentRole, currentlyInServizio);
        }
      }
    }
    if (oldMember.nickname !== newMember.nickname) {
      var currentRole = this.utils.getRoleNameById(this.currentServer.roles.cache, this.utils.getHighestRole(this.targetRoles, newMember._roles));
      this.utils.updateGradiInServizio(currentlyInServizio, { username: (oldMember.nickname !== null ? oldMember.nickname : oldMember.user.username), id: oldMember.user.id }, false, this.logChannel)
      // Se si vuole reinserire tra i lavoratori in servizio una volta cambiato il nickname togliere il commento
      // this.utils.updateGradiInServizio(currentlyInServizio, { username: (newMember.nickname !== null ? newMember.nickname : newMember.user.username), id: newMember.user.id }, true)
      this.utils.updateMessageField(this.embedMessage, currentRole, currentlyInServizio);
    }
  }

  onRoleUpdate(role) {
    if (role != undefined) { this.utils.getElemByFieldValue(this.targetRoles, "id", role.id).name = role.name; this.mySQLManager.updateGuildSettingsById(this.guildId, this.badgeGuildSettings.getJSONString()); }
    this.utils.updateEmbedFields(this.targetRoles, this.currentServer.roles.cache, this.embedMessage);
  }

}

module.exports = BadgeGuild