// Definitions for message and client arg
import * as Discord from 'discord.js';

export function helpCommandHandler(discordMessage: Discord.Message, args: string[]) {
    // this is where a user should be able to get a set of commands and help
    // on a specific command if given
    return discordMessage.channel.send('Test');
}