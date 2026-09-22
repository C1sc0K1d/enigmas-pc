import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ServerSession {
  watch(onSession: (id: string) => void): () => void {
    let stopped = false;
    let pending: AbortController | null = null;
    const check = async () => {
      if (stopped || pending) return;
      const controller = new AbortController();
      pending = controller;
      const timeout = window.setTimeout(() => controller.abort(), 5000);
      try {
        const response = await fetch('/api/session', {
          cache: 'no-store',
          signal: controller.signal,
        });
        if (!response.ok) return;
        const data: unknown = await response.json();
        if (
          !stopped &&
          data &&
          typeof data === 'object' &&
          'sessionId' in data &&
          typeof data.sessionId === 'string' &&
          data.sessionId.length > 0
        )
          onSession(data.sessionId);
      } catch {
        // Offline or restarting: retain the game until the server confirms its session.
      } finally {
        window.clearTimeout(timeout);
        pending = null;
      }
    };
    const resume = () => {
      void check();
    };
    const visible = () => {
      if (document.visibilityState === 'visible') resume();
    };
    const interval = window.setInterval(resume, 10000);
    window.addEventListener('focus', resume);
    window.addEventListener('online', resume);
    document.addEventListener('visibilitychange', visible);
    resume();
    return () => {
      stopped = true;
      pending?.abort();
      window.clearInterval(interval);
      window.removeEventListener('focus', resume);
      window.removeEventListener('online', resume);
      document.removeEventListener('visibilitychange', visible);
    };
  }
}
