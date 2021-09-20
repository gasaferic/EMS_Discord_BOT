const config = require('../config.json');
const ContextCommandBuilder = require('../ContextCommandBuilder.js');

module.exports = {
	data: new ContextCommandBuilder("Caccia dal Servizio", 2),
	async execute(interaction, badgeGuildManager) {
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


