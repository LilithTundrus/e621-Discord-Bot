import * as Discord from 'discord.js';
import * as storage from './storageController'
import e621 from 'e621-api';

// this is where the scheduler will go, adding a listerner
// for each Discord channel + prefs based on a stored file

export function initScheduler(client: Discord.Client, wrapper: e621) {
    // read the user/channel manifest

    // add a listener for each channel with their specialprefs/set of 'unseen' images
    let channels = storage.readChannelsFile()

    channels.forEach(channel => {
        setInterval(() => {
            wrapper.posts.getPopularPosts(0)
                .then((response) => {
                    let matchedChannel: any = client.channels.get(channel.id);
                    matchedChannel.send(response[0].file_url)
                })
        }, 20000)
    })
}