'use strict';
// JS only module ( annoying but it needs to be like that)
const { Embeds: EmbedsMode, FieldsEmbed: FieldsEmbedMode } = require('discord-paginationembed');

import * as os from 'os';
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
    // Also good practice to ignore any message that does not start with the bot'ss prefix, 
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
        case 'stats':
            // admin-only stats command
            return statsCommandHandler(message, args)
        default:
            // if command character + unknown command is given we at least need to let the user know
            return message.channel.send(`Uknown command: **${command}**`);
    }
});

client.on('error', async error => {
    logger.error(error);
    client.user.sendMessage(JSON.stringify(error.message, null, 2), {
        reply: adminID
    });
});

// Log the bot in
client.login(botToken);

function helpCommandHandler(discordMessage: Discord.Message, args: string[]) {
    return discordMessage.channel.send('Test');
}

// TODO: have this take a daily/weekly/monthly arguments
function popularCommandHandler(discordMessage: Discord.Message, args: string[]) {
    // parse for the arguments to choose the popularity enum
    logger.debug(`${args}`);
    if (args.length == 0) {
        // send a fancy embed error message
        // TODO: make this error embed a callable function to autofill and return a special error embed
        let errorEmbed = new Discord.RichEmbed();
        errorEmbed.title = 'Error';
        errorEmbed.description = 'Please give an argument for the **popular** command(daily, weekly or monthly)';

        return discordMessage.channel.send(errorEmbed);
    }
    // try and pull an arg from the arguments list (after the first doesn't matter)
    let popularOption: number = 0;

    switch (args[0]) {
        case 'daily':
            popularOption = 0;
            break;
        case 'weekly':
            popularOption = 1;
            break;
        case 'monthly':
            popularOption = 2;
            break;
        default:
            let errorEmbed = new Discord.RichEmbed();
            errorEmbed.title = 'Error';
            errorEmbed.description = `Invalid popular command argument: ${args[0]}`;
            return discordMessage.channel.send(errorEmbed);
    }
    return wrapper.posts.getPopularPosts(popularOption)
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

function statsCommandHandler(discordMessage: Discord.Message, args: string[]) {
    // check if the user who called is an admin from the config file
    if (discordMessage.author.id == adminID) {
        // TODO: add more info to this like the destiny2 bot had
        return discordMessage.channel.send(
            `Version: ${ver} Running on server: ${os.type()} ${os.hostname()} ${os.platform()} ${os.cpus()[0].model}`);
    } else {
        // send a permission denied message
        logger.auth(
            `${discordMessage.author.username} (${discordMessage.author.id})
            tried to use the 'stats' command at ${new Date().toTimeString()}`)
        return discordMessage.channel.send(`Permission denied. Logging this access attempt.`);
    }
}