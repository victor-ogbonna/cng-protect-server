const express = require('express');
const app = express();
app.use(express.json());

let latestData = {};

app.post('/log', (req, res) => {
    latestData = req.body;
    console.log('Received:', latestData);
    res.sendStatus(200);
});

app.get('/', (req, res) => {
    res.send(`<pre>${JSON.stringify(latestData, null, 2)}</pre>`);
});

app.listen(3000, () => console.log('Server on port 3000'));
