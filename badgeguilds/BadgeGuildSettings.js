const Discord = require('discord.js');

class GuildSettings {
    settings = {};

    constructor(settingsString) {
        // console.log(settingsString)
        this.settings = JSON.parse(settingsString);
        this.fixTargetRolesStructure();
    }

    fixTargetRolesStructure() {
        for (var elem of this.getValue("dutyRoles")) {
            this.addFieldToElem(elem, "inServizio", [])
        }
    }

    addFieldToElem(elem, field, value) {
        if (elem[field] == undefined) {
            elem[field] = value;
        }
    }

    getValue(key) {
        return this.settings[key];
    }

    setValue(key, value) {
        this.settings[key] = value;
    }

    getJSONString() {
        return JSON.stringify(this.settings);
    }
}

module.exports = GuildSettings