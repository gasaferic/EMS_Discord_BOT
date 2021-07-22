const Discord = require('discord.js');
const events = require('events');

var config = require('./config.json');
const CommandManager = require('./CommandManager');
const LangManager = require('./LangManager');
const Utils = require('./Utils');

const replyDeleteTime = config.replyDeleteTime * 1000;
const warnDeleteTime = config.warnDeleteTime * 1000;
const commandCooldown = config.commandCooldown * 1000;

class BadgeGuild {
  constructor(id, client, badgeGuildSettings, mySQLManager) {
    this.id = id;
    this.client = client.client;
    this.discordButtons = client.discordButtons;
    this.badgeGuildSettings = badgeGuildSettings;
    this.targetRoles = this.badgeGuildSettings.getValue("targetRoles");

    this.eventEmitter = new events.EventEmitter();
    
    this.inCommandCooldown = [];

    this.mySQLManager = mySQLManager;
    this.langManager = new LangManager("mysql");

    this.utils = new Utils();

    // if (this.id == config.mainGuild) { this.commandManager.registerCommand({ command: "commandName" }); }

    this.eventEmitter.on('updateGuildSettingsRoles', (roles) => {
      if (roles) { this.utils.updateEmbedFields(this.targetRoles, this.currentServer.roles.cache, this.embedMessage); }
      this.mySQLManager.updateGuildSettingsById(this.id, this.badgeGuildSettings.getJSONString());
    })
  }

  clientReady() {
    // console.log(this.currentServer.roles.cache.get("865568905686548490"), this.currentServer.roles.cache.get("865568888292507648"))

    this.currentServer = this.client.guilds.cache.get(this.id);

    this.targetRoles.sort((firstRole, secondRole) => this.currentServer.roles.cache.get(secondRole.id).rawPosition - this.currentServer.roles.cache.get(firstRole.id).rawPosition);

    this.commandManager = new CommandManager(this, config.commands);
    if ((this.badgeChannel = this.currentServer.channels.cache.get(this.badgeGuildSettings.getValue("badgeChannel"))) == undefined) { this.currentServer.channels.cache.get(this.currentServer.systemChannelID).send(this.utils.getEmbedMessage({ colorHex: "#c91212", title: "Impostazioni bot", description: "Non è stato impostato un canale per il timbro dei badge, impostalo eseguendo il comando !setbadgechannel nel canale interessato", timestamp: true })); return; }
    if ((this.logChannel = this.currentServer.channels.cache.get(this.badgeGuildSettings.getValue("logChannel"))) == undefined) { this.currentServer.channels.cache.get(this.currentServer.systemChannelID).send(this.utils.getEmbedMessage({ colorHex: "#c91212", title: "Impostazioni bot", description: "Non è stato impostato un canale per il log delle entrate/uscite in servizio, impostalo eseguendo il comando !setlogchannel nel canale interessato", timestamp: true })); return; }

    this.badgeChannel.messages.fetch({ limit: 100 }).then(messages => { messages.forEach(message => { if (message.author.id == this.client.user.id) { message.delete(); } }) })

    this.sendBadgeEmbed();

    console.log('Bot caricato nel server', this.id);
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
    
    let timbraInButton = new this.discordButtons.MessageButton()
    .setLabel("Timbra l'entrata in servizio")
    .setID("timbraInButton")
    .setStyle("green")
    .setEmoji("✔️");

    let timbraOutButton = new this.discordButtons.MessageButton()
    .setLabel("Timbra l'uscita dal servizio")
    .setID("timbraOutButton")
    .setStyle("red")
    .setEmoji("✖️");

    let messageActionRow = new this.discordButtons.MessageActionRow()
    messageActionRow.addComponents(timbraInButton, timbraOutButton)

    this.badgeChannel.send(embedTimbro, messageActionRow).then(sentMessage => { this.embedMessage = sentMessage });
  }

  async timbraInButton(button) {
    var currentRole = this.utils.getRoleNameById(this.currentServer.roles.cache, this.utils.getHighestRole(this.targetRoles, button.clicker.member._roles));
    var currentlyInServizio = this.utils.getField(this.targetRoles, this.utils.getHighestRole(this.targetRoles, button.clicker.member._roles), 'inServizio')
    if (currentlyInServizio === undefined) { await button.reply.send(this.utils.getEmbedMessage({ colorHex: "#fcc603", title: "Informazione Servizio", description: "Non fai parte dell'ospedale!", timestamp: true }), true); return; }
    if (this.utils.isInServizio(currentlyInServizio, button.clicker.user.id)) { await button.reply.send(this.utils.getEmbedMessage({ colorHex: "#fcc603", title: "Informazione Servizio", description: "Sei già in servizio!", timestamp: true }), true); return; }
    this.utils.updateGradiInServizio(currentlyInServizio, { username: (button.clicker.member.nickname !== null ? button.clicker.member.nickname : button.clicker.user.username), id: button.clicker.user.id }, true)
    this.utils.updateMessageField(button.message, currentRole, currentlyInServizio);
    await button.reply.send(this.utils.getEmbedMessage({ colorHex: "#32a852", title: "Informazione Servizio", description: "Sei entrato/a in servizio", timestamp: true }), true)
  }

