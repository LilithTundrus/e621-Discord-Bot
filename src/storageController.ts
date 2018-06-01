import * as fs from 'fs';
import * as path from 'path';
import { registeredChannelsFile } from './config';
import * as Discord from 'discord.js';

export interface channelInfo {
    id: number | string;
}

export function readChannelsFile(): channelInfo[] {
    // read the registeredServers.json file and return contents
    // TODO: Make this async!
    return JSON.parse(fs.readFileSync(registeredChannelsFile, 'UTF-8'));
}

export function registerChannel(channelID) {

    let workingJSON = readChannelsFile();
    workingJSON.push({
        id: channelID
    });
    // we should probably make sure the file hasn't changed between being read and written to
    fs.writeFileSync(registeredChannelsFile, JSON.stringify(workingJSON, null, 2))
}

