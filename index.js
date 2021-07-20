const MySQLManager = require('./MySQLManager');
const BadgeGuild = require('./BadgeGuild');
var badgeGuilds = {}
const events = require('events');
var config = require('./config.json');
var mysqlConnectionParams = config.mysql;
const eventEmitter = new events.EventEmitter();

const Discord = require('discord.js');
const discordButtons = require('discord-buttons');
const client = new Discord.Client();
discordButtons(client);
client.login(config.token)

var mySQLManager = new MySQLManager(mysqlConnectionParams, eventEmitter);
eventEmitter.once("mysql_connection_ready", function(connectionParams) {
  console.log("Connesso a " + connectionParams.host + " nel database " + connectionParams.database + " come " + connectionParams.user);
  badgeGuilds['855928988265873438'] = new BadgeGuild('855928988265873438', { client: client, discordButtons: discordButtons }, mySQLManager)
  // badgeGuilds['864066342008651818'] = new BadgeGuild('864066342008651818', { client: client, discordButtons: discordButtons }, mySQLManager)
});

/*
const gradi = [
  {name:'Direttore', id:'864522265633488897', inServizio: []},
  {name:'Vice-Direttore', id:'865568626747375617', inServizio: []},
  {name:'Primario', id:'865568690863079434', inServizio: []},
  {name:'Chirurgo', id:'865568707484057601', inServizio: []},
  {name:'Dottore', id:'865568888292507648', inServizio: []},
  {name:'Infermiere', id:'865568905686548490', inServizio: []},
  {name:'Volontario', id:'865568929359593483', inServizio: []}
]

var currentServer = null;
var targetChannel = null;
var logChannel = null;
var embedMessage = null;
*/

client.once("ready", () => {
  for (var id of client.guilds.cache.keys()) {
    if (badgeGuilds[id] === undefined) { return; }
    badgeGuilds[id].clientReady()
  }
})

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

client.on("roleUpdate", function(oldRole, newRole){
  if (badgeGuilds[newRole.guild.id] == undefined) { return; }
  badgeGuilds[newRole.guild.id].onRoleUpdate(newRole.id);
});