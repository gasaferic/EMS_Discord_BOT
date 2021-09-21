const config = require('../config.json');
const ContextCommandBuilder = require('../ContextCommandBuilder.js');

module.exports = {
	data: new ContextCommandBuilder("Caccia dal Servizio", 2),
	async execute(interaction, badgeGuildManager) {
		badgeGuildManager.getBadgeGuildById(interaction.guild.id).handleBadgeForceOff(interaction, interaction.options._hoistedOptions[0].value);
	},
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
    ]
};


