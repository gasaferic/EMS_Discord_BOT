const MySQLManager = require('./MySQLManager');
const events = require('events');
const eventEmitter = new events.EventEmitter();
const Discord = require('discord.js');
const Intents = Discord.Intents;
const client = new Discord.Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MEMBERS, Intents.FLAGS.GUILD_MESSAGES] });
const fs = require('fs');





// Anti-Spam

const interactionDelay = new Map();
interactionDelay.set("button", []);
interactionDelay.set("contextMenu", []);

interactionDelay.set("command", new Map());


// Commands Classes

const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
const commands = new Map();
for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  commands.set(command.data.name.toLowerCase().replaceAll(" ", ""), command);
  if (command.spamDelay) {
    interactionDelay.get("command").set(command.data.name.toLowerCase().replaceAll(" ", ""), new Map());
    // console.log(command.data.name.toLowerCase().replaceAll(" ", ""),  interactionDelay.get("command").get(command.data.name.toLowerCase().replaceAll(" ", "")))
  }
}





var config = require('./config.json');
var mysqlConnectionParams = config.mysql;







const BadgeGuildManager = require('./badgeguilds/BadgeGuildManager');
var badgeGuildManager;

const mySQLManager = new MySQLManager({ mysqlConnectionParams: mysqlConnectionParams, eventEmitter: eventEmitter });
eventEmitter.once("mysql_connection_ready", function(connectionParams) {
  console.log("Connesso a " + connectionParams.host + " nel database " + connectionParams.database + " come " + connectionParams.user);
  client.login(config.token);
});

process.on('unhandledRejection', error => {
	console.error('Unhandled promise rejection:', error);
});

client.once("ready", () => {

  currentServer = client.guilds.cache.get(config.authoritativeDiscord);

  config.roles.admin.id = "" + currentServer.roles.cache.find(r => r.name === config.roles.admin.name);
  config.roles.everyone.id = "" + currentServer.roles.cache.find(r => r.name === '@everyone');

  saveConfig();

  /*client.application.commands.fetch().then(() => {
    for (var command of client.application.commands.cache) {
      client.application.commands.delete(command[0]);
      console.log("Deleted command", command[1].name);
    }
  });*/

  /*console.log("Cleaning commands for guild", config.authoritativeDiscord + "...");

  currentServer.commands.fetch().then(() => {
    for (var command of currentServer.commands.cache) {
      currentServer.commands.delete(command[0]);
      console.log("Deleted command", command[1].name);
    }

    console.log("Cleaned commands for guild", config.authoritativeDiscord);

    console.log("Loading commands for guild", config.authoritativeDiscord + "...");

    for (var command of commands.keys()) {
      var currentJSON = commands.get(command).data.toJSON();
  
      currentServer.commands.create(currentJSON);
      console.log("Loaded command", command);
    }
  
    console.log("Loaded commands for guild", config.authoritativeDiscord);


    console.log("Loading permissions for guild", config.authoritativeDiscord + "...");

    setTimeout(() => {
      currentServer.commands.fetch().then(() => {
        console.log("Fetched commands to set permissions on...");
        var currentCommand;
        for (var command of currentServer.commands.cache.keys()) {
          currentCommand = currentServer.commands.cache.get(command);
          currentServer.commands.permissions.set({ command: currentCommand.id, permissions: commands.get(currentCommand.name.toLowerCase().replaceAll(" ", "")).permissions })
          console.log("Loaded permissions for command", currentCommand.name);
        }
  
        console.log("Loaded permissions for guild", config.authoritativeDiscord);
      });

    }, 60 * 1000)

  });*/


  mySQLManager.getGuilds(function(guilds) { 
    badgeGuildManager = new BadgeGuildManager(client, mySQLManager, guilds);
  });
  
})

client.on("guildCreate", function(guild){
  mySQLManager.addGuild({ guild: guild, guildSettings: config.defaultBadgeGuildSettings });
  badgeGuilds[guild.id] = new BadgeGuild(guild.id, { client: client, discordButtons: discordButtons }, new GuildSettings(config.defaultBadgeGuildSettings), mySQLManager);
  badgeGuilds[guild.id].clientReady();
});

client.on("guildDelete", function(guild){
  mySQLManager.removeGuildById(guild.id);
});

