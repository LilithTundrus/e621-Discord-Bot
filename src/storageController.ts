import * as fs from 'fs';
import * as path from 'path';

import { registeredChannelsFile } from './config';

export function readServerFile() {
    // read the registeredServers.json file and return contents
    // TODO: Make this async!
    return JSON.parse(fs.readFileSync(registeredChannelsFile, 'UTF-8'));
}

