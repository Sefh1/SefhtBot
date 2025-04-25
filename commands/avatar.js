const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('avatar')
        .setDescription('Envía el avatar de un usuario')
        .addUserOption(option =>
            option.setName('usuario')
                .setDescription('El usuario cuyo avatar quieres ver')
                .setRequired(true)),
    async execute(interaction) {
        const user = interaction.options.getUser('usuario');
        if (user) {
            const embed = new EmbedBuilder()
                .setTitle(`Avatar de ${user.username}`)
                .setImage(user.displayAvatarURL({ dynamic: true, size: 512 }))
                .setColor("Random")
                .setThumbnail()
            await interaction.reply({ embeds: [embed] });
        } else {
            await interaction.reply('No se encontró el usuario.');
        }
    },
};