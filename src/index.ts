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
import { createRichError } from './coomon/createRichError';
// Discord command components
import { statsCommandHandler } from './commands/stats';

// Create an instance of a Discord client
const client = new Discord.Client();
// create a logger instance
const logger = new Logger('../logs', logLevels.error, true);
// create an e621 API instance
const wrapper = new e621('e621DiscordBot0.0.1', null, null, 3);

/*
The main goal of this bot right now is to get a
set of popular posts for e621 through the wrapped API

Eventually it should also allow a schedule to be set to post popular images of the day

TODO: get a basic scheduler working as well as a way to find when new e621 popular art
is posted
TODO: allow a server to &subscribe a channel to popular updates
TODO: On guild join, find the first server where the bot can send messages to or a 'geveral'
channel so we can tell users how to use the bot
TODO: move the bot to a class like we did with WFPatchBot
TODO: split out these functions into separate files if not one huge class
TODO: do different things on prod vs. devel booleans
*/

client.on('ready', () => {
    logger.info(`Connected to Discord.\nLogged in as ${client.user.username} (${client.user.id})`);
    client.user.setActivity(`Serving ${client.guilds.size} servers`);
});

client.on('guildCreate', guild => {
    // This event triggers when the bot joins a guild.
    logger.info(`New guild joined: ${guild.name} (id: ${guild.id}). This guild has ${guild.memberCount} members!`);
    client.user.setActivity(`Serving ${client.guilds.size} servers`);
    // TODO: send a message to a channel parse from the guild info about the bot and what it can do
});

client.on('guildDelete', guild => {
    // this event triggers when the bot is removed from a guild.
    logger.info(`Bot removed from: ${guild.name} (id: ${guild.id})`);
    client.user.setActivity(`Serving ${client.guilds.size} servers`);
});

// This event will run on every single message received, from any channel or DM.
client.on('message', async message => {
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
            return statsCommandHandler(message, client, logger);
        case 'timetest':
            return timeCommandHandler(message, args);
        default:
            // if command character + unknown command is given we at least need to let the user know
            let errorEmbed = createRichError(`Uknown command: **${command}**`);
            return message.channel.send(errorEmbed);
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
    // this is where a user should be able to get a set of commands and help
    // on a specific command if given
    return discordMessage.channel.send('Test');
}

function popularCommandHandler(discordMessage: Discord.Message, args: string[]) {
    // parse for the arguments to choose the popularity enum
    if (args.length == 0) {
        // send an embed error message
        let errorEmbed = createRichError('Please give an argument for the **popular** command(daily, weekly or monthly)');
        return discordMessage.channel.send(errorEmbed);
    }
    // try and pull an arg from the arguments list (after the first arg it doesn't matter)
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
            let errorEmbed = createRichError(`Invalid popular command argument: ${args[0]}`);
            return discordMessage.channel.send(errorEmbed);
    }

    return wrapper.posts.getPopularPosts(popularOption)
        .then((response) => {
            let embeds = [];
            for (let i = 0; i < response.length; ++i) {
                let embedPage = new Discord.RichEmbed();
                embedPage.setImage(response[i].file_url);
                embedPage.setThumbnail(response[i].preview_url);
                embedPage.addField('Direct Link', response[i].file_url, false);
                embedPage.addField('Post Link', `https://e621.net/post/show/${response[i].id}`, false);
                embedPage.author = {
                    name: client.user.username,
                    url: 'https://e621.net',
                    icon_url: client.user.defaultAvatarURL
                };
                embeds.push(embedPage);
            }

            new EmbedsMode()
                .setArray(embeds)
                .setAuthorizedUser(discordMessage.author)
                .setChannel(discordMessage.channel)
                .showPageIndicator(true)
                .setPage(1)
                .setColor(3447003)
                .build();
        });
}

function timeCommandHandler(discordMessage: Discord.Message, args: string[]) {
    // create an interval to send a message (testing)
    setInterval(() => {
        discordMessage.channel.send('Beh' + new Date().toTimeString())
    }, 2000)
}