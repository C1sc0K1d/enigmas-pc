import { test } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import express from 'express';
import { backendProxy } from './backend-proxy.ts';

test('proxies API paths, session headers, JSON bodies and backend errors', async () => {
  const backend = http.createServer((req, res) => {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', () => {
      res.writeHead(409, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
      res.end(
        JSON.stringify({
          path: req.url,
          token: req.headers['x-game-session'],
          body: JSON.parse(body),
        }),
      );
    });
  });
  await new Promise((resolve) => backend.listen(0, '127.0.0.1', resolve));
  const previous = process.env.BACKEND_URL;
  process.env.BACKEND_URL = 'http://127.0.0.1:' + backend.address().port;
  const app = express();
  app.use('/api', backendProxy);
  const frontend = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => frontend.on('listening', resolve));
  try {
    const response = await fetch(
      'http://127.0.0.1:' + frontend.address().port + '/api/games/current/commands',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Game-Session': 'test-session' },
        body: JSON.stringify({ text: '  abc  ' }),
      },
    );
    assert.equal(response.status, 409);
    assert.equal(response.headers.get('cache-control'), 'no-store');
    assert.deepEqual(await response.json(), {
      path: '/api/games/current/commands',
      token: 'test-session',
      body: { text: '  abc  ' },
    });
    await new Promise((resolve) => backend.close(resolve));
    const unavailable = await fetch('http://127.0.0.1:' + frontend.address().port + '/api/session');
    assert.equal(unavailable.status, 502);
  } finally {
    if (previous === undefined) delete process.env.BACKEND_URL;
    else process.env.BACKEND_URL = previous;
    frontend.closeAllConnections();
    await new Promise((resolve) => frontend.close(resolve));
    backend.close();
  }
});

test(
  'streams SSE frames before completion and closes the upstream on disconnect',
  { timeout: 5000 },
  async () => {
    let disconnected;
    const closed = new Promise((resolve) => (disconnected = resolve));
    const backend = http.createServer((req, res) => {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-store',
        'X-Accel-Buffering': 'no',
      });
      res.write('event: changed\ndata: refresh\n\n');
      res.on('close', disconnected);
    });
    await new Promise((resolve) => backend.listen(0, '127.0.0.1', resolve));
    const previous = process.env.BACKEND_URL;
    process.env.BACKEND_URL = 'http://127.0.0.1:' + backend.address().port;
    const app = express();
    app.use('/api', backendProxy);
    const frontend = app.listen(0, '127.0.0.1');
    await new Promise((resolve) => frontend.on('listening', resolve));
    const controller = new AbortController();
    try {
      const response = await fetch(
        'http://127.0.0.1:' + frontend.address().port + '/api/games/events',
        { signal: controller.signal },
      );
      assert.equal(response.headers.get('content-type'), 'text/event-stream');
      const reader = response.body.getReader();
      const frame = await reader.read();
      assert.match(new TextDecoder().decode(frame.value), /event: changed/);
      controller.abort();
      await closed;
    } finally {
      controller.abort();
      if (previous === undefined) delete process.env.BACKEND_URL;
      else process.env.BACKEND_URL = previous;
      frontend.closeAllConnections();
      backend.closeAllConnections();
      await Promise.all([
        new Promise((resolve) => frontend.close(resolve)),
        new Promise((resolve) => backend.close(resolve)),
      ]);
    }
  },
);
