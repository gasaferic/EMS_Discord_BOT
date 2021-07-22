const MySQLManager = require('./MySQLManager');
const events = require('events');
const eventEmitter = new events.EventEmitter();
const Discord = require('discord.js');
const discordButtons = require('discord-buttons');
const client = new Discord.Client();
discordButtons(client);

var config = require('./config.json');
var mysqlConnectionParams = config.mysql;

const GuildSettings = require('./BadgeGuildSettings');
const BadgeGuild = require('./BadgeGuild');
var badgeGuilds = {}
var eventQueue = { roleUpdate: [] }

var mySQLManager = new MySQLManager(mysqlConnectionParams, eventEmitter);
eventEmitter.once("mysql_connection_ready", function(connectionParams) {
  console.log("Connesso a " + connectionParams.host + " nel database " + connectionParams.database + " come " + connectionParams.user);
  mySQLManager.getGuilds(function(guilds) { 
    for (var guildData of guilds) {
      badgeGuilds[guildData.guild_id] = new BadgeGuild(guildData.guild_id, { client: client, discordButtons: discordButtons }, new GuildSettings(guildData.guild_settings), mySQLManager)
      console.log('Loaded guild', guildData.guild_id);
    }
  });
  client.login(config.token)
});

client.once("ready", () => {
  for (var id of client.guilds.cache.keys()) {
    if (badgeGuilds[id] === undefined) { return; }
    badgeGuilds[id].clientReady();
  }
})

client.on("guildCreate", function(guild){
  mySQLManager.addGuild({ guild: guild, guildSettings: config.defaultBadgeGuildSettings });
  badgeGuilds[guild.id] = new BadgeGuild(guild.id, { client: client, discordButtons: discordButtons }, new GuildSettings(config.defaultBadgeGuildSettings), mySQLManager);
  badgeGuilds[guild.id].clientReady();
});

client.on("guildDelete", function(guild){
  mySQLManager.removeGuildById(guild.id);
});

client.on('clickButton', async (button) => {
  // console.log('clickButton', button.guild.id)
  if (badgeGuilds[button.guild.id] == undefined) { return; }
  badgeGuilds[button.guild.id].clickButton(button)
});

client.on("guildMemberUpdate", (oldMember, newMember) => {
  // console.log('guildMemberUpdate', oldMember.guild.id, newMember.guild.id)
  if (badgeGuilds[newMember.guild.id] == undefined) { return; }
  badgeGuilds[newMember.guild.id].guildMemberUpdate(oldMember, newMember)
});

client.on('message', message => {
  if (message.content.startsWith('!')) {
    if (badgeGuilds[message.channel.guild.id] == undefined) { return; }
    badgeGuilds[message.channel.guild.id].onCommand(message.author.id, message.content, message.channel.id)
    message.delete();
  }
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