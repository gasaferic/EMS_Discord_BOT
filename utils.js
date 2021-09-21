const fs = require('fs');
const Discord = require('discord.js');
var config = require('./config.json');

const fusoOrario = config.fusoOrario

class Utils {
  constructor() { }

  updateField(array, field, value) {
    for (var elem of array) {
      if (elem.name === field) {
        elem.value = value
      }
    }
    return array;
  }

  getFieldValue(array, field) {
    for (var elem of array) {
      if (elem[field] != undefined) {
        return elem.value
      }
    }
  }
  getField(array, targetElemID, field) {
    for (var elem of array) {
      if (elem.id == targetElemID && elem[field] != undefined) {
        return elem[field]
      }
    }
  }

  isInServizio(arrayInServizio, id) {
    for (var elem of arrayInServizio) {
      if (elem.id === id) {
        return true;
      }
    }
    return false;
  }

  removeElemAtIndex(array, index) {
    var tempArray = []

    for (var elem of array) {
      if (array.indexOf(elem) !== index) {
        tempArray.push(elem)
      }
    }

    return tempArray;
  }

  updateGradiInServizio(arrayInServizio, utente, add, logChannel) {
    if (add) {
      arrayInServizio.push({ username: utente.username, id: utente.id, timestamp: Date.now() })
    } else {
      for (var elem of arrayInServizio) {
        if (elem.id == utente.id) {
          this.logBadgeOut({ username: '<@' + utente.id + '>', timestamp: { enter: elem.timestamp, exit: Date.now() }, channel: logChannel })
          arrayInServizio.splice(arrayInServizio.indexOf(elem), 1)
          break;
        }
      }
    }
  }

  updateEmbedFields(badgeGuildRoles, message) {
    message.embeds[0].fields = [];
    badgeGuildRoles.forEach((ruolo) => {
      message.embeds[0].addFields({ name: ruolo.get("name"), value: this.getInServizioListString(ruolo.get("inServizio")) });
    })
    message.edit({ embeds: [message.embeds[0]] });
  }

  getInServizioListString(array) {
    var listString = "";
    if (array.length == 0) {
      listString = "Nessuno in servizio"
    } else {
      for (var elem of array) {
        listString += '<@' + elem.id + '>' + ((array.indexOf(elem) !== array.length - 1) ? ", " : "")
      }
    }
    return listString
  }

  getHighestRole(dutyRoles, userRoles) {
    for (var key of dutyRoles.keys()) {
      for (var currentUserRoleId of userRoles) {
        if (currentUserRoleId === key) {
          return key;
        }
      }
    }
  }

  getRoleNameById(dutyRoles, id) {
    return dutyRoles.get(id).name;
  }
  
  updateMessageField(message, role, updatedArray) {
    // console.log("prima", role, message.embeds[0].fields)
    message.embeds[0].fields = this.updateField(message.embeds[0].fields, role, this.getInServizioListString(updatedArray))
    // console.log("dopo", role, message.embeds[0].fields)
    message.edit({ embeds: [message.embeds[0]] })
  }

  options = { year: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric' };

  logBadgeOut(data) {
    var enterDate = new Date(data.timestamp.enter + (fusoOrario * 60 * 60 * 1000));
    var exitDate = new Date(data.timestamp.exit+ (fusoOrario * 60 * 60 * 1000));
    var elapsedTimeFormatted = this.getElapsedTime(data.timestamp.enter, data.timestamp.exit);
    const infoTimbro = new Discord.MessageEmbed()
    .setColor('#1900ff')
    .setTitle('Timbro Badge')
    .setDescription('Uscita del servizio.')
    .addFields({ name: "Lavoratore", value: data.username })
    .addFields({ name: "Inizio servizio", value: this.getLocaleDateString(enterDate) })
    .addFields({ name: "Fine servizio", value: this.getLocaleDateString(exitDate) })
    .addFields({ name: "Totale ore servizio", value: elapsedTimeFormatted.days + " " + elapsedTimeFormatted.hours + " " + elapsedTimeFormatted.minutes })
    .setThumbnail('https://media.discordapp.net/attachments/889851912139182091/889877620081180713/unknown.png')
    .setTimestamp()
    .setFooter('Bot creato da Gasaferic#8789');
    data.channel.send({ embeds: [infoTimbro] });
  }

  getLocaleDateString(date) {
    return this.capitalizeFirstLetter(date.toLocaleDateString("it-IT", { weekday: 'long' })) + " " + date.toLocaleDateString("it-IT", { day: 'numeric' }) + " " + this.capitalizeFirstLetter(date.toLocaleDateString("it-IT", { month: 'long' })) + " " + date.toLocaleDateString("it-IT", this.options);
  }

  capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }

