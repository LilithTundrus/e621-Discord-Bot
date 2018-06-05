// import * as fs from 'fs';
import * as path from 'path';
// import { registeredChannelsFile } from './config';
import * as sqlite3 from 'sqlite3';
import * as Discord from 'discord.js';
import Logger from 'colorful-log-levels';


let sql = sqlite3.verbose();
const dbPath = path.resolve(__dirname, 'database/storage.db');
// global for all below functions
let db;

export interface channelInfo {
    id: string;
}

export function initDB(logger: Logger) {
    // sql inits
    db = new sql.Database(dbPath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE,
        (err) => {
            if (err) {
                logger.error(err.message);
            }
            logger.db('Connected to Database...');
        }
    );
}

export function createDB(logger: Logger) {
    db.serialize(function (err) {
        db.run("CREATE TABLE channels (channel TEXT)");
        logger.db('CREATED Main table')
    });
}

export function closeDB(logger: Logger) {
    db.close((err) => {
        if (err) {
            return logger.error(err.message);
        }
        logger.db('Closed the database connection.');
    });
};

export function getAllChannels() {
    db.serialize(() => {
        db.all("SELECT * FROM channels", (err, row) => {
            if (err) {
                console.error(err.message);
            }
            console.log(row);
        });
    });
}

export function addChannelToDB(channelID) {
    db.run(`INSERT INTO channels(channel) VALUES(?)`, [`${channelID}`], function (err) {
        if (err) {
            return console.log(err.message);
        }
        // get the last insert id
        console.log(`A row has been inserted with rowid ${this.lastID}`);
    });
}

// export function readChannelsFile(): channelInfo[] {
//     // // read the registeredServers.json file and return contents
//     // // TODO: Make this async!
//     // return JSON.parse(fs.readFileSync(registeredChannelsFile, 'UTF-8'));
// }

export function registerChannel(channelID) {
    // let workingJSON = readChannelsFile();
    // workingJSON.push({
    //     id: channelID
    // });
    // // we should probably make sure the file hasn't changed between being read and written to
    // fs.writeFileSync(registeredChannelsFile, JSON.stringify(workingJSON, null, 2))
}

export function checkIfChannelIsRegistered(channelID) {
    // let returnBool = false
    // let workingJSON = readChannelsFile();
    // for (let channel of workingJSON) {
    //     if (channel.id == channelID) {
    //         returnBool = true;
    //         break;
    //     }
    // }
    // return returnBool;
}
