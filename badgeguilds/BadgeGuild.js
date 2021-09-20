const Discord = require('discord.js');

const events = require('events');
// const LangManager = require('./LangManager');
const Utils = require('../Utils');

class BadgeGuild {
  constructor(data) {
    this.guildId = data.guildId;
    this.client = data.client;
    this.badgeGuildSettings = data.settings;
    this.mySQLManager = data.mySQLManager;
    this.utils = new Utils();

    this.dutyRoles = this.badgeGuildSettings.getValue("dutyRoles");

    this.clientReady()

    this.eventEmitter = new events.EventEmitter();
    this.eventEmitter.on('updateGuildSettingsRoles', (roles) => {
      if (roles) { this.utils.updateEmbedFields(this.dutyRoles, this.currentServer.roles.cache, this.embedMessage); }
      this.updateSettings();
    })
  }

  getBadgeGuildSettings() {
    return this.badgeGuildSettings;
  }

  updateSettings() {

    if ((this.badgeChannel = this.currentServer.channels.cache.get(this.badgeGuildSettings.getValue("badgeChannel"))) == undefined) { this.currentServer.channels.cache.get(this.currentServer.systemChannelID).send(this.utils.getEmbedMessage({ colorHex: "#c91212", title: "Impostazioni bot", description: "Non è stato impostato un canale per il timbro dei badge, impostalo eseguendo il comando !setbadgechannel nel canale interessato", timestamp: true })); return; }
    if ((this.logChannel = this.currentServer.channels.cache.get(this.badgeGuildSettings.getValue("logChannel"))) == undefined) { this.currentServer.channels.cache.get(this.currentServer.systemChannelID).send(this.utils.getEmbedMessage({ colorHex: "#c91212", title: "Impostazioni bot", description: "Non è stato impostato un canale per il log delle entrate/uscite in servizio, impostalo eseguendo il comando !setlogchannel nel canale interessato", timestamp: true })); return; }

    this.mySQLManager.updateGuildSettingsById(this.guildId, this.badgeGuildSettings.getJSONString());
  }

  async addRole(role, interaction) {
    console.log("adding role")
    if (this.utils.getElemByFieldValue(this.dutyRoles, "id", role.id) != undefined) { await interaction.reply({ embeds: [this.utils.getEmbedMessage({ colorHex: "#c91212", title: "Amministrazione", description: "Questo ruolo è già presente nel timbro!", timestamp: true })] , ephemeral: true }); return; }
    this.dutyRoles.push({ id: role.id, name: role.name, inServizio: [] });
    this.eventEmitter.emit('updateGuildSettingsRoles', true);
    interaction.reply({ embeds: [this.utils.getEmbedMessage({ colorHex: "#32a852", title: "Amministrazione", description: "Aggiunto ruolo al timbro", timestamp: true })] , ephemeral: true });
  }

  async removeRole(role, interaction) {
    console.log("removing role", this.utils.getElemByFieldValue(this.dutyRoles, "id", role.id))
    if (this.utils.getElemByFieldValue(this.dutyRoles, "id", role.id) == undefined) { await interaction.reply({ embeds: [this.utils.getEmbedMessage({ colorHex: "#c91212", title: "Amministrazione", description: "Questo ruolo non è presente nel timbro!", timestamp: true })] , ephemeral: true }); return; }
    this.dutyRoles.splice(this.utils.getElemByFieldValue(this.dutyRoles, "id", role.id), 1);
    this.eventEmitter.emit('updateGuildSettingsRoles', true);
    interaction.reply({ embeds: [this.utils.getEmbedMessage({ colorHex: "#c91212", title: "Amministrazione", description: "Rimosso ruolo dal timbro", timestamp: true })] , ephemeral: true });
  }