  getElapsedTime(startMillis, stopMillis) {
    var elapsedTime = stopMillis - startMillis;
    var elapsedTimeFormatted = { days: 0, hours: 0, minutes: 0 }
    elapsedTimeFormatted.minutes = Math.floor((elapsedTime / 1000) / 60);
    if (elapsedTimeFormatted.minutes > 59) { elapsedTimeFormatted.hours = Math.floor(elapsedTimeFormatted.minutes / 60); elapsedTimeFormatted.minutes = elapsedTimeFormatted.minutes % 60; }
    if (elapsedTimeFormatted.hours > 23) { elapsedTimeFormatted.days = Math.floor(elapsedTimeFormatted.hours / 24); elapsedTimeFormatted.hours = elapsedTimeFormatted.hours % 24; }
    elapsedTimeFormatted.days = elapsedTimeFormatted.days == 1 ? elapsedTimeFormatted.days + " Giorno" : elapsedTimeFormatted.days + " Giorni"
    elapsedTimeFormatted.hours = elapsedTimeFormatted.hours == 1 ? elapsedTimeFormatted.hours + " Ora" : elapsedTimeFormatted.hours + " Ore"
    elapsedTimeFormatted.minutes = elapsedTimeFormatted.minutes == 1 ? elapsedTimeFormatted.minutes + " Minuto" : elapsedTimeFormatted.minutes + " Minuti"
    return elapsedTimeFormatted;
  }
  // colorHex, title, description, thumbnail, timestamp, footer

  defaultEmbedData = {
    thumbnail: "https://media.discordapp.net/attachments/889851912139182091/889877620081180713/unknown.png",
    footer: "Bot creato da Gasaferic#8789"
  }
  
  getEmbedMessage(embedData) {
    const embedMessage = new Discord.MessageEmbed();
    if (embedData.colorHex) { embedMessage.setColor(embedData.colorHex); }
    if (embedData.title) { embedMessage.setTitle(embedData.title); }
    if (embedData.description) { embedMessage.setDescription(embedData.description); }
    if (embedData.timestamp) { embedMessage.setTimestamp(); }
    embedMessage.setThumbnail(embedData.thumbnail || this.defaultEmbedData.thumbnail);
    embedMessage.setFooter(embedData.footer || this.defaultEmbedData.footer);
    return embedMessage;
  }

  removeEmptyElems(array) {
    var finalArray = [];
    for (var elem of array) {
      if (elem != '') {
        finalArray.push(elem);
      }
    }
    return finalArray;
  }

  containsFieldValue(array, field, value) {
    for (var elem of array) {
      if (elem[field] != undefined && elem[field] == value) {
        return true;
      }
    }
    return false;
  }

  getElemByFieldValue(array, field, value) {
    for (var elem of array) {
      if (elem[field] != undefined && elem[field] == value) {
        return elem;
      }
    }
    return undefined;
  }

  log(data) {
    var currentDate = new Date(Date.now() + (fusoOrario * (60 * 60 * 1000)));
    fs.appendFileSync("./logs_" + (currentDate.getDate() + "-" + (currentDate.getMonth() + 1) + "-" + currentDate.getFullYear()) + ".txt", ("[" + (Date.now() + (fusoOrario * (60 * 60 * 1000))) + "]") + ">[" + data.action + "]>" + data.content + "\n", 'utf8');
  }

}

module.exports = Utils
