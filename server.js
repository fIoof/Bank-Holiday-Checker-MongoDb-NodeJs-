const express = require('express');
const app = express();
const lookUp = require('./bin/index.js');
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static('public'));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

app.post('/lookup', async (req, res) => {
    try {
        const { date1, date2 } = req.body;

        const results = await lookUp(new Date(date1), new Date(date2));
        res.json(results);
    } catch (error) {
        res.status(500).send(error.toString());
    }
});
app.listen(8000, function () { //http://127.0.0.1:8000/
    console.log("Server is running on Port 8000");
});
