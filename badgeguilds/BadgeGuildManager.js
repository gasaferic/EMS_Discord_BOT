const BadgeGuild = require('./BadgeGuild');
const BadgeGuildSettings = require('./BadgeGuildSettings');

const Utils = require('../Utils');

class BadgeGuildManager {

    constructor(client, mySQLManager, guildsData) {
        this.utils = new Utils();
        this.badgeGuilds = new Map();
        var count = 0;
        console.log("Loading guilds...");
        for (var guildData of guildsData) {
            this.badgeGuilds.set(guildData.guild_id, new BadgeGuild({ guildId: guildData.guild_id, client: client, settings: new BadgeGuildSettings(this.utils, guildData.guild_settings), mySQLManager: mySQLManager, utils: this.utils }));
            console.log("loaded guild", guildData.guild_id);
            count++;
        }
        console.log("Loaded " + count + " guilds");
    }

    getBadgeGuilds() {
        return this.badgeGuilds;
    }

    getBadgeGuildById(guildId) {
        return this.badgeGuilds.get(guildId);
    }

    doesBadgeGuildExist(badgeGuildId) {
        return this.badgeGuilds.has(badgeGuildId);
    }

}

module.exports = BadgeGuildManager