import * as Discord from 'discord.js';
import * as storage from './storageController'
import e621 from 'e621-api';

// TODO: this needs to be more configurable for on the fly adds/removes
// TODO: get this working in a very basic way and move on from there
// maybe a global array we push/slice from
let channelsArray = [];

// this is what a channel on a schedule should look like
let schedulerObj = {
    id: 1234,
    nextCheck: 20000,
    previousPostsSet: [],
    blacklistedTags: 'test test2'
};

let storedObj = {
    postSet: [],
    blacklistedTags: []
};

// TODO: make sure this does nothing if the DB array is empty
export function initScheduler(client: Discord.Client, wrapper: e621) {
    // read the user/channel manifest
    storage.getAllChannels()
        .then((channels: any) => {
            channels.forEach(channel => {
                setInterval(() => {
                    wrapper.posts.getPopularPosts(0)
                        .then((response) => {
                            console.log(channel)
                            let matchedChannel: any = client.channels.get(channel.channel);
                            matchedChannel.send(response[0].file_url);
                        })
                    // this timing is for debugging
                }, 20000)
            })
        })
    // // add a listener for each channel with their specialprefs/set of 'unseen' images
    // let channels = storage.readChannelsFile()

    // //  get the most recent images for each channe
    // // check the most recent set against the manifest
    // // EVENTUALLY make sure the tags of the retrieved posts don't conflict with the 
    // // channel's blacklist
    // channels.forEach(channel => {
    //     setInterval(() => {
    //         wrapper.posts.getPopularPosts(0)
    //             .then((response) => {
    //                 let matchedChannel: any = client.channels.get(channel.id);
    //                 matchedChannel.send(response[0].file_url);
    //             })
    //     }, 20000)
    // })
}

export function addChannelToScheduler(client: Discord.Client, wrapper: e621, channelID) {
    // add a channel to the scheduler after the bot has already been run
    console.log('test')
    wrapper.posts.getPopularPosts(0)
        .then((response) => {
            storage.updateChannelJSON(channelID, JSON.stringify(response).replace(`'`, `"`));
            // add the channel to the scheduler
        })
}