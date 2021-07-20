const Discord = require('discord.js');
const events = require('events');

var config = require('./config.json');
const GuildSettings = require('./BadgeGuildSettings');
const CommandManager = require('./CommandManager');
const LangManager = require('./LangManager');
const Utils = require('./Utils');
const utils = new Utils();

const replyDeleteTime = config.replyDeleteTime * 1000;
const warnDeleteTime = config.warnDeleteTime * 1000;
const commandCooldown = config.commandCooldown * 1000;

class BadgeGuild {
  constructor(id, client, mySQLManager) {
    this.id = id;
    this.client = client.client;
    this.discordButtons = client.discordButtons;
    this.eventEmitter = new events.EventEmitter();
    
    this.inCommandCooldown = [];

    this.mySQLManager = mySQLManager;
    this.langManager = new LangManager("mysql");

    // if (this.id == config.mainGuild) { this.commandManager.registerCommand({ command: "enable" }, { command: "disable" }); }

    this.mySQLManager.getGuildSettingsById(this.id, function(guildSettingsString) {
      this.badgeGuildSettings = new GuildSettings(guildSettingsString)
      this.targetRoles = this.badgeGuildSettings.getValue("targetRoles");
    }.bind(this));

    this.eventEmitter.on('updateGuildSettingsRoles', () => {
      utils.updateEmbedFields(this.targetRoles, this.currentServer.roles.cache, this.embedMessage);
      this.mySQLManager.updateGuildSettingsById(this.id, this.badgeGuildSettings.getJSONString());
    })
  }

  clientReady() {
    // console.log(this.currentServer.roles.cache.get("865568905686548490"), this.currentServer.roles.cache.get("865568888292507648"))
    this.currentServer = this.client.guilds.cache.get(this.id);

    this.targetRoles.sort((firstRole, secondRole) => this.currentServer.roles.cache.get(secondRole.id).rawPosition - this.currentServer.roles.cache.get(firstRole.id).rawPosition);

    this.commandManager = new CommandManager(this, [ { command: "espelli", argsLength: 1, requiresChannelAsArg: true }, { command: "addrole", argsLength: 1 }, { command: "removerole", argsLength: 1 }, { command: "setbadgechannel", argsLength: 0, requiresChannelAsArg: true }, { command: "setlogchannel", argsLength: 0, requiresChannelAsArg: true } ]);
    if (this.badgeGuildSettings.getValue("badgeChannel") === undefined) { throw "Non è stato impostato un canale per il timbro dei badge!"; } else { this.badgeChannel = this.currentServer.channels.cache.get(this.badgeGuildSettings.getValue("badgeChannel")); }
    if (this.badgeGuildSettings.getValue("logChannel") === undefined) { throw "Non è stato impostato un canale per il log delle entrate/uscite in servizio!"; } else { this.logChannel = this.currentServer.channels.cache.get(this.badgeGuildSettings.getValue("logChannel")); }
    
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

    console.log('Bot caricato nel server', this.id);
  }

  async timbraInButton(button) {
    var currentRole = utils.getRoleNameById(this.currentServer.roles.cache, utils.getHighestRole(this.targetRoles, button.clicker.member._roles));
    var currentlyInServizio = utils.getField(this.targetRoles, utils.getHighestRole(this.targetRoles, button.clicker.member._roles), 'inServizio')
    if (currentlyInServizio === undefined) { await button.reply.send(utils.getEmbedMessage({ colorHex: "#fcc603", title: "Informazione Servizio", description: "Non fai parte dell'ospedale!", timestamp: true }), true); return; }
    if (utils.isInServizio(currentlyInServizio, button.clicker.user.id)) { await button.reply.send(utils.getEmbedMessage({ colorHex: "#fcc603", title: "Informazione Servizio", description: "Sei già in servizio!", timestamp: true }), true); return; }
    utils.updateGradiInServizio(currentlyInServizio, { username: (button.clicker.member.nickname !== null ? button.clicker.member.nickname : button.clicker.user.username), id: button.clicker.user.id }, true)
    utils.updateMessageField(button.message, currentRole, currentlyInServizio);
    await button.reply.send(utils.getEmbedMessage({ colorHex: "#32a852", title: "Informazione Servizio", description: "Sei entrato/a in servizio", timestamp: true }), true)
  }

