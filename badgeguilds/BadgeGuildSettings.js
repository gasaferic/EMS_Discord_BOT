const Discord = require('discord.js');

class GuildSettings {
    settings = {};

    constructor(utils, settingsString) {
        this.utils = utils;
        this.settings = this.utils.getMapFromJSON(JSON.parse(settingsString));
        // console.log(this.settings)
        this.utils.fixTargetRolesStructure(this.settings, true);
        // console.log(this.getJSONString());
    }

    getSettings() {
        return this.settings;
    }

    get(key) {
        return this.settings.get(key);
    }

    set(key, value) {
        return this.settings.set(key, value);
    }

    getJSONString() {
        return this.utils.getJSONFromMap(this.getMapFullClone(this.settings));
    }
}

module.exports = GuildSettings
