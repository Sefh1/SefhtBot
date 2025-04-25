const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const panel = require('../events/panel.js');

const processedInteractions = new Set();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('sendpanel')
        .setDescription('Envía el panel tickets a un canal')
        .addChannelOption(option =>
            option.setName('canal')
                .setDescription('Selecciona un canal en el que enviar el panel')
                .setRequired(true)),
    async execute(interaction) {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return await interaction.reply({ 
                content: 'No tienes permisos suficientes para usar este comando.', 
                ephemeral: true 
            });
        }

        const interactionId = interaction.id;
        if (processedInteractions.has(interactionId)) {
            console.log(`Interacción ${interactionId} ya procesada, ignorando duplicado`);
            return;
        }
        
        processedInteractions.add(interactionId);
        
        setTimeout(() => {
            processedInteractions.delete(interactionId);
        }, 10000);
        
        const channel = interaction.options.getChannel('canal'); 
        const channelId = channel.id;

        console.log(`Ejecutando comando sendpanel para el canal #${channel.name} (${channelId}) a las ${new Date().toISOString()}`);
        
        await interaction.deferReply({ ephemeral: true });

        try {
            await panel.sendToChannel(channelId, interaction.client); 
            await interaction.editReply({ content: `Mensaje enviado correctamente al canal: <#${channel.id}>` });
        } catch (error) {
            console.error(`Error al enviar panel: ${error.message}`);
            console.error(error.stack);
            
            if (!interaction.replied && !interaction.deferred) {
                await interaction.editReply({ 
                    content: `Hubo un problema al enviar el mensaje al panel. Error: ${error.message}`,
                });
            }
        }
    },
};