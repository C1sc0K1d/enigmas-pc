import { TerminalNetwork } from '../services/terminal-network.service';

// Fixture for tests of routing/transmission after the connection keys have been found.
export function unlockConnections(
  network: TerminalNetwork,
  ids = Object.keys(network.state().computers),
): void {
  network.state.update((state) => ({
    ...state,
    computers: Object.fromEntries(
      Object.entries(state.computers).map(([id, session]) => [
        id,
        ids.includes(id) ? { ...session, connectionsUnlocked: true } : session,
      ]),
    ),
  }));
}
