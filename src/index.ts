'use strict';
// JS only module ( annoying but it needs to be like that)
const { Embeds: EmbedsMode, FieldsEmbed: FieldsEmbedMode } = require('discord-paginationembed');

import * as Discord from 'discord.js';
import { MessageEmbed } from 'discord.js';
import e621 from 'e621-api';
import Logger from 'colorful-log-levels';
// Get our config variables (as opposed to ENV variables)
import { ver, prod, debug, botToken, prefix, adminID } from './config';
import { logLevels } from 'colorful-log-levels/enums';

// Create an instance of a Discord client
const client = new Discord.Client();
// create a logger instance
const logger = new Logger('../logs', logLevels.error, true)
// create an e621 API instance
const wrapper = new e621('e621DiscordBot0.0.1', null, null, 3);

/*
The main goal of this bot right now is to get a
set of popular posts for e621 through the wrapped API

Eventually it should also allow a schedule to be set to post popular images of the day
*/

client.on('ready', () => {
    logger.info(`Connected to Discord.\nLogged in as ${client.user.username} (${client.user.id})`);
    client.user.setActivity(`Serving ${client.guilds.size} servers`);
});

client.on('guildCreate', guild => {
    // This event triggers when the bot joins a guild.
    logger.info(`New guild joined: ${guild.name} (id: ${guild.id}). This guild has ${guild.memberCount} members!`);
    client.user.setActivity(`Serving ${client.guilds.size} servers`);
});

client.on('guildDelete', guild => {
    // this event triggers when the bot is removed from a guild.
    logger.info(`Bot removed from: ${guild.name} (id: ${guild.id})`);
    client.user.setActivity(`Serving ${client.guilds.size} servers`);
});

// Create an event listener for messages
client.on('message', async message => {
    // This event will run on every single message received, from any channel or DM.

    // It's good practice to ignore other bots. This also makes your bot ignore itself
    if (message.author.bot) return;

    // Also good practice to ignore any message that does not start with our prefix, 
    if (message.content.indexOf(prefix) !== 0) return;

    // Here we separate our 'command' name, and our 'arguments' for the command. 
    const args = message.content.slice(prefix.length).trim().split(/ +/g);
    const command = args.shift().toLowerCase();

    switch (command) {
        case 'help':
            // Display the help file
            return helpCommandHandler(message, args);
        case 'ping':
            // Calculates ping between sending a message and editing it, giving a nice round-trip latency.
            // The second ping is an average latency between the bot and the websocket server (one-way, not round-trip)
            const m: any = await message.channel.send('Ping?');
            m.edit(`Pong! Latency is ${m.createdTimestamp - message.createdTimestamp}ms. API Latency is ${Math.round(client.ping)}ms`);
            break;
        case 'popular':
            return popularCommandHandler(message, args);
        default:
            // this maybe can be ignored or can given an error of unknown command
            return message.channel.send(`Uknown command: **${command}**`);
    }
});

client.on('error', async error => {
    logger.error(error);
    client.user.sendMessage(JSON.stringify(error), {
        reply: adminID
    });
});

// Log the bot in
client.login(botToken);

function popularCommandHandler(discordMessage: Discord.Message, args: string[]) {
    // parse for the arguments to choose the popularity enum
    logger.debug(`${args}`)
    if (!args) {
        // send a fancy embed message
        discordMessage.channel.send(``)
    }
    return wrapper.posts.getPopularPosts(0)
        .then((response) => {
            let embeds = [];
            for (let i = 0; i < response.length; ++i) {
                let embedPage = new Discord.RichEmbed().setImage(response[i].file_url);
                embeds.push(embedPage);
            }

            new EmbedsMode()
                .setArray(embeds)
                .setAuthorizedUser(discordMessage.author)
                .setChannel(discordMessage.channel)
                .showPageIndicator(true)
                .setPage(1)
                .build();
        })
}

function helpCommandHandler(discordMessage: Discord.Message, args: string[]) {
    return discordMessage.channel.send('Test');
}