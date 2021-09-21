const Discord = require('discord.js');

const events = require('events');
// const LangManager = require('./LangManager');
const Utils = require('../Utils');

class BadgeGuild {
  constructor(data) {
    this.guildId = data.guildId;
    this.client = data.client;
    this.badgeGuildSettings = data.settings;
    this.dutyRoles = this.badgeGuildSettings.get("dutyRoles");
    this.mySQLManager = data.mySQLManager;
    this.utils = new Utils();

    this.clientReady()

    this.eventEmitter = new events.EventEmitter();
    this.eventEmitter.on('updateGuildSettingsRoles', (roles) => {
      this.badgeGuildSettings.set("dutyRoles", new Map([...this.dutyRoles.entries()].sort((firstRole, secondRole) => this.currentServer.roles.cache.get(secondRole[0]).rawPosition - this.currentServer.roles.cache.get(firstRole[0]).rawPosition)));
      this.dutyRoles = this.badgeGuildSettings.get("dutyRoles");
      if (roles) { this.utils.updateEmbedFields(this.badgeGuildSettings.get("dutyRoles"), this.embedMessage); }
      this.updateSettings();
    })
  }

  getBadgeGuildSettings() {
    return this.badgeGuildSettings;
  }

  updateSettings() {

    if ((this.badgeChannel = this.currentServer.channels.cache.get(this.badgeGuildSettings.get("badgeChannel"))) == undefined) { this.currentServer.channels.cache.get(this.currentServer.systemChannelID).send(this.utils.getEmbedMessage({ colorHex: "#c91212", title: "Impostazioni bot", description: "Non è stato impostato un canale per il timbro dei badge, impostalo eseguendo il comando !setbadgechannel nel canale interessato", timestamp: true })); return; }
    if ((this.logChannel = this.currentServer.channels.cache.get(this.badgeGuildSettings.get("logChannel"))) == undefined) { this.currentServer.channels.cache.get(this.currentServer.systemChannelID).send(this.utils.getEmbedMessage({ colorHex: "#c91212", title: "Impostazioni bot", description: "Non è stato impostato un canale per il log delle entrate/uscite in servizio, impostalo eseguendo il comando !setlogchannel nel canale interessato", timestamp: true })); return; }

    this.mySQLManager.updateGuildSettingsById(this.guildId, this.badgeGuildSettings.getJSONString());
  }

  async addRole(role, interaction) {
    if (this.dutyRoles.has(role.id)) { await interaction.reply({ embeds: [this.utils.getEmbedMessage({ colorHex: "#c91212", title: "Amministrazione", description: "Questo ruolo è già presente nel timbro!", timestamp: true })] , ephemeral: true }); return; }
    
    const mapRole = new Map();
    mapRole.set("name", role.name);
    mapRole.set("inServizio", []);
    this.dutyRoles.set(role.id, mapRole);

    this.eventEmitter.emit('updateGuildSettingsRoles', true);
    interaction.reply({ embeds: [this.utils.getEmbedMessage({ colorHex: "#32a852", title: "Amministrazione", description: "Aggiunto ruolo al timbro", timestamp: true })] , ephemeral: true });
  }

  async removeRole(role, interaction) {
    if (!this.dutyRoles.has(role.id)) { await interaction.reply({ embeds: [this.utils.getEmbedMessage({ colorHex: "#c91212", title: "Amministrazione", description: "Questo ruolo non è presente nel timbro!", timestamp: true })] , ephemeral: true }); return; }
    
    this.dutyRoles.delete(role.id);
    
    this.eventEmitter.emit('updateGuildSettingsRoles', true);
    interaction.reply({ embeds: [this.utils.getEmbedMessage({ colorHex: "#c91212", title: "Amministrazione", description: "Rimosso ruolo dal timbro", timestamp: true })] , ephemeral: true });
  }

  clientReady() {
    // console.log(this.currentServer.roles.cache.get("865568905686548490"), this.currentServer.roles.cache.get("865568888292507648"))

    this.currentServer = this.client.guilds.cache.get(this.guildId);
    
    this.badgeGuildSettings.set("dutyRoles", new Map([...this.dutyRoles.entries()].sort((firstRole, secondRole) => this.currentServer.roles.cache.get(secondRole[0]).rawPosition - this.currentServer.roles.cache.get(firstRole[0]).rawPosition)));
    this.dutyRoles = this.badgeGuildSettings.get("dutyRoles");

    if ((this.badgeChannel = this.currentServer.channels.cache.get(this.badgeGuildSettings.get("badgeChannel"))) == undefined) { this.currentServer.channels.cache.get(this.currentServer.systemChannelId).send(this.utils.getEmbedMessage({ colorHex: "#c91212", title: "Impostazioni bot", description: "Non è stato impostato un canale per il timbro dei badge, impostalo eseguendo il comando !setbadgechannel nel canale interessato", timestamp: true })); return; }
    if ((this.logChannel = this.currentServer.channels.cache.get(this.badgeGuildSettings.get("logChannel"))) == undefined) { this.currentServer.channels.cache.get(this.currentServer.systemChannelId).send(this.utils.getEmbedMessage({ colorHex: "#c91212", title: "Impostazioni bot", description: "Non è stato impostato un canale per il log delle entrate/uscite in servizio, impostalo eseguendo il comando !setlogchannel nel canale interessato", timestamp: true })); return; }

    this.badgeChannel.messages.fetch({ limit: 100 }).then(messages => { messages.forEach(message => { if (message.author.id == this.client.user.id) { message.delete(); } }) })

    this.sendBadgeEmbed();

    console.log('Bot caricato nel server', this.guildId);
  }