  async timbraOutButton(button) {
    var currentRole = this.utils.getRoleNameById(this.currentServer.roles.cache, this.utils.getHighestRole(this.targetRoles, button.clicker.member._roles));
    var currentlyInServizio = this.utils.getField(this.targetRoles, this.utils.getHighestRole(this.targetRoles, button.clicker.member._roles), 'inServizio')
    if (currentlyInServizio === undefined) { await button.reply.send(this.utils.getEmbedMessage({ colorHex: "#fcc603", title: "Informazione Servizio", description: "Non fai parte dell'ospedale!", timestamp: true }), true); return; }
    if (!this.utils.isInServizio(currentlyInServizio, button.clicker.user.id)) { await button.reply.send(this.utils.getEmbedMessage({ colorHex: "#fcc603", title: "Informazione Servizio", description: "Non sei in servizio!", timestamp: true }), true); return; }
    this.utils.updateGradiInServizio(currentlyInServizio, { username: (button.clicker.member.nickname !== null ? button.clicker.member.nickname : button.clicker.user.username), id: button.clicker.user.id }, false, this.logChannel)
    this.utils.updateMessageField(button.message, currentRole, currentlyInServizio);
    await button.reply.send(this.utils.getEmbedMessage({ colorHex: "#c91212", title: "Informazione Servizio", description: "Sei uscito/a dal servizio", timestamp: true }), true)
  }

  forceTimbraOut(userId, channelId) {
    var currentChannel = this.currentServer.channels.cache.get(channelId);
    var currentUser = this.currentServer.members.cache.get(userId);
    var username = (currentUser.nickname !== null ? currentUser.nickname : currentUser.user.username);
    var currentRole = this.utils.getRoleNameById(this.currentServer.roles.cache, this.utils.getHighestRole(this.targetRoles, currentUser._roles));
    var currentlyInServizio = this.utils.getField(this.targetRoles, this.utils.getHighestRole(this.targetRoles, currentUser._roles), 'inServizio')
    if (currentlyInServizio === undefined) { currentChannel.send(this.utils.getEmbedMessage({ colorHex: "#fcc603", title: "Informazione Servizio", description: username + " non fa parte dell'ospedale!", timestamp: true })).then(sentMessage => { setTimeout(() => { if (!sentMessage.deleted) { sentMessage.delete() } }, replyDeleteTime) }); return; }
    if (!this.utils.isInServizio(currentlyInServizio, userId)) { currentChannel.send(this.utils.getEmbedMessage({ colorHex: "#fcc603", title: "Informazione Servizio", description: username + " non è in servizio!", timestamp: true })).then(sentMessage => { setTimeout(() => { if (!sentMessage.deleted) { sentMessage.delete() } }, replyDeleteTime) }); return; }
    this.utils.updateGradiInServizio(currentlyInServizio, { username: username, id: userId }, false, this.logChannel)
    this.utils.updateMessageField(this.embedMessage, currentRole, currentlyInServizio);
    currentChannel.send(this.utils.getEmbedMessage({ colorHex: "#32a852", title: "Informazione Servizio", description: username + " cacciato/a dal servizio con successo", timestamp: true })).then(sentMessage => { setTimeout(() => { if (!sentMessage.deleted) { sentMessage.delete() } }, replyDeleteTime) });
  }

  clickButton(button) {
    // console.log('clickButton', this.id, this.targetRoles)
    if (button.id == "timbraInButton") {
      this.timbraInButton(button)
    } else if (button.id == "timbraOutButton") {
      this.timbraOutButton(button)
    }
  }

  guildMemberUpdate(oldMember, newMember) {
    // console.log('guildMemberUpdate', this.id)
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

  onCommand(executorId, commandString, channelId) {
    // console.log("id", this.id, "command string", commandString, "channel id", channelId);
    var currentChannel = this.currentServer.channels.cache.get(channelId);
    var currentCommand = commandString.includes(' ') ? this.commandManager.getCommandByName(commandString.substring(commandString.indexOf("!") + 1, commandString.indexOf(' '))) : this.commandManager.getCommandByName(commandString.replace('!', ''));
    if (currentCommand == undefined) { currentChannel.send("Hai inserito un comando inesistente <@!" + executorId + '>').then(sentMessage => { setTimeout(() => { if (!sentMessage.deleted) { sentMessage.delete() } }, replyDeleteTime) }); return; }
    if (currentCommand.isRequiredAdmin() && !this.currentServer.members.cache.get(executorId).hasPermission("ADMINISTRATOR")) { currentChannel.send("Non puoi utilizzare questo comando <@!" + executorId + '>').then(sentMessage => { setTimeout(() => { if (!sentMessage.deleted) { sentMessage.delete() } }, replyDeleteTime) }); return; }
    if (this.inCommandCooldown.includes(executorId)) { currentChannel.send("Aspetta prima di poter inviare di nuovo un comando <@!" + executorId + '>').then(sentMessage => { setTimeout(() => sentMessage.delete(), warnDeleteTime) }); return; }
    var args = this.utils.removeEmptyElems(commandString.substring(currentCommand.commandName.length + 2, commandString.length).split(' '));
    if (!currentCommand.enoughArgs(args)) { currentChannel.send("Non hai inserito abbastanza argomenti <@!" + executorId + '>').then(sentMessage => { setTimeout(() => { if (!sentMessage.deleted) { sentMessage.delete() } }, replyDeleteTime) }); return; }
    if (currentCommand.requiresChannelAsArg) { args.push(channelId); }
    currentCommand.execute(args);
    this.inCommandCooldown.push(executorId);
    setTimeout(() => this.inCommandCooldown.shift(), commandCooldown);
  }

  onRoleUpdate(role) {
    if (role != undefined) { this.utils.getElemByFieldValue(this.targetRoles, "id", role.id).name = role.name; this.mySQLManager.updateGuildSettingsById(this.id, this.badgeGuildSettings.getJSONString()); }
    this.utils.updateEmbedFields(this.targetRoles, this.currentServer.roles.cache, this.embedMessage);
  }

}

module.exports = BadgeGuild