  async timbraOutButton(button) {
    var currentRole = utils.getRoleNameById(this.currentServer.roles.cache, utils.getHighestRole(this.targetRoles, button.clicker.member._roles));
    var currentlyInServizio = utils.getField(this.targetRoles, utils.getHighestRole(this.targetRoles, button.clicker.member._roles), 'inServizio')
    if (currentlyInServizio === undefined) { await button.reply.send(utils.getEmbedMessage("#fcc603", "Informazione Servizio", "Non fai parte dell'ospedale!", "https://media.discordapp.net/attachments/864090286119714836/864111861552381997/ems-image.png?width=801&height=547", true, "Bot creato da ToxicVolpix#7169 & Gasaferic#8789. Contattateci in privato per qualsiasi problema riscontrato con il bot"), true); return; }
    if (!utils.isInServizio(currentlyInServizio, button.clicker.user.id)) { await button.reply.send(utils.getEmbedMessage({ colorHex: "#fcc603", title: "Informazione Servizio", description: "Non sei in servizio!", timestamp: true }), true); return; }
    utils.updateGradiInServizio(currentlyInServizio, { username: (button.clicker.member.nickname !== null ? button.clicker.member.nickname : button.clicker.user.username), id: button.clicker.user.id }, false, this.logChannel)
    utils.updateMessageField(button.message, currentRole, currentlyInServizio);
    await button.reply.send(utils.getEmbedMessage({ colorHex: "#c91212", title: "Informazione Servizio", description: "Sei uscito/a dal servizio", timestamp: true }), true)
  }