  clientReady() {
    // console.log(this.currentServer.roles.cache.get("865568905686548490"), this.currentServer.roles.cache.get("865568888292507648"))

    this.currentServer = this.client.guilds.cache.get(this.guildId);

    this.dutyRoles.sort((firstRole, secondRole) => this.currentServer.roles.cache.get(secondRole.id).rawPosition - this.currentServer.roles.cache.get(firstRole.id).rawPosition);

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

    this.dutyRoles.forEach((ruolo) => {
      embedTimbro.addFields({ name: ruolo.name, value: "Nessuno in servizio" })
    })
    
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

  async handleButton(button) {
    // console.log("Handling button for ", this.guildId, button);
    var currentRole = this.utils.getRoleNameById(this.currentServer.roles.cache, this.utils.getHighestRole(this.dutyRoles, button.member._roles));
    var currentlyInServizio = this.utils.getField(this.dutyRoles, this.utils.getHighestRole(this.dutyRoles, button.member._roles), 'inServizio')
    if (currentlyInServizio === undefined) { await button.reply({ embeds: [ this.utils.getEmbedMessage({ colorHex: "#fcc603", title: "Informazione Servizio", description: "Non fai parte dell'ospedale!", timestamp: true, thumbnail: "https://tenor.com/view/bh187-austin-powers-mini-me-middle-finger-gif-19284915" }) ], ephemeral: true}); return; }
    var success;
    if (button.customId == "dutyOff") {
      if (!this.utils.isInServizio(currentlyInServizio, button.member.user.id)) { await button.reply({ embeds: [ this.utils.getEmbedMessage({ colorHex: "#fcc603", title: "Informazione Servizio", description: "Non sei in servizio!", timestamp: true }) ], ephemeral: true}); return; }
      this.utils.updateGradiInServizio(currentlyInServizio, { username: (button.member.nickname !== null ? button.member.nickname : button.member.user.username), id: button.member.user.id }, false, this.logChannel)
      button.reply({ embeds: [this.utils.getEmbedMessage({ colorHex: "#c91212", title: "Informazione Servizio", description: "Sei uscito/a dal servizio", timestamp: true })], ephemeral: true });
      success = true;
    } else if (button.customId == "dutyOn") {
      if (this.utils.isInServizio(currentlyInServizio, button.member.user.id)) { await button.reply({ embeds: [ this.utils.getEmbedMessage({ colorHex: "#fcc603", title: "Informazione Servizio", description: "Sei già in servizio!", timestamp: true }) ], ephemeral: true}); return; }
      this.utils.updateGradiInServizio(currentlyInServizio, { username: (button.member.nickname !== null ? button.member.nickname : button.member.user.username), id: button.member.user.id }, true)
      button.reply({ embeds: [this.utils.getEmbedMessage({ colorHex: "#32a852", title: "Informazione Servizio", description: "Sei entrato/a in servizio", timestamp: true })], ephemeral: true });
      success = true;
    }
    if (success) { this.utils.updateMessageField(button.message, currentRole, currentlyInServizio); }
  }

  guildMemberUpdate(oldMember, newMember) {
    // console.log('guildMemberUpdate', this.guildId)
    var currentlyInServizio = this.utils.getField(this.dutyRoles, this.utils.getHighestRole(this.dutyRoles, oldMember._roles), 'inServizio')
    if (currentlyInServizio === undefined || !this.utils.isInServizio(currentlyInServizio, oldMember.user.id)) { return; }
    if (oldMember._roles.length !== newMember._roles.length) {
      var oldRole = this.utils.getRoleNameById(this.currentServer.roles.cache, this.utils.getHighestRole(this.dutyRoles, oldMember._roles));
      var currentRole = this.utils.getRoleNameById(this.currentServer.roles.cache, this.utils.getHighestRole(this.dutyRoles, newMember._roles));
      if (oldRole !== currentRole) {
        this.utils.updateGradiInServizio(currentlyInServizio, { username: (oldMember.nickname !== null ? oldMember.nickname : oldMember.user.username), id: oldMember.user.id }, false, this.logChannel)
        this.utils.updateMessageField(this.embedMessage, oldRole, currentlyInServizio);
        if (currentRole !== undefined) {
          currentlyInServizio = this.utils.getField(this.dutyRoles, this.utils.getHighestRole(this.dutyRoles, newMember._roles), 'inServizio')
          // Se si vuole reinserire tra i lavoratori in servizio una volta cambiato il ruolo togliere il commento
          // this.utils.updateGradiInServizio(currentlyInServizio, { username: (newMember.nickname !== null ? newMember.nickname : newMember.user.username), id: newMember.user.id }, true)
          this.utils.updateMessageField(this.embedMessage, currentRole, currentlyInServizio);
        }
      }
    }
    if (oldMember.nickname !== newMember.nickname) {
      var currentRole = this.utils.getRoleNameById(this.currentServer.roles.cache, this.utils.getHighestRole(this.dutyRoles, newMember._roles));
      this.utils.updateGradiInServizio(currentlyInServizio, { username: (oldMember.nickname !== null ? oldMember.nickname : oldMember.user.username), id: oldMember.user.id }, false, this.logChannel)
      // Se si vuole reinserire tra i lavoratori in servizio una volta cambiato il nickname togliere il commento
      // this.utils.updateGradiInServizio(currentlyInServizio, { username: (newMember.nickname !== null ? newMember.nickname : newMember.user.username), id: newMember.user.id }, true)
      this.utils.updateMessageField(this.embedMessage, currentRole, currentlyInServizio);
    }
  }

  onRoleUpdate(role) {
    if (role != undefined) { this.utils.getElemByFieldValue(this.dutyRoles, "id", role.id).name = role.name; this.mySQLManager.updateGuildSettingsById(this.guildId, this.badgeGuildSettings.getJSONString()); }
    this.utils.updateEmbedFields(this.dutyRoles, this.currentServer.roles.cache, this.embedMessage);
  }

}

module.exports = BadgeGuild