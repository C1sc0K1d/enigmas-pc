import type { Request, Response } from 'express';
import http from 'node:http';
import https from 'node:https';

/** Same-origin gateway: browsers and phones never connect to their own localhost:8080. */
export function backendProxy(req: Request, res: Response): void {
  const base = new URL(process.env['BACKEND_URL'] ?? 'http://127.0.0.1:8080');
  const target = new URL(req.originalUrl, base);
  const headers = { ...req.headers, host: base.host };
  delete headers.connection;
  const upstream = (target.protocol === 'https:' ? https : http).request(
    target,
    {
      method: req.method,
      headers,
      timeout: 15000,
    },
    (response) => {
      res.status(response.statusCode ?? 502);
      for (const [name, value] of Object.entries(response.headers)) {
        if (value !== undefined && !['connection', 'transfer-encoding'].includes(name))
          res.setHeader(name, value);
      }
      response.pipe(res);
    },
  );
  upstream.on('timeout', () => upstream.destroy(new Error('Backend timeout')));
  upstream.on('error', () => {
    if (!res.headersSent)
      res
        .status(502)
        .setHeader('Cache-Control', 'no-store')
        .json({ detail: 'Servidor indisponível.' });
    else res.destroy();
  });
  res.on('close', () => {
    if (!res.writableEnded) upstream.destroy();
  });
  req.pipe(upstream);
}
