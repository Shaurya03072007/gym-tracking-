import WebSocket from 'ws';
const ws = new WebSocket('ws://127.0.0.1:8000/ws/camera/1234', { headers: { Origin: 'https://0.0.0.0:3000' } });
ws.on('open', () => console.log('DIRECT Python OK'));
ws.on('error', e => console.error('DIRECT Python ERROR', e));
ws.on('unexpected-response', (req, res) => console.log('DIRECT Python UNEXPECTED', res.statusCode));
