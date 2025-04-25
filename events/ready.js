const { ActivityType } = require('discord.js');

module.exports = {
    name: 'ready',
    once: true, 
    execute(client) {
        console.log(`Listo! Conectado como ${client.user.tag}`);
        client.user.setPresence({
            activities: [{
                name: 'SparkingCraft.com',
                type: ActivityType.Streaming, 
            }],
            status: 'online',
        });
    },
};