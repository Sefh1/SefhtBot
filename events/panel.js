const { EmbedBuilder, StringSelectMenuBuilder, ActionRowBuilder } = require('discord.js');

// Set para controlar mensajes enviados recientemente y evitar duplicados
const sentPanels = new Set();

module.exports = {
    async sendToChannel(channelId, client) {
        // Verificar si ya se envió un panel a este canal recientemente
        if (sentPanels.has(channelId)) {
            console.log(`Panel ya enviado al canal ${channelId}, evitando duplicado`);
            return;
        }
        
        // Marcar este canal como procesado
        sentPanels.add(channelId);
        
        // Eliminar del set después de 5 segundos para permitir futuros envíos
        setTimeout(() => {
            sentPanels.delete(channelId);
            console.log(`Canal ${channelId} liberado para nuevos envíos de panel`);
        }, 5000);
        
        const channel = client.channels.cache.get(channelId);
        if (channel) {
            const embed = new EmbedBuilder()
                .setColor('Random') 
                .setTitle('SparkingCraft Network | Tickets')
                .setDescription('Para obtener soporte, reportar a un usuario y otras cosas diversas,\n abra un ticket haciendo clic en el botón a continuación.')

            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId('ticketOptions') 
                .setPlaceholder('Selecciona una opción')
                .addOptions([
                    {
                        label: '📩 | Soporte General',
                        value: 'soporte',
                    },
                    {
                        label: '💸 | ¿Ayuda con una Compra?',
                        value: 'compra',
                    },
                    {
                        label: '🔒 | Apelar una Sanción',
                        value: 'apelar',
                    },
                    {
                        label: '🚷 | Reportar a un Usuario',
                        value: 'report'
                    }
                ]);

            const row = new ActionRowBuilder().addComponents(selectMenu);

            await channel.send({ embeds: [embed], components: [row] });
            console.log(`Mensaje enviado al canal ${channelId}`);
        } else {
            console.error(`No se pudo encontrar el canal con ID: ${channelId}`);
        }
    }
};