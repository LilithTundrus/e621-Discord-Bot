'use strict';
// npm package requires
import * as Discord from 'discord.js';
import e621 from 'e621-api';
import Logger from 'colorful-log-levels';
import { logLevels } from 'colorful-log-levels/enums';
import * as path from 'path';

// Get our config variables (as opposed to ENV variables)
import {
    ver, prod, debug,
    botToken, prefix,
    adminID, e621UserAgent
} from './config';

// Embed templates
import { createRichError } from './coomon/createRichError';
import { createRichEmbed } from './coomon/createRichEmbed';
// Discord command components
import { statsCommandHandler } from './commands/stats';
import { helpCommandHandler } from './commands/help';
import { popularCommandHandler } from './commands/popular';
import * as storage from './storageController'
import { initScheduler, addChannelToScheduler } from './scheduler';

// Create an instance of a Discord client
const client = new Discord.Client();
// create a logger instance
const logger = new Logger('../logs', logLevels.error, true);
// create an e621 API instance
const wrapper = new e621(e621UserAgent, null, null, 3);

/*
The main goal of this bot right now is to get a
set of popular posts for e621 through the wrapped API
 
Eventually it should also allow a schedule to be set to post popular images of the day
 
TODO: get a basic scheduler working as well as a way to find when new e621 popular art
is posted
TODO: allow a server to &subscribe a channel to popular updates
TODO: On guild join, find the first server where the bot can send messages to or a 'geveral'
channel so we can tell users how to use the bot
TODO: do different things on prod vs. devel booleans
TODO: update DB to support all of the tables we'll eventually need
TODO: Cretae a more robust scheduler
TODO: figure out the design for this logically on paper
TODO: Add a 'search' command -- that'd be really useful
*/

client.on('ready', () => {
    storage.initDB(logger);
    // storage.removeChannelFromDB('339847113888497665')
    storage.getAllChannels()
        .then((results) => console.log(results))
    // this is where we should start the intervals of each server by reading a file
    initScheduler(client, wrapper);
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
    // flush all channels the guild had registered
    guild.channels.forEach((channel) => {
        return storage.removeChannelFromDB(channel.id);
        // TODO: we also need to de-init the scheduler for the cahnnels
    })
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
            return helpCommandHandler(message, args);
        case 'ping':
            // Calculates ping between sending a message and editing it, giving a nice round-trip latency.
            // The second ping is an average latency between the bot and the websocket server (one-way, not round-trip)
            const m: any = await message.channel.send('Ping?');
            m.edit(`Pong! Latency is ${m.createdTimestamp - message.createdTimestamp}ms. API Latency is ${Math.round(client.ping)}ms`);
            break;
        case 'popular':
            return popularCommandHandler(message, args, client, wrapper);
        case 'stats':
            return statsCommandHandler(message, client, logger);
        case 'setchannel':
            return channelTest(message, args);
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

async function channelTest(discordMessage: Discord.Message, args: string[]) {
    /* Pseudocode outline
        get channel ID
        let the user know the channel has been added
        get the 'inital' set of images for that channel
        add set of images to that user's/channel's cache
        every X minutes, check against each user's cache for new popular items
        (eventually support a blacklist)
    */
    // Send a 'processing' embed
    let infoMessage = createRichEmbed('Info', 'Please wait....');
    const m: any = await discordMessage.channel.send(infoMessage);
    // Make sure the user isn't already registered
    storage.checkIfChannelIsRegistered(discordMessage.channel.id)
        .then((isRegistered) => {
            if (isRegistered) {
                m.edit(createRichEmbed('Error', 'You are already subscribed'));
            } else {
                // add the user (and the array of 'current' images/the popular results first )
                storage.addChannelToDB(discordMessage.channel.id);
                // add them to the scheduler 
                addChannelToScheduler(client, wrapper, discordMessage.channel.id)
                m.edit(createRichEmbed('Info', 'Done! This channel will now receive new e621 popular posts'));
                //  we need to re-init the scheduler now
            }
        })
        .catch((error: Error) => {
            logger.error(error);
            client.user.sendMessage(JSON.stringify(error.message, null, 2), {
                reply: adminID
            });
        });
}