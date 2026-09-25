import WebSocket from 'ws';

// Set up a secure WS client that ignores self-signed certs (rejectUnauthorized: false)
const ws = new WebSocket('wss://127.0.0.1:3000/api/py/ws/camera/1234', {
  rejectUnauthorized: false
});

ws.on('open', () => {
  console.log('WS CONNECTION SUCCESSFUL!');
  process.exit(0);
});

ws.on('error', (err) => {
  console.error('WS ERROR:', err);
  process.exit(1);
});

ws.on('unexpected-response', (req, res) => {
  console.error('UNEXPECTED RESPONSE:', res.statusCode, res.statusMessage);
  process.exit(1);
});

setTimeout(() => {
  console.error('WS TIMEOUT');
  process.exit(1);
}, 5000);
