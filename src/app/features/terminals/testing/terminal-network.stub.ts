import { signal } from '@angular/core';
import { PUBLIC_COMPUTERS } from '../data/public-computers';
import { NetworkState } from '../models/network.model';

/** UI test double: stores supplied snapshots; does not implement game rules. */
export function createTerminalNetworkStub() {
  const state = signal<NetworkState>({
    serverSessionId: 'test-server',
    connectionsVersion: 3,
    destination: null,
    computers: Object.fromEntries(
      PUBLIC_COMPUTERS.map((c) => [
        c.id,
        {
          connectionsUnlocked: false,
          mode: 'acordado',
          inputFrom: null,
          outputTo: null,
          entries: [],
          commands: [],
          count: 0,
          lastPhrase: -1,
        },
      ]),
    ),
  });
  return {
    state,
    catalog: signal(PUBLIC_COMPUTERS),
    ready: signal(true),
    busy: signal(false),
    error: signal<string | null>(null),
    session: (id: string) => state().computers[id],
    submit: vi.fn().mockResolvedValue(true),
    clear: vi.fn().mockResolvedValue(true),
    reconnect: vi.fn().mockResolvedValue(undefined),
  };
}
