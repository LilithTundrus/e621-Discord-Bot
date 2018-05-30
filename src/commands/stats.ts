import * as Discord from 'discord.js';
import * as os from 'os';
import Logger from 'colorful-log-levels';

import { ver, prod, adminID } from '../config';


export function statsCommandHandler(discordMessage: Discord.Message, client: Discord.Client, logger: Logger) {
    // check if the user who called is an admin from the config file
    if (discordMessage.author.id == adminID) {
        // Create a rich embed to send
        //TODO: get a text channel count as well as number of members + online members
        let statsEmbed = new Discord.RichEmbed();
        statsEmbed.author = {
            name: client.user.username,
            url: 'https://e621.net',
            icon_url: client.user.defaultAvatarURL
        };
        statsEmbed.setTitle(`e621-Bot v${ver}`);
        let processInfo =
            `RAM Total: ${Math.round(os.totalmem() / 1024 / 1024)}MB` +
            `\nRAM free: ${Math.round(os.freemem() / 1024 / 1024)}MB` +
            `\nIn use by Bot: ${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)}MB` +
            `\nCPU load: ${os.loadavg()[0]}%`;
        statsEmbed.addField('Process Info', processInfo, false);
        statsEmbed.addField('Uptime', formatTime(process.uptime()), true);
        statsEmbed.addField('Serving', `${client.guilds.size} servers`, true);
        statsEmbed.setColor(3447003);

        return discordMessage.channel.send(statsEmbed);
    } else {
        // send a permission denied message
        logger.auth(
            `${discordMessage.author.username} (${discordMessage.author.id})
            tried to use the 'stats' command at ${new Date().toTimeString()}`)
        return discordMessage.channel.send(`Permission denied. Logging this access attempt.`);
    }
}

// Format unix long dates to hh::mm::ss
function formatTime(seconds: number) {
    function pad(s) {
        return (s < 10 ? '0' : '') + s;
    }
    var hours = Math.floor(seconds / (60 * 60));
    var minutes = Math.floor(seconds % (60 * 60) / 60);
    var seconds = Math.floor(seconds % 60);
    return pad(hours) + ':' + pad(minutes) + ':' + pad(seconds);
}