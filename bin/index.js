#!/usr/bin/env node
// module used: https://yargs.js.org/ 
// used example: https://github.com/yargs/yargs/blob/main/example/help.js
// Used module https://www.npmjs.com/package/cli-box

const Box = require("cli-box");
const { MongoClient } = require('mongodb');
const url = "mongodb://localhost";
const createDatabase = require('../bin/bank-holidays');
const DATABASE_NAME = 'dates';
const title = 'Bank Holiday Checker';
const usageMessage = 'Usage: --d1 <d1> [Start date] --d2 <d2> [End date] YYYY-MM-DD';
const instruct = 'Two dates returns true if falls within a bank holiday';
const b1 = Box("30x5", title);
const b2 = Box("60x5", usageMessage);
const b3 = Box("60x5", instruct);
let date1, date2;


if (require.main === module) {
    const argv = require('yargs') // Yo ho ho and a bottle of rum
        .scriptName('date-assist-jsmongo')
        .usage(b1.toString() + '\n' + b2.toString() + '\n' + b3.toString())
        .option('d1', {
            alias: 'date1',
            describe: 'First date',
            type: 'string',
            demandOption: true
        })
        .option('d2', {
            alias: 'date2',
            describe: 'Second date',
            type: 'string',
            demandOption: true
        })
        .help('h')
        .alias('h', 'help')
        .argv;
    
    date1 = new Date(argv.d1)
    date2 = new Date(argv.d2)
    if (date1 >= date2) {
        console.log("Please enter a start date less than your end date");
        return;
    }
    lookUp(date1, date2);
}

function lookUp(date1, date2) {
    return new Promise(async (resolve, reject) => {
        if (date1 instanceof Date && date2 instanceof Date) {
            function processDates(date1, date2) {
                let formattedDate1 = date1
                let formattedDate2 = date2;
                formattedDate1 = formattedDate1.toISOString().split('T')[0]
                formattedDate2 = formattedDate2.toISOString().split('T')[0]
                return [formattedDate1, formattedDate2];
            }
    
            let [formattedDate1, formattedDate2] = processDates(date1, date2);
            const client = new MongoClient(url);
            async function checkAndCreateDatabase(dbName) {
                try {
                    await client.connect();
                    const adminDb = client.db().admin();
                    const databases = await adminDb.listDatabases();
                    const dbExists = databases.databases.some(db => db.name === dbName);
                    if (!dbExists) {
                        console.log("Database does not exist");
                        await createDatabase(dbName);
                    }
                } catch (err) {
                    console.log("Error: ", err);
                } finally {
                    await client.close();
                }
            }
            async function run() {
                try {
                    await client.connect();
                    const database = client.db("dates");
                    const holidays = database.collection('holidays');
                    const division = "england-and-wales";
                    const query = [
                        { $unwind: "$events" }, //aggregates array of dates to be sorted 
                        {
                            $match: {
                                "events.date": { $gte: formattedDate1, $lte: formattedDate2 },
                                "division": division
                            }
                        }, //matches dates between date1 and date2 as well as division.
                        { $sort: { "events.date": 1 } } //sorts Accending order
                    ];
                    const events = await holidays.aggregate(query).toArray(); //returns array of dates
                    if (events.length === 0) {
                        console.log("No bank holidays found between the two dates");
                        resolve([]);
                        return;
                    }
                    const results = events.map(event => {
                        const jsonString = JSON.stringify(event.events, null, "\t");
                        const cleanString = jsonString.replace(/[{}]/g, ""); //removes all {} & [] with empty string
                        const b4 = Box("50x5", cleanString);
                        console.log(b4.toString());
                        return jsonString;
                    });
                    resolve(results);
                } catch (err) {
                    reject(err);
                } finally {
                    await client.close();
                }
            }
            async function main() {
                await checkAndCreateDatabase(DATABASE_NAME).catch(console.dir); //creates database if it does not exist
                await run().catch(console.dir); //runs the query
            }
            main();
        }
    });
}
module.exports = lookUp;