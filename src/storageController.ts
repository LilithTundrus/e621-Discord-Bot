import * as path from 'path';
// import { registeredChannelsFile } from './config';
import * as sqlite3 from 'sqlite3';
import * as Discord from 'discord.js';
import Logger from 'colorful-log-levels';

let sql = sqlite3.verbose();
const dbPath = path.resolve(__dirname, 'database/storage.db');
// global for all below functions
let db;

// TODO: add typings/interfaces here
// TODO: clean this up and make it readable

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
        db.run("CREATE TABLE channels (channel TEXT, json TEXT)");
        logger.db('CREATED Main table');
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
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            db.all("SELECT * FROM channels", (err, row) => {
                if (err) {
                    return reject(err);
                }
                return resolve(row);
            });
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

export function removeChannelFromDB(channelID) {
    db.run(`DELETE FROM channels WHERE channel=?`, channelID, function (err) {
        if (err) {
            return console.error(err.message);
        }
        console.log(`Row(s) deleted ${this.changes}`);
    });
}

export function checkIfChannelIsRegistered(channelID) {
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            db.all("SELECT * FROM channels WHERE channel=?", channelID, (err, row) => {
                if (err) {
                    return reject(err);
                }
                if (row.length < 1) {
                    return resolve(false);
                } else {
                    return resolve(true)
                }
            });
        });
    });
}

export function updateChannelJSON(channelID, updatedJSONString) {
    let sql = `UPDATE channels
    SET json = ?
    WHERE channel = ?`;

    db.run(sql, updatedJSONString, channelID, function (err) {
        if (err) {
            return console.error(err.message);
        }
        console.log(`Row(s) updated: ${this.changes}`);
    });
}
