import fetch from 'node-fetch';
import WebSocket from 'ws';

(async () => {
  try {
    // 1. Create a session via HTTP proxy
    console.log('Creating session...');
    const res = await fetch('https://127.0.0.1:3000/api/py/session/create', {
      method: 'POST',
      body: JSON.stringify({ exercise_id: 'squat' }),
      headers: { 'Content-Type': 'application/json' },
      agent: new (await import('https')).Agent({ rejectUnauthorized: false })
    });
    const data = await res.json();
    console.log('Session created:', data);

    // 2. Connect via WSS proxy
    const wsUrl = `wss://127.0.0.1:3000/api/py/ws/camera/${data.sessionId}`;
    console.log('Connecting to WS:', wsUrl);
    const ws = new WebSocket(wsUrl, { rejectUnauthorized: false });

    ws.on('open', () => {
      console.log('WS OPENED SUCCESSFULLY!');
      process.exit(0);
    });

    ws.on('error', err => {
      console.error('WS ERROR:', err);
      process.exit(1);
    });

    ws.on('unexpected-response', (req, res) => {
      console.log('WS UNEXPECTED:', res.statusCode);
      process.exit(1);
    });
  } catch (err) {
    console.error('FATAL:', err);
    process.exit(1);
  }
})();
