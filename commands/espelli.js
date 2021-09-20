const config = require('../config.json');
const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
	data: new SlashCommandBuilder()
        .setName('espelli')
        .setDescription("Serve a cacciare un utente dal servizio")
        .addUserOption(option =>
            option.setName('utente')
            .setDescription('Quale utente bisogna cacciare dal servizio')
            .setRequired(true)),
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
	async execute(interaction, badgeGuildManager) {
	},
};