const express = require('express');
const app = express();
app.use(express.json());

let latestData = { gas: 0, temp: 0, hum: 0, dist: 0, risk: false };
let clients = [];  // Track SSE clients

app.post('/log', (req, res) => {
  latestData = req.body;
  console.log('Received:', latestData);
  
  // Notify SSE clients
  clients.forEach(client => client.res.write(`data: ${JSON.stringify(latestData)}\n\n`));
  
  res.sendStatus(200);
});

app.get('/events', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*'
  });
  
  clients.push({ res });
  
  req.on('close', () => {
    clients = clients.filter(client => client.res !== res);
  });
  
  res.write(`data: ${JSON.stringify(latestData)}\n\n`);
});

app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>CNG-Protect Dashboard</title>
      <style>
        body { font-family: Arial; background: #f4f4f4; padding: 20px; }
        .dashboard { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .data-item { margin: 10px 0; padding: 10px; background: #e9f5ff; border-left: 4px solid #007bff; }
        .risk-high { background: #ffebee; border-left-color: #f44336; }
        .risk-warn { background: #fff3e0; border-left-color: #ff9800; }
        .risk-safe { background: #e8f5e8; border-left-color: #4caf50; }
      </style>
    </head>
    <body>
      <div class="dashboard">
        <h1>CNG-Protect Dashboard (Real-Time)</h1>
        <div id="data-display">
          <p>Loading data...</p>
        </div>
      </div>
      <script>
        const eventSource = new EventSource('/events');
        const display = document.getElementById('data-display');
        
        eventSource.onmessage = function(event) {
          const data = JSON.parse(event.data);
          const riskClass = data.risk ? 'risk-high' : data.gas > 200 || data.temp > 35 || data.hum > 70 ? 'risk-warn' : 'risk-safe';
          
          display.innerHTML = `
            <div class="data-item ${riskClass}">
              <strong>Gas:</strong> ${data.gas} ppm<br>
              <strong>Temperature:</strong> ${data.temp}°C<br>
              <strong>Humidity:</strong> ${data.hum}%<br>
              <strong>Distance:</strong> ${data.dist} cm<br>
              <strong>Risk:</strong> ${data.risk ? 'HIGH' : data.gas > 200 || data.temp > 35 || data.hum > 70 ? 'WARNING' : 'SAFE'}
            </div>
            <p>Last updated: ${new Date().toLocaleTimeString()}</p>
          `;
        };
        
        eventSource.onerror = function() {
          display.innerHTML = '<p>Error connecting to server. Retrying...</p>';
        };
      </script>
    </body>
    </html>
  `);
});

app.listen(3000, () => console.log('Server on port 3000'));
