
import * as Discord from 'discord.js';
import e621 from 'e621-api';
import Logger from 'colorful-log-levels';
// Get our config variables (as opposed to ENV variables)
import { ver, prod, debug, botToken } from './config';
import { logLevels } from 'colorful-log-levels/enums';

// Create an instance of a Discord client
const client = new Discord.Client();
// create a logger instance
const logger = new Logger('../logs', logLevels.error, true)
// create an e621 API instance
const wrapper = new e621('e621DiscordBot0.0.1', null, null, 3);

client.on('ready', () => {
    logger.info(`Connected to Discord.\nLogged in as ${client.user.username} (${client.user.id})`)
});

// Create an event listener for messages
client.on('message', message => {
    // If the message is "ping"
    if (message.content === 'ping') {
        // Send "pong" to the same channel
        message.channel.send('pong');
    }
    if (message.content === 'test') {
        return wrapper.posts.getPopularPosts(1)
            .then((response) => {
                return message.channel.send(response[1].file_url);
            })
    }
});

// Log our bot in
client.login(botToken);