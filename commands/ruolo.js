const config = require('../config.json');
const { SlashCommandBuilder, SlashCommandSubcommandBuilder, SlashCommandSubcommandGroupBuilder } = require('@discordjs/builders');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('ruolo')
		.setDescription("Per gestire i ruoli dei timbri")
        .addSubcommand(new SlashCommandSubcommandBuilder()
            .setName('aggiungi')
            .setDescription('Serve ad aggiugere un ruolo ai timbri')
            .addRoleOption(option =>
                option.setName('ruolo')
                .setDescription('Il ruolo da aggiungere')
                .setRequired(true)))
        .addSubcommand(new SlashCommandSubcommandBuilder()
            .setName('rimuovi')
            .setDescription('Serve a rimuovere un ruolo dai timbri')
            .addRoleOption(option =>
                option.setName('ruolo')
                .setDescription('Il ruolo da rimuovere')
                .setRequired(true))),
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
    if (interaction.guild.roles.cache.get(interaction.options._hoistedOptions[0].value) == undefined) {
      interaction.guild.roles.fetch(interaction.options._hoistedOptions[0].value).then(role => {
        this.manageRole(interaction, role, badgeGuildManager);
      })
    } else {
      this.manageRole(interaction, interaction.guild.roles.cache.get(interaction.options._hoistedOptions[0].value), badgeGuildManager);
    }
	},
  async manageRole(interaction, role, badgeGuildManager) {
    const badgeGuild = badgeGuildManager.getBadgeGuildById(interaction.guild.id);
    if (interaction.options._subcommand === "aggiungi") {
      badgeGuild.addRole(role, interaction);
    } else if (interaction.options._subcommand  === "rimuovi") {
      badgeGuild.removeRole(role, interaction);
    }
  }
};