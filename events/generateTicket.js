const { PermissionsBitField, EmbedBuilder, ChannelType, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');

module.exports = {
    async createTicket(selectedValue, userName, description, interaction) {
        const guild = interaction.guild;
        let ticketChannel;

        const categoryId = '1346682561556119644'; 
        
        let permissionOverwrites = [
            { id: guild.roles.everyone, deny: [PermissionsBitField.Flags.ViewChannel] },
            { id: interaction.user.id, allow: [PermissionsBitField.Flags.ViewChannel] }
        ];

        try {

            if (selectedValue === 'report') {
                const staffRole = guild.roles.cache.find(role => role.id === '975455340256722995');
                if (staffRole) {
                    permissionOverwrites.push({ id: staffRole.id, allow: [PermissionsBitField.Flags.ViewChannel] });
                }
            }

            const category = guild.channels.cache.get(categoryId);

            ticketChannel = await guild.channels.create({
                name: `${selectedValue}-${interaction.user.username}`,
                type: ChannelType.GuildText,
                permissionOverwrites: permissionOverwrites,
                parent: category ? category.id : null 
            });

            const closeButton = new ButtonBuilder()
                .setCustomId('closeTicket')
                .setLabel('Cerrar Ticket')
                .setStyle(ButtonStyle.Danger)
                .setEmoji('🔒');

            const row = new ActionRowBuilder().addComponents(closeButton);

            const embed = new EmbedBuilder()
                .setColor('Random')
                .setTimestamp()
                .setTitle(`SparkingCraft System | Ticket ${selectedValue.charAt(0).toUpperCase() + selectedValue.slice(1)}`)
                .setDescription('Gracias por crear un ticket. Un miembro del equipo te atenderá lo antes posible.')
                .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true, size: 512 }))
                .addFields(
                    { name: 'Usuario del Juego:', value: userName},
                    { name: 'Descripción del Problema:', value: description}
                )
                .setFooter({ text: 'Para cerrar este ticket, usa el botón de abajo.' });

            await ticketChannel.send({ embeds: [embed], components: [row] });

            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({ content: `✅ Su ticket ha sido creado: <#${ticketChannel.id}>`, ephemeral: true });
            } else if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ content: `✅ Su ticket ha sido creado: <#${ticketChannel.id}>`, ephemeral: true });
            }
        } catch (error) {
            console.error('Error al crear el ticket:', error);
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({ content: `❌ Ocurrió un error mientras se creaba el ticket: ${error.message}`, ephemeral: true });
            } else if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ content: `❌ Ocurrió un error mientras se creaba el ticket: ${error.message}`, ephemeral: true });
            }
        }
    }
};