client.on('interactionCreate', async (interaction) => {
  // console.log(interaction);
  if (interaction.isButton()) {
    if (interactionDelay.get("button").includes(interaction.member.user.id)) { return; }
    if (interaction.customId == "dutyOff" || interaction.customId == "dutyOn") { badgeGuildManager.getBadgeGuildById(interaction.guild.id).handleButton(interaction); }
    interactionDelay.get("button").push(interaction.member.user.id);
    setTimeout(() => { interactionDelay.get("button").splice(interactionDelay.get("button").indexOf(interaction.member.user.id), 1) }, 2000)
  } else if (interaction.isCommand()) {
    // log({ action: interaction.type, content: interaction.member.user.username + " ha utilizzato un comando (" + interaction.commandName + ")"});
    // console.log(commands.get(interaction.commandName).spamDelay, typeof interactionDelay.get("command").get(interaction.commandName), interactionDelay.get("command").get(interaction.commandName)[interaction.member.user.id]);

    if (interactionDelay.get("command").get(interaction.commandName).has(interaction.member.user.id)) { await interaction.reply({content: "Non puoi eseguire questo comando per " + utils.getRemainingTime(Date.now(), interactionDelay.get("command").get(interaction.commandName).get(interaction.member.user.id)), ephemeral: true}); return; }
    
    commands.get(interaction.commandName).execute(interaction, badgeGuildManager);
    interactionDelay.get("command").get(interaction.commandName).set(interaction.member.user.id, Date.now() + commands.get(interaction.commandName).spamDelay * 1000);

    setTimeout(() => { interactionDelay.get("command").get(interaction.commandName).delete(interaction.member.user.id) }, commands.get(interaction.commandName).spamDelay * 1000)

  } else if (interaction.isContextMenu()) {
    if (interactionDelay.get("contextMenu").includes(interaction.member.user.id)) { return; }

    if (interaction.commandName == "Caccia dal Servizio") {
      commands.get(interaction.commandName.toLowerCase().replaceAll(" ", "")).execute(interaction, tokenManager);
    }

    interactionDelay.get("contextMenu").push(interaction.member.user.id);
    setTimeout(() => { interactionDelay.get("contextMenu").splice(interactionDelay.get("contextMenu").indexOf(interaction.member.user.id), 1) }, 2000)
  }
});
client.on("guildMemberUpdate", (oldMember, newMember) => {
  // console.log('guildMemberUpdate', oldMember.guild.id, newMember.guild.id)
  if (badgeGuilds[newMember.guild.id] == undefined) { return; }
  badgeGuilds[newMember.guild.id].guildMemberUpdate(oldMember, newMember)
});

client.on('messageCreate', message => {
});

client.on("roleUpdate", function(oldRole, newRole) {
  let currentBadgeGuild = badgeGuilds[newRole.guild.id]
  // console.log("event", Date.now());
  if (currentBadgeGuild == undefined) { return; }
  if (!currentBadgeGuild.utils.containsFieldValue(currentBadgeGuild.targetRoles, "id", newRole.id)) { return; }
  if (oldRole.name != newRole.name) { currentBadgeGuild.onRoleUpdate(newRole); }
  if (eventQueue.roleUpdate.includes(currentBadgeGuild.id)) { return; }
  eventQueue.roleUpdate.push(currentBadgeGuild.id);
  setTimeout(() => {
    currentBadgeGuild.onRoleUpdate();
    eventQueue.roleUpdate.shift();
  }, 10)
});

const fusoOrario = 2;
function log(data) {
  var currentDate = new Date(Date.now() + (fusoOrario * (60 * 60 * 1000)));
  fs.appendFileSync("./logs_" + (currentDate.getDate() + "-" + (currentDate.getMonth() + 1) + "-" + currentDate.getFullYear()) + ".txt", ("[" + currentDate.getHours() + ":" + currentDate.getMinutes() + ":" + currentDate.getSeconds() + "]") + " > " + data.action + ": " + data.content + "\n", 'utf8');
}

function saveConfig() {
  var configContentString = JSON.stringify(config, null, 2); // "\t" per i tabs
  const configContent = configContentString.split(",");
  if (fs.existsSync("./config.json")) { fs.unlinkSync("./config.json") }
  for (var configElement of configContent) {
    fs.appendFileSync('./config.json', configElement + (configContent.indexOf(configElement) == configContent.length - 1 ? "" : ","), 'utf8');
  }
}
