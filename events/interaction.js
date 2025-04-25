const {
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
    ChannelType,
    Colors,
} = require('discord.js');
const generateTicket = require('../events/generateTicket.js');

module.exports = {
    name: 'interactionCreate',
    async execute(interaction, client) {
        if (interaction.isCommand()) {
            const command = client.commands.get(interaction.commandName);
            if (!command) return;

            try {
                await command.execute(interaction);
            } catch (error) {
                console.error(`Error al ejecutar el comando ${interaction.commandName}:`, error);
                try {
                    if (interaction.deferred || interaction.replied) {
                        await interaction.editReply({
                            content: 'Hubo un error al ejecutar ese comando.',
                            ephemeral: true,
                        });
                    } else {
                        await interaction.reply({
                            content: 'Hubo un error al ejecutar ese comando.',
                            ephemeral: true,
                        });
                    }
                } catch (replyError) {
                    console.error('Error al responder con mensaje de error:', replyError);
                }
            }
        }

        if (interaction.isStringSelectMenu() && interaction.customId === 'ticketOptions') {
            try {
                const selectedValue = interaction.values[0];
                const username = interaction.user.username;

                const existingChannel = interaction.guild.channels.cache.find(channel =>
                    channel.name.includes(username) && channel.type === ChannelType.GuildText
                );

                if (existingChannel) {
                    return interaction.reply({ 
                        content: `❌ Ya tienes un ticket abierto: <#${existingChannel.id}>`, 
                        ephemeral: true 
                    });
                }

                const modal = new ModalBuilder()
                    .setCustomId(`ticketModal-${selectedValue}`)
                    .setTitle('Detalles del Ticket');

                const userNameInput = new TextInputBuilder()
                    .setCustomId('userNameInput')
                    .setLabel('Nombre de Usuario')
                    .setStyle(TextInputStyle.Short);

                const problemInput = new TextInputBuilder()
                    .setCustomId('problemInput')
                    .setLabel('Descripción del Problema')
                    .setStyle(TextInputStyle.Paragraph);

                const row1 = new ActionRowBuilder().addComponents(userNameInput);
                const row2 = new ActionRowBuilder().addComponents(problemInput);

                modal.addComponents(row1, row2);
                await interaction.showModal(modal);
                setTimeout(async () => {
                    try {
                        const resetMenu = new StringSelectMenuBuilder()
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
                
                        const row = new ActionRowBuilder().addComponents(resetMenu);
                
                        await interaction.message.edit({
                            embeds: interaction.message.embeds,
                            components: [row]
                        });
                
                        console.log('✅ Menú restablecido tras 2 segundos');
                    } catch (error) {
                        console.error('❌ Error al restablecer el menú:', error);
                    }
                }, 2000);
            } catch (error) {
                console.error('Error al mostrar el modal:', error);
            }
        }

        if (interaction.isModalSubmit() && interaction.customId.startsWith('ticketModal-')) {
            const selectedValue = interaction.customId.split('-')[1];
            const userName = interaction.fields.getTextInputValue('userNameInput');
            const description = interaction.fields.getTextInputValue('problemInput');

            try {
                await generateTicket.createTicket(selectedValue, userName, description, interaction);
            } catch (error) {
                console.error('Error al crear el ticket:', error);
                try {
                    if (interaction.deferred || interaction.replied) {
                        await interaction.editReply({
                            content: `❌ Ocurrió un error al procesar su ticket: ${error.message}`,
                            ephemeral: true,
                        });
                    } else {
                        await interaction.reply({
                            content: `❌ Ocurrió un error al procesar su ticket: ${error.message}`,
                            ephemeral: true,
                        });
                    }
                } catch (replyError) {
                    console.error('Error al responder con mensaje de error:', replyError);
                }
            }
        }

        if (interaction.isButton() && interaction.customId === 'closeTicket') {
            try {
                const ticketChannel = interaction.channel;

                if (!ticketChannel || !ticketChannel.isTextBased()) {
                    console.error('No se puede enviar el mensaje, ticketChannel no es válido o no es un canal de texto.');
                    return await interaction.reply({ 
                        content: 'Ocurrió un error al intentar cerrar el ticket.', 
                        ephemeral: true 
                    });
                }
                const now = new Date();
                const fecha = `<t:${Math.floor(now.getTime() / 1000)}:f>`;
                const closeEmbed = new EmbedBuilder()
                    .setColor(Colors.Red)
                    .setTitle('Ticket Cerrado')
                    .setDescription(`El ticket fue cerrado por ${interaction.user.username}.`)
                    .addFields({ name: 'Fecha', value: fecha })
                    .setFooter({ text: 'Gracias por tu paciencia.' });

                const reopenButton = new ButtonBuilder()
                    .setCustomId('reopenTicket')
                    .setLabel('Reabrir Ticket')
                    .setStyle(ButtonStyle.Primary);

                const deleteButton = new ButtonBuilder()
                    .setCustomId('deleteTicket')
                    .setLabel('Eliminar Ticket')
                    .setStyle(ButtonStyle.Danger);

                const row = new ActionRowBuilder().addComponents(reopenButton, deleteButton);
                const closedCategoryId = '1346682298598166659'; 

                await ticketChannel.setParent(closedCategoryId);
                await ticketChannel.send({ embeds: [closeEmbed], components: [row] });
                //await ticketChannel.send('Este canal será eliminado en 5 minutos. Si deseas reabrirlo, usa el botón correspondiente.');

                await interaction.deferUpdate();

                setTimeout(async () => {
                    try {
                        const channelExists = client.channels.cache.get(ticketChannel.id);
                        if (channelExists) {
                            await ticketChannel.delete();
                        }
                    } catch (deleteError) {
                        console.error('Error al eliminar el canal después del tiempo de espera:', deleteError);
                    }
                }, 300000); 
            } catch (error) {
                console.error('Error al cerrar el ticket:', error);
                try {
                    if (!interaction.replied && !interaction.deferred) {
                        await interaction.reply({ 
                            content: 'Ocurrió un error al intentar cerrar el ticket.', 
                            ephemeral: true 
                        });
                    }
                } catch (replyError) {
                    console.error('Error al responder con mensaje de error:', replyError);
                }
            }
        }

        if (interaction.isButton() && interaction.customId === 'reopenTicket') {
            try {
                const ticketChannel = interaction.channel;

                if (!ticketChannel || !ticketChannel.isTextBased()) {
                    console.error('No se puede enviar el mensaje, ticketChannel no es válido o no es un canal de texto.');
                    return await interaction.reply({ 
                        content: 'Ocurrió un error al intentar reabrir el ticket.', 
                        ephemeral: true 
                    });
                }

                await ticketChannel.setParent('1346682561556119644'); 
                await ticketChannel.send(`El ticket ha sido reabierto por ${interaction.user.username}.`);
                await interaction.deferUpdate();
            } catch (error) {
                console.error('Error al reabrir el ticket:', error);
                try {
                    if (!interaction.replied && !interaction.deferred) {
                        await interaction.reply({ 
                            content: 'Ocurrió un error al intentar reabrir el ticket.', 
                            ephemeral: true 
                        });
                    }
                } catch (replyError) {
                    console.error('Error al responder con mensaje de error:', replyError);
                }
            }
        }

        if (interaction.isButton() && interaction.customId === 'deleteTicket') {
            try {
                const ticketChannel = interaction.channel;
                
                if (!ticketChannel || !ticketChannel.isTextBased()) {
                    console.error('No se puede enviar el mensaje, ticketChannel no es válido o no es un canal de texto.');
                    return await interaction.reply({ 
                        content: 'Ocurrió un error al intentar eliminar el ticket.', 
                        ephemeral: true 
                    });
                }
                
                await interaction.deferUpdate();

                await ticketChannel.send('Guardando transcripción del ticket. El canal se eliminará en 5 segundos...');
                
                const discordTranscripts = require('discord-html-transcripts');
                const transcript = await discordTranscripts.createTranscript(ticketChannel, {
                    limit: 1000, 
                    filename: `ticket-${ticketChannel.name}.html`,
                    saveImages: true,
                    footerText: 'Sistema de tickets - Transcripción guardada'
                });
                
                const logsChannel = client.channels.cache.get('1346681712288993310'); 
                if (logsChannel) {
                    await logsChannel.send({
                        content: `Transcripción del ticket ${ticketChannel.name}`,
                        files: [transcript]
                    });
                }
                
                const channelName = interaction.channel.name;
                const username = channelName.split('-').slice(1).join('-'); 
                
                interaction.guild.members.fetch().then(members => {
                    const member = members.find(m => m.user.username === username);
                    if (member) {
                        console.log(`ID del usuario: ${member.user.id}`);
                
                        try {
                            const embed = new EmbedBuilder()
                                .setColor("Random")
                                .setTitle("SparkingCraft | Ticket System")
                                .setDescription(`Aquí tienes una copia de tu ticket ${channelName} \n**Cerrado por**: ${interaction.user.username}`)
                                .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 512 }))
                                .setTimestamp()
                                .setFooter({ text: member.guild.name, iconURL: member.guild.iconURL() })
                            member.user.send({ 
                                embeds: [embed]
                            });
                            member.user.send({
                                files: [transcript]
                            });
                            console.log('✅ Transcripción enviada al usuario.');
                        } catch (dmError) {
                            console.error('❌ No se pudo enviar la transcripción al usuario:', dmError);
                        }
                    } else {
                        console.log('❌ No se encontró al usuario.');
                    }
                }).catch(console.error);


                setTimeout(async () => {
                    try {
                        const channelExists = client.channels.cache.get(ticketChannel.id);
                        if (channelExists) {
                            await ticketChannel.delete();
                        }
                    } catch (deleteError) {
                        console.error('Error al eliminar el canal después del tiempo de espera:', deleteError);
                    }
                }, 5000);
                
            } catch (error) {
                console.error('Error al eliminar el ticket:', error);
                try {
                    if (!interaction.replied && !interaction.deferred) {
                        await interaction.reply({ 
                            content: 'Ocurrió un error al intentar eliminar el ticket.', 
                            ephemeral: true 
                        });
                    }
                } catch (replyError) {
                    console.error('Error al responder con mensaje de error:', replyError);
                }
            }
        }
    },
}