  sendBadgeEmbed() {
    const embedTimbro = new Discord.MessageEmbed()
    .setColor('#1900ff')
    .setTitle('Timbro Badge')
    .setDescription('Ricordatevi di timbrare e stimbrare ogni volta che si entra o si esce dal servizio EMS. Il calcolo delle ore parte da un minimo di 1 ora.')
    .setThumbnail('https://media.discordapp.net/attachments/889851912139182091/889877620081180713/unknown.png')
    .setTimestamp()
    .setFooter('Bot creato da Gasaferic#8789');

    for (var key of this.dutyRoles.keys()) {
      embedTimbro.addFields({ name: this.dutyRoles.get(key).get("name"), value: "Nessuno in servizio" })
    }
    
    let dutyOnButton = new Discord.MessageButton()
    .setCustomId('dutyOn')
    .setLabel('Timbra l\'entrata in servizio')
    .setStyle('SUCCESS');

    let dutyOffButton = new Discord.MessageButton()
    .setCustomId('dutyOff')
    .setLabel('Timbra l\'uscita dal servizio')
    .setStyle('DANGER');

    const messageActionRow = new Discord.MessageActionRow();
    messageActionRow.addComponents(dutyOnButton, dutyOffButton);

    this.badgeChannel.send({ embeds: [embedTimbro], components: [messageActionRow] }).then(sentMessage => { this.embedMessage = sentMessage });
  }

  async handleBadgeForceOff(interaction, userId) {
    var member = this.currentServer.members.cache.get(userId);
    var name = (member.nickname !== null ? member.nickname : member.user.username);
    
    var highestRoleId = this.utils.getHighestRole(this.dutyRoles, member._roles);

    if (!this.dutyRoles.has(highestRoleId)) { await interaction.reply({ embeds: [ this.utils.getEmbedMessage({ colorHex: "#fcc603", title: "Informazione Servizio", description: name + " non fa parte dell'ospedale!", timestamp: true, thumbnail: "https://tenor.com/view/bh187-austin-powers-mini-me-middle-finger-gif-19284915" }) ], ephemeral: true}); return; }
    
    var currentRole = this.dutyRoles.get(highestRoleId).get("name");
    var currentlyInServizio = this.dutyRoles.get(highestRoleId).get("inServizio");

    if (!this.utils.isInServizio(currentlyInServizio, member.user.id)) { await interaction.reply({ embeds: [ this.utils.getEmbedMessage({ colorHex: "#fcc603", title: "Informazione Servizio", description: "L'utente " + name + " non è in servizio!", timestamp: true }) ], ephemeral: true}); return; }
    
    this.utils.updateGradiInServizio(currentlyInServizio, { username: name, id: member.user.id }, false, this.logChannel)
    this.utils.updateMessageField(this.embedMessage, currentRole, currentlyInServizio);
    interaction.reply({ embeds: [this.utils.getEmbedMessage({ colorHex: "#32a852", title: "Informazione Servizio", description: "Utente " + name + " cacciato dal servizio", timestamp: true })], ephemeral: true });
  }

