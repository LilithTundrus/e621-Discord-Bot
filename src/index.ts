
import * as Discord from 'discord.js';
import e621 from 'e621-api';
import Logger from 'colorful-log-levels';
// Get our config variables (as opposed to ENV variables)
import { ver, prod, debug, botToken, prefix } from './config';
import { logLevels } from 'colorful-log-levels/enums';

// Create an instance of a Discord client
const client = new Discord.Client();
// create a logger instance
const logger = new Logger('../logs', logLevels.error, true)
// create an e621 API instance
const wrapper = new e621('e621DiscordBot0.0.1', null, null, 3);

client.on('ready', () => {
    logger.info(`Connected to Discord.\nLogged in as ${client.user.username} (${client.user.id})`);
    client.user.setPresence({
        status: 'online',
        game: { name: 'e621', },
    })
});

// Create an event listener for messages
client.on('message', async message => {
    // This event will run on every single message received, from any channel or DM.

    // It's good practice to ignore other bots. This also makes your bot ignore itself
    // and not get into a spam loop
    if (message.author.bot) return;

    // Also good practice to ignore any message that does not start with our prefix, 
    // which is set in the configuration file.
    if (message.content.indexOf(prefix) !== 0) return;

    // Here we separate our "command" name, and our "arguments" for the command. 
    // e.g. if we have the message "+say Is this the real life?" , we'll get the following:
    // command = say
    // args = ["Is", "this", "the", "real", "life?"]
    const args = message.content.slice(prefix.length).trim().split(/ +/g);
    const command = args.shift().toLowerCase();

    if (command === "ping") {
        // Calculates ping between sending a message and editing it, giving a nice round-trip latency.
        // The second ping is an average latency between the bot and the websocket server (one-way, not round-trip)
        const m: any = await message.channel.send("Ping?");
        m.edit(`Pong! Latency is ${m.createdTimestamp - message.createdTimestamp}ms. API Latency is ${Math.round(client.ping)}ms`);
    }

});

// Log our bot in
client.login(botToken);