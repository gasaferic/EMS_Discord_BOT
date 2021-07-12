const utils = require('./utils')
const Discord = require('discord.js');
const client = new Discord.Client();
const discordButtons = require('discord-buttons');
discordButtons(client);

const token = process.env['token']

const gradi = [
  {name:'Direttore', id:'864124622030241813', inServizio: []},
  {name:'Vice-Direttore', id:'864124672588251158', inServizio: []},
  {name:'Primario', id:'864124672588251158', inServizio: []},
  {name:'Chirurgo', id:'864124672588251158', inServizio: []},
  {name:'Dottore', id:'864124672588251158', inServizio: []},
  {name:'Infermiere', id:'864124672588251158', inServizio: []},
  {name:'Tirocinante', id:'864124672588251158', inServizio: []},
  {name:'Volontario', id:'864124672588251158', inServizio: []}
]

var currentServer = null;
var targetChannel = null;

client.once('ready', () => {
  console.log('Questo bot è online');
  currentServer = client.guilds.cache.get('864066342008651818');
  // console.log(currentServer.members.cache.get('243014775510925313').roles.cache)
  targetChannel = currentServer.channels.cache.get('864165295777251358')
  const embedTimbro = new Discord.MessageEmbed()
	.setColor('#1900ff')
	.setTitle('Timbro Badge')
	.setDescription('Ricordatevi di timbrare e stimbrare ogni volta che si entra o si esce dal servizio EMS. Il calcolo delle ore parte da un minimo di 1 ora.')
	.setThumbnail('https://media.discordapp.net/attachments/864090286119714836/864111861552381997/ems-image.png?width=801&height=547')
	.setTimestamp()
  .setFooter('Bot creato da ToxicVolpix#7169 & Gasaferic#8789. Contattateci in privato per qualsiasi problema riscontrato con il bot');

  gradi.forEach((grado) => {
    embedTimbro.addFields({ name: grado.name, value: "Nessuno in servizio" })
  })
  
  let clockInButton = new discordButtons.MessageButton()
  .setLabel("Timbra l'entrata in servizio")
  .setID("clockInButton")
  .setStyle("green")
  .setEmoji("✔️");

  let clockOutButton = new discordButtons.MessageButton()
  .setLabel("Timbra l'uscita dal servizio")
  .setID("clockOutButton")
  .setStyle("red")
  .setEmoji("✖️");

  let messageActionRow = new discordButtons.MessageActionRow()
  messageActionRow.addComponents(clockInButton, clockOutButton)

  targetChannel.send(embedTimbro, messageActionRow);
});


function timbraInButton(message, clicker) {
  var currentRole = utils.getRoleNameById(currentServer.roles.cache, utils.getHighestRole(gradi, clicker.member._roles));
  var currentlyInServizio = utils.getField(gradi, 'inServizio')

  if (utils.isInServizio(currentlyInServizio, clicker.user.id)) { return; }

  utils.updateGradiInServizio(currentlyInServizio, clicker.user, true)

  message.embeds[0].fields = utils.updateField(message.embeds[0].fields, currentRole, utils.getInServizioListString(currentlyInServizio))
  message.edit(message.embeds[0])

  console.log('Sono entrato/a in servizio')//, clicker)
}

function timbraOutButton(message, clicker) {
  var currentRole = utils.getRoleNameById(currentServer.roles.cache, utils.getHighestRole(gradi, clicker.member._roles));
  var currentlyInServizio = utils.getField(gradi, 'inServizio')

  if (!utils.isInServizio(currentlyInServizio, clicker.user.id)) { return; }

  utils.updateGradiInServizio(currentlyInServizio, clicker.user, false)

  message.embeds[0].fields = utils.updateField(message.embeds[0].fields, currentRole, utils.getInServizioListString(currentlyInServizio))
  message.edit(message.embeds[0])

  console.log('Sono uscito/a dal servizio')//, clicker)
}

client.on('clickButton', async (button) => {
  if (button.id == "clockInButton") {
    timbraInButton(button.message, button.clicker)
  } else if (button.id == "clockOutButton") {
    timbraOutButton(button.message, button.clicker)
  }
});

/*client.on('messageReactionAdd', (reaction, user) => {
  if (user.id === reaction.message.author.id) { return; }
  console.log('id autore', reaction.message.author.id)
  reaction.message.edit("Sto stronzo de " + user.username + " ha aggiunto na reazione")
  console.log('content messaggio', reaction.message.author.id)
  console.log('aggiunta reazione')
  reaction.users.remove(user.id)
});*/

client.on('message', msg => {
  // console.log(msg)
  if(msg.content === "Buongiorno a tutti"){
    msg.reply('Sei pronto/a per il servizio in ospedale?');
  }
})

client.on('message', message => {
  if(message.content.startsWith('!espelli')){
    const user = message.mentions.user.first();
    if(user){
      const member = message.guild.member(user);
    }
    message.reply("L'utente è stato buttato fuori dalla lista con successo!");
  }
});

client.login(token)