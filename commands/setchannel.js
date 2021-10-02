const Utils = require('../Utils');
const utils = new Utils();
const config = require('../config.json');
const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('setchannel')
		.setDescription("Serve a impostare i canali dei badge")
        .addStringOption(option =>
            option.setName('tipocanale')
                .setDescription('Quale tipo di canale bisogna associare a questo canale?')
                .setRequired(true)
                .addChoice('Gestione Timbro', 'badgeChannel')
                .addChoice('Informazioni Servizio', 'logChannel'))
            .addChannelOption(option =>
                option.setName('canale')
                    .setDescription('Canale in questione')
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
    channelOptions: {
        "badgeManager": "Gestione Timbro",
        "logChannel": "Informazioni Servizio"
    },
	async execute(interaction, badgeGuildManager) {
        // console.log(interaction.options._hoistedOptions)
        if (interaction.options._hoistedOptions[1].channel.type != "GUILD_TEXT") { await interaction.reply({ embeds: [utils.getEmbedMessage({ colorHex: "#c91212", title: "Amministrazione", description: "Il canale selezionato non è un canale testuale!", timestamp: true })] , ephemeral: true }); return; }  
        const badgeGuild = badgeGuildManager.getBadgeGuildById(interaction.guild.id);
        if (badgeGuild.getBadgeGuildSettings().get(interaction.options._hoistedOptions[0].value) == interaction.options._hoistedOptions[1].value) { await interaction.reply({ embeds: [utils.getEmbedMessage({ colorHex: "#c91212", title: "Amministrazione", description: "Questo canale è già stato impostato per " + this.channelOptions[interaction.options._hoistedOptions[0].value], timestamp: true })] , ephemeral: true }); return; }  
        badgeGuild.getBadgeGuildSettings().set(interaction.options._hoistedOptions[0].value, interaction.options._hoistedOptions[1].value);
        badgeGuild.updateSettings();
        interaction.reply({ embeds: [utils.getEmbedMessage({ colorHex: "#32a852", title: "Amministrazione", description: "Impostato il canale " + interaction.options._hoistedOptions[1].channel.name + " per " + this.channelOptions[interaction.options._hoistedOptions[0].value], timestamp: true })] , ephemeral: true });
    },
};
