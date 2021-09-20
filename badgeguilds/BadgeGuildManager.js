const BadgeGuild = require('./BadgeGuild');
const BadgeGuildSettings = require('./BadgeGuildSettings');

class BadgeGuildManager {

    constructor(client, mySQLManager, guildsData) {
        this.badgeGuilds = new Map();
        console.log("loading guilds");
        for (var guildData of guildsData) {
            this.badgeGuilds.set(guildData.guild_id, new BadgeGuild({ guildId: guildData.guild_id, client: client, settings: new BadgeGuildSettings(guildData.guild_settings), mySQLManager: mySQLManager}));
            console.log("loaded guild", guildData.guild_id);
        }
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