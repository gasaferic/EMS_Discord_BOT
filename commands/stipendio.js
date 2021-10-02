const config = require('../config.json');
const { SlashCommandBuilder, SlashCommandSubcommandBuilder, SlashCommandSubcommandGroupBuilder } = require('@discordjs/builders');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('stipendio')
		.setDescription("Per gestire gli stipendi associati ai ruoli dell'ospedale")
      .addRoleOption(option =>
        option.setName('ruolo')
        .setDescription('Il ruolo a cui modificare lo stipendio')
        .setRequired(true))
      .addIntegerOption(option =>
        option.setName('stipendio')
        .setDescription('Lo stipendio da impostare')
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
	    badgeGuildManager.getBadgeGuildById(interaction.guild.id).updateRolePaycheck(interaction.options._hoistedOptions[0].value, interaction.options._hoistedOptions[1].value, interaction);
	},
};