  forceTimbraOut(userId, channelId) {
    var currentChannel = this.currentServer.channels.cache.get(channelId);
    var currentUser = this.currentServer.members.cache.get(userId);
    var username = (currentUser.nickname !== null ? currentUser.nickname : currentUser.user.username);
    var currentRole = utils.getRoleNameById(this.currentServer.roles.cache, utils.getHighestRole(this.targetRoles, currentUser._roles));
    var currentlyInServizio = utils.getField(this.targetRoles, utils.getHighestRole(this.targetRoles, currentUser._roles), 'inServizio')
    if (currentlyInServizio === undefined) { currentChannel.send(utils.getEmbedMessage({ colorHex: "#fcc603", title: "Informazione Servizio", description: username + " non fa parte dell'ospedale!", timestamp: true })).then(sentMessage => { setTimeout(() => sentMessage.delete(), replyDeleteTime) }); return; }
    if (!utils.isInServizio(currentlyInServizio, userId)) { currentChannel.send(utils.getEmbedMessage({ colorHex: "#fcc603", title: "Informazione Servizio", description: username + " non è in servizio!", timestamp: true })).then(sentMessage => { setTimeout(() => sentMessage.delete(), replyDeleteTime) }); return; }
    utils.updateGradiInServizio(currentlyInServizio, { username: username, id: userId }, false, this.logChannel)
    utils.updateMessageField(this.embedMessage, currentRole, currentlyInServizio);
    currentChannel.send(utils.getEmbedMessage({ colorHex: "#32a852", title: "Informazione Servizio", description: username + " cacciato/a dal servizio con successo", timestamp: true })).then(sentMessage => { setTimeout(() => sentMessage.delete(), replyDeleteTime) });
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
    var currentlyInServizio = utils.getField(this.targetRoles, utils.getHighestRole(this.targetRoles, oldMember._roles), 'inServizio')
    if (currentlyInServizio === undefined || !utils.isInServizio(currentlyInServizio, oldMember.user.id)) { return; }
    if (oldMember._roles.length !== newMember._roles.length) {
      var oldRole = utils.getRoleNameById(this.currentServer.roles.cache, utils.getHighestRole(this.targetRoles, oldMember._roles));
      var currentRole = utils.getRoleNameById(this.currentServer.roles.cache, utils.getHighestRole(this.targetRoles, newMember._roles));
      if (oldRole !== currentRole) {
        utils.updateGradiInServizio(currentlyInServizio, { username: (oldMember.nickname !== null ? oldMember.nickname : oldMember.user.username), id: oldMember.user.id }, false, this.logChannel)
        utils.updateMessageField(this.embedMessage, oldRole, currentlyInServizio);
        if (currentRole !== undefined) {
          currentlyInServizio = utils.getField(this.targetRoles, utils.getHighestRole(this.targetRoles, newMember._roles), 'inServizio')
          // Se si vuole reinserire tra i lavoratori in servizio una volta cambiato il ruolo togliere il commento
          // utils.updateGradiInServizio(currentlyInServizio, { username: (newMember.nickname !== null ? newMember.nickname : newMember.user.username), id: newMember.user.id }, true)
          utils.updateMessageField(this.embedMessage, currentRole, currentlyInServizio);
        }
      }
    }
    if (oldMember.nickname !== newMember.nickname) {
      var currentRole = utils.getRoleNameById(this.currentServer.roles.cache, utils.getHighestRole(this.targetRoles, newMember._roles));
      utils.updateGradiInServizio(currentlyInServizio, { username: (oldMember.nickname !== null ? oldMember.nickname : oldMember.user.username), id: oldMember.user.id }, false, this.logChannel)
      // Se si vuole reinserire tra i lavoratori in servizio una volta cambiato il nickname togliere il commento
      // utils.updateGradiInServizio(currentlyInServizio, { username: (newMember.nickname !== null ? newMember.nickname : newMember.user.username), id: newMember.user.id }, true)
      utils.updateMessageField(this.embedMessage, currentRole, currentlyInServizio);
    }
  }

  onCommand(executor, commandString, channelId) {
    // console.log("id", this.id, "command string", commandString, "channel id", channelId);
    var currentChannel = this.currentServer.channels.cache.get(channelId);
    var currentCommand = commandString.includes(' ') ? this.commandManager.getCommandByName(commandString.substring(commandString.indexOf("!") + 1, commandString.indexOf(' '))) : this.commandManager.getCommandByName(commandString.replace('!', ''));
    if (currentCommand == undefined) { currentChannel.send("Hai inserito un comando inesistente <@!" + executor + '>').then(sentMessage => { setTimeout(() => sentMessage.delete(), replyDeleteTime) }); return; }
    if (this.inCommandCooldown.includes(executor)) { currentChannel.send("Aspetta prima di poter inviare di nuovo un comando <@!" + executor + '>').then(sentMessage => { setTimeout(() => sentMessage.delete(), warnDeleteTime) }); return; }
    var args = utils.removeEmptyElems(commandString.substring(currentCommand.commandName.length + 2, commandString.length).split(' '));
    if (!currentCommand.enoughArgs(args)) { currentChannel.send("Non hai inserito abbastanza argomenti <@!" + executor + '>').then(sentMessage => { setTimeout(() => sentMessage.delete(), replyDeleteTime) }); return; }
    if (currentCommand.requiresChannelAsArg) { args.push(channelId); }
    currentCommand.execute(args);
    this.inCommandCooldown.push(executor);
    setTimeout(() => this.inCommandCooldown.shift(), commandCooldown);
  }

  onRoleUpdate(roleId) {
    for (var role of this.targetRoles) {
      if (role.id == roleId) {
        utils.updateEmbedFields(this.targetRoles, this.currentServer.roles.cache, this.embedMessage);
        break;
      }
    }
  }

}

module.exports = BadgeGuild