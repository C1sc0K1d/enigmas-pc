import { randomUUID } from 'node:crypto';
import process from 'node:process';
import type { Request, Response } from 'express';

// The environment survives dev-server module reloads, but not a fresh server process.
export function getServerSessionId(): string {
  return (process.env['PRESOS_SERVER_SESSION_ID'] ??= randomUUID());
}

export function serverSession(_request: Request, response: Response): void {
  response.setHeader('Cache-Control', 'no-store');
  response.json({ sessionId: getServerSessionId() });
}
