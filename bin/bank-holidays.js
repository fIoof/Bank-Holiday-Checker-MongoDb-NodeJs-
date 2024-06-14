const { MongoClient } = require('mongodb');
const fetch = require('node-fetch');
const url = "mongodb://localhost";

async function createDatabase(dbName) {
    const client = new MongoClient(url);
    try {
        await client.connect();
        const db = client.db(dbName);
        const response = await fetch('https://www.gov.uk/bank-holidays.json'); // Fetch the data
        if (!response.ok) { 
            throw new Error('Failed to fetch data');
        }
        const data = await response.json(); // Parse the JSON
        await db.collection('holidays').insertMany(Object.values(data)); // Insert the data into the database
        console.log(`Database created! "${dbName}"`); 
    } catch (err) {
        console.log("Error: ", err);
    } finally {
        await client.close();
    }
}
module.exports = createDatabase; // Export the function to be used in bin/index.js