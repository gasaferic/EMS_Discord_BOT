const Utils = require('../Utils');
const utils = new Utils();
const config = require('../config.json');
const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('report')
		.setDescription("Serve a creare un report delle ore in base al periodo che si sceglie.")
        .addStringOption(option =>
            option.setName('periodo')
                .setDescription('Il periodo da richiedere per un report.')
                .setRequired(true)
                .addChoice('Giornaliero', 'daily')
                .addChoice('Settimanale', 'weekly')
		.addChoice('Mensile', 'monthly')
		.addChoice('Annuale', 'yearly')),
    permissions: [
        {
            id: config.roles.everyone.id,
            type: 'ROLE',
            permission: false
        },
        {
            id: config.roles.admin.id,
            type: 'ROLE',
            permission: true
        }
    ],
    spamDelay: 5,
    timelapse: {
        "daily": [1, "Giornaliero"],
        "weekly": [7, "Settimanale"],
        "monthly": [30, "Mensile"],
        "yearly": [365, "Annuale"],
    },
    async execute(interaction, badgeGuildManager) {
	    // if (interaction.options._hoistedOptions[0].value != "weekly") { await interaction.reply({ embeds: [utils.getEmbedMessage({ colorHex: "#c91212", title: "Amministrazione", description: "Questa periodo non è ancora stato abilitato, utilizza il periodo \"Settimanale\" per il momento (è consigliato utilizzarlo a fine settimana)", timestamp: true })] , ephemeral: true }); return; }
    	var currentBadgeGuild = badgeGuildManager.getBadgeGuildById(interaction.guild.id);
        var currentBadgeGuildRoles = currentBadgeGuild.getBadgeGuildSettings().get("dutyRoles");
        
        var date = new Date(Date.now() + utils.getTimezone() * (60 * 60 * 1000));
        var datesRange = utils.getDatesRange(utils.getPastDate(date, this.timelapse[interaction.options._hoistedOptions[0].value][0]), date);

        interaction.deferReply({ ephemeral: false, fetchReply: true }).then(async function (reply) {
            var report = new Map();
            for (var date of datesRange) {
                if (currentBadgeGuild.getParser().hasParsedDate(date)) {
                    report.set(date, currentBadgeGuild.getParser().getParsedDate(date));
                }
            }
            if (report.size < this.timelapse[interaction.options._hoistedOptions[0].value][0]) { await interaction.editReply({ embeds: [utils.getEmbedMessage({ colorHex: "#fcc603", title: "Amministrazione", description: "Non ci sono abbastanza dati per il periodo selezionato (" + this.timelapse[interaction.options._hoistedOptions[0].value][0] + "g)", timestamp: true })] }); return; }
            var report = currentBadgeGuild.getParser().unifyDailyReports(report);
            var computedHours = currentBadgeGuild.getParser().getComputedHours(report);
            
            const embedFields = [];
            for (var roleKey of currentBadgeGuildRoles.keys()) {
                if (computedHours.has(roleKey)) {
                    embedFields.push({ name: currentBadgeGuildRoles.get(roleKey).get("name") + " (Stipendio " + currentBadgeGuildRoles.get(roleKey).get("paycheck") + " €/ora)", value: this.getUsersHoursText(computedHours.get(roleKey), currentBadgeGuildRoles.get(roleKey).get("paycheck"))  || "Nessuno ha lavorato per questo ruolo" })
                } else {
                    embedFields.push({ name: currentBadgeGuildRoles.get(roleKey).get("name") + " (Stipendio " + currentBadgeGuildRoles.get(roleKey).get("paycheck") + " €/ora)", value: "Nessuno ha lavorato per questo ruolo" })
                }
            }

            // Per DEBUG
            /*for (var roleKey of computedHours.keys()) {
                if (computedHours.has(roleKey)) {
                    embedFields.push({ name: roleKey + " (Stipendio " + 1000 + " €/ora)", value: this.getUsersHoursText(computedHours.get(roleKey), 1000) || "Nessuno ha lavorato per questo ruolo" })
                }
            }*/

            interaction.editReply({ embeds: [utils.getEmbedMessage({ colorHex: "#3270ed", title: "Amministrazione", description: "Ecco il resoconto " + this.timelapse[interaction.options._hoistedOptions[0].value][1] + ":", fields: embedFields, timestamp: true })] });

        }.bind(this));
    },
    getUsersHoursText(users, paycheck) {
        var usersHoursText = "";
        const sortedUsers = new Map([...users.entries()].sort((firstUserId, secondUserId) => firstUserId - secondUserId));
        for (var user of sortedUsers) {
            if (user[1] < 60000) { continue; }
            var dutyTime = utils.getTimeFromMillis(user[1])
	        var formattedTime = utils.getFormattedTime(dutyTime, true);
            usersHoursText += "<@" + user[0] + "> " + (formattedTime.days.startsWith("0") ? " " : formattedTime.days + " ") + (formattedTime.hours.startsWith("0") ? " " : formattedTime.hours + " ") + formattedTime.minutes + " " + (((dutyTime.days * 24) * paycheck) + (dutyTime.hours * paycheck) + Math.round((dutyTime.minutes / 60) * paycheck)) + " €\n";
        }
	    return usersHoursText;
    }
};
