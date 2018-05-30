'use strict';
// JS only module ( annoying but it needs to be like that)
const { Embeds: EmbedsMode, FieldsEmbed: FieldsEmbedMode } = require('discord-paginationembed');
// Definitions for message and client arg
import * as Discord from 'discord.js';
// Definitions for logger arg
import Logger from 'colorful-log-levels';
import { ver, prod, adminID, e621UserAgent } from '../config';
// For creating consitent errors across all parts of the Discord bot
import { createRichError } from '../coomon/createRichError';
import e621 from 'e621-api';

export function popularCommandHandler(discordMessage: Discord.Message, args: string[], client: Discord.Client, wrapper: e621) {
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