  async handleButton(button) {
    // console.log("Handling button for ", this.guildId, button);
    var highestRoleId = this.utils.getHighestRole(this.dutyRoles, button.member._roles);

    if (!this.dutyRoles.has(highestRoleId)) { await button.reply({ embeds: [ this.utils.getEmbedMessage({ colorHex: "#fcc603", title: "Informazione Servizio", description: "Non fai parte dell'ospedale!", timestamp: true, thumbnail: "https://tenor.com/view/bh187-austin-powers-mini-me-middle-finger-gif-19284915" }) ], ephemeral: true}); return; }
    
    var currentRole = this.dutyRoles.get(highestRoleId).get("name");
    var currentlyInServizio = this.dutyRoles.get(highestRoleId).get("inServizio");

    var success;
    if (button.customId == "dutyOff") {
      if (!this.utils.isInServizio(currentlyInServizio, button.member.user.id)) { await button.reply({ embeds: [ this.utils.getEmbedMessage({ colorHex: "#fcc603", title: "Informazione Servizio", description: "Non sei in servizio!", timestamp: true }) ], ephemeral: true}); return; }
      this.utils.updateGradiInServizio(currentlyInServizio, { username: (button.member.nickname !== null ? button.member.nickname : button.member.user.username), id: button.member.user.id }, false, this.logChannel)
      button.reply({ embeds: [this.utils.getEmbedMessage({ colorHex: "#c91212", title: "Informazione Servizio", description: "Sei uscito/a dal servizio", timestamp: true })], ephemeral: true });
      this.utils.log({action: "SERVIZIO_OFF", content: "[ID_" + button.member.user.id + "]>[ROLE_ID" + highestRoleId + "]"})
      success = true;
    } else if (button.customId == "dutyOn") {
      if (this.utils.isInServizio(currentlyInServizio, button.member.user.id)) { await button.reply({ embeds: [ this.utils.getEmbedMessage({ colorHex: "#fcc603", title: "Informazione Servizio", description: "Sei già in servizio!", timestamp: true }) ], ephemeral: true}); return; }
      this.utils.updateGradiInServizio(currentlyInServizio, { username: (button.member.nickname !== null ? button.member.nickname : button.member.user.username), id: button.member.user.id }, true)
      this.utils.log({action: "SERVIZIO_ON", content: "[ID_" + button.member.user.id + "]>[ROLE_ID" + highestRoleId + "]"})
      button.reply({ embeds: [this.utils.getEmbedMessage({ colorHex: "#32a852", title: "Informazione Servizio", description: "Sei entrato/a in servizio", timestamp: true })], ephemeral: true });
      success = true;
    }
    if (success) {
      this.embedMessage = button.message;
      this.utils.updateMessageField(button.message, currentRole, currentlyInServizio);
    }
  }

  handleGuildMemberUpdate(oldMember, newMember) {
    // console.log('guildMemberUpdate', this.guildId)

    var oldHighestRoleId = this.utils.getHighestRole(this.dutyRoles, oldMember._roles);

    if (!this.dutyRoles.get(oldHighestRoleId).has("inServizio") || this.dutyRoles.get(oldHighestRoleId).has("inServizio") && !this.utils.isInServizio(this.dutyRoles.get(oldHighestRoleId).get("inServizio"), oldMember.user.id)) { return; }

    var currentlyInServizio = this.dutyRoles.get(oldHighestRoleId).get("inServizio");
    var oldCurrentRole = this.dutyRoles.get(oldHighestRoleId).get("name");

    var newHighestRoleId = this.utils.getHighestRole(this.dutyRoles, newMember._roles);
    var newCurrentRole = this.dutyRoles.get(newHighestRoleId).get("name");

    if (oldMember._roles.length !== newMember._roles.length) {
      // console.log(oldRole, currentRole);
      if (oldCurrentRole !== newCurrentRole) {
        this.utils.updateGradiInServizio(currentlyInServizio, { username: (oldMember.nickname !== null ? oldMember.nickname : oldMember.user.username), id: oldMember.user.id }, false, this.logChannel)
        this.utils.updateMessageField(this.embedMessage, oldCurrentRole, currentlyInServizio);
        if (newCurrentRole !== undefined) {
	  // console.log("Non undefined");
          var newCurrentlyInServizio = this.dutyRoles.get(newHighestRoleId).get("inServizio");
	  // console.log(this.utils.getHighestRole(this.dutyRoles, newMember._roles), currentlyInServizio)
          // Se si vuole reinserire tra i lavoratori in servizio una volta cambiato il ruolo togliere il commento
          this.utils.updateGradiInServizio(newCurrentlyInServizio, { username: (newMember.nickname !== null ? newMember.nickname : newMember.user.username), id: newMember.user.id }, true)
          this.utils.updateMessageField(this.embedMessage, newCurrentRole, newCurrentlyInServizio);
        }
      }
    }
    if (oldMember.nickname !== newMember.nickname) {
      this.utils.updateGradiInServizio(currentlyInServizio, { username: (oldMember.nickname !== null ? oldMember.nickname : oldMember.user.username), id: oldMember.user.id }, false, this.logChannel)
      // Se si vuole reinserire tra i lavoratori in servizio una volta cambiato il nickname togliere il commento
      this.utils.updateGradiInServizio(currentlyInServizio, { username: (newMember.nickname !== null ? newMember.nickname : newMember.user.username), id: newMember.user.id }, true)
      this.utils.updateMessageField(this.embedMessage, newCurrentRole, currentlyInServizio);
    }
  }

  handleRoleUpdate(role) {
    if (role != undefined) { this.utils.getElemByFieldValue(this.dutyRoles, "id", role.id).name = role.name; this.mySQLManager.updateGuildSettingsById(this.guildId, this.badgeGuildSettings.getJSONString()); }
    this.utils.updateEmbedFields(this.dutyRoles, this.currentServer.roles.cache, this.embedMessage);
  }

}

module.exports = BadgeGuild
