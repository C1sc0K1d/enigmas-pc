import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class GameEvents {
  watch(onChange: () => void): () => void {
    const stream = new EventSource('/api/games/events');
    // EventSource reconnects automatically. Fetch a full snapshot after every reconnect.
    stream.addEventListener('open', onChange);
    stream.addEventListener('changed', onChange);
    return () => stream.close();
  }
}
