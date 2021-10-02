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
    return this.getFormattedTime(this.getTimeFromMillis(stopMillis - startMillis));
  }

  getFormattedTime(time, short) {
    var formattedTime = { days: time.days, hours: time.hours, minutes: time.minutes };
    formattedTime.days = formattedTime.days == 1 ? formattedTime.days + " Giorno"  : formattedTime.days + " Giorni"
    formattedTime.hours = formattedTime.hours == 1 ? formattedTime.hours + " Ora" : formattedTime.hours + " Ore"
    formattedTime.minutes = formattedTime.minutes == 1 ? formattedTime.minutes + " Minuto" : formattedTime.minutes + " Minuti"
    if (short) {
      formattedTime.days = formattedTime.days.substring(0, formattedTime.days.length - 5).toLowerCase();
      formattedTime.hours = formattedTime.hours.substring(0, formattedTime.hours.length - 2).toLowerCase();
      formattedTime.minutes = formattedTime.minutes.substring(0, formattedTime.minutes.length - 5).toLowerCase();
    }
    return formattedTime;
  }

  getTimeFromMillis(millis) {
    var time = { days: 0, hours: 0, minutes: 0 }
    time.minutes = Math.floor((millis / 1000) / 60);
    if (time.minutes > 59) { time.hours = Math.floor(time.minutes / 60); time.minutes = time.minutes % 60; }
    if (time.hours > 23) { time.days = Math.floor(time.hours / 24); time.hours = time.hours % 24; }
    return time;
  }

  getTimezone() {
    return fusoOrario;
  }

  SECOND = 1000 * 1;
  MINUTE = this.SECOND * 60;
  HOUR = this.MINUTE * 60;
  DAY = this.HOUR * 24;

  getClearedTime(millis, interestedTime) {
    var currentDate = new Date(millis);
    if (interestedTime == "second") {
      currentDate = new Date(millis - currentDate.getUTCMilliseconds());
    } else if (interestedTime == "minute") {
      currentDate = new Date(millis - ((currentDate.getUTCSeconds() * 1000) + currentDate.getUTCMilliseconds()));
    } else if (interestedTime == "hour") {
      currentDate = new Date(millis - ((currentDate.getUTCMinutes() * this.MINUTE) + (currentDate.getUTCSeconds() * 1000) + currentDate.getUTCMilliseconds()));
    } else if (interestedTime == "day") {
      currentDate = new Date(millis - ((currentDate.getUTCHours() * this.HOUR) + (currentDate.getUTCMinutes() * this.MINUTE) + (currentDate.getUTCSeconds() * 1000) + currentDate.getUTCMilliseconds()));
    }
    return currentDate;
  }

  getHalfSecond(millis) {
    return this.getClearedTime(millis, "second").getTime() + 500;
  }

  getPastDate(date, pastDays) {
    // console.log(new Date(this.getClearedTime(date.getTime(), "day").getTime() - (this.DAY * pastDays)));
    return new Date(this.getClearedTime(date.getTime(), "day").getTime() - (this.DAY * pastDays));
  } 

  getDatesRange(startDate, endDate) {
    const datesRange = [];
    var currentDate = startDate;
    while (true) {
      if (currentDate.getUTCFullYear() == endDate.getUTCFullYear() && currentDate.getUTCMonth() == endDate.getUTCMonth() && currentDate.getUTCDate() == endDate.getUTCDate()) { break }
      datesRange.push(currentDate.getUTCDate() + "-" + (currentDate.getUTCMonth() + 1) + "-" + currentDate.getUTCFullYear());
      currentDate = new Date(this.getClearedTime(currentDate.getTime(), "day").getTime() + this.DAY);
    }
    return datesRange;
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
    if (embedData.fields) { embedMessage.addFields(embedData.fields); }
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
    var currentDate = data.date || new Date(Date.now() + (fusoOrario * (60 * 60 * 1000)));
    fs.appendFileSync("./weekly_reports/" + data.badgeGuildId + "/new/logs_" + (currentDate.getUTCDate() + "-" + (currentDate.getUTCMonth() + 1) + "-" + currentDate.getUTCFullYear()) + ".txt", data.content + "\n", 'utf8');
  }

  getMapFromJSON(jsonObject) {
      var finalMap = new Map();
      for (var elem in jsonObject) {
          if (typeof jsonObject[elem] != "object") { finalMap.set(elem, jsonObject[elem]); } else { finalMap.set(elem, this.getMapFromObject(jsonObject[elem])); }
      }
      return finalMap;
  }

  getMapFromObject(object) {
      var objectMap = new Map();
      for (var elem in object) {
          if (typeof object[elem] != "object") { objectMap.set(elem, object[elem]); } else { objectMap.set(elem, this.getMapFromObject(object[elem])); }
      }
      return objectMap;
  }

  getJSONFromMap(map) {
      this.fixTargetRolesStructure(map, false);

      var jsonObject = {};

      for (var key of map.keys()) {
          if (typeof map.get(key) != "object") { jsonObject[key] = map.get(key); } else { jsonObject[key] = this.getObjectFromMap(map.get(key)); }
      }

      return JSON.stringify(jsonObject);
  }

  getObjectFromMap(map) {
      var mapObject = {};
      for (var key of map.keys()) {
          if (typeof map.get(key) != "object") { mapObject[key] = map.get(key); } else { mapObject[key] = this.getObjectFromMap(map.get(key)); }
      }
      return mapObject;
  }

  getMapFullClone(map) {
      const finalMap = new Map();

      for (var key of map.keys()) {
          if (typeof map.get(key) != "object") { finalMap.set(key, map.get(key)); } else { finalMap.set(key, this.cloneMapObject(map.get(key))); }
      }

      return finalMap;
  }

  cloneMapObject(map) {
      const finalMap = new Map();
      for (var key of map.keys()) {
          if (typeof map.get(key) != "object") { finalMap.set(key, map.get(key)); } else { finalMap.set(key, this.cloneMapObject(map.get(key))); }
      }
      return finalMap;
  }

  fixTargetRolesStructure(settings, add) {
    if (!settings.has("dutyRoles")) { return; }
    var roles = settings.get("dutyRoles");
    for (var key of roles.keys()) {
        if (add) {
            roles.get(key).set("inServizio", []);
        } else {
            if (roles.get(key).has("inServizio")) { roles.get(key).delete("inServizio"); };
        }
    }
  }

}

module.exports = Utils
