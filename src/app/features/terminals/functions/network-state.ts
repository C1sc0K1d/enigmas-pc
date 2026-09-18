import { ComputerConfig } from '../models/computer.model';
import { NetworkState } from '../models/network.model';

export function createNetworkState(
  computers: readonly ComputerConfig[],
  connectionsVersion: number,
): NetworkState {
  return {
    serverSessionId: null,
    connectionsVersion: connectionsVersion,
    destination: null,
    computers: Object.fromEntries(
      computers.map((computer) => [
        computer.id,
        {
          mode: 'acordado',
          connectionsUnlocked: false,
          inputFrom: computer.inputFrom,
          outputTo: computer.outputTo,
          entries: [],
          commands: [],
          count: 0,
          lastPhrase: -1,
        },
      ]),
    ),
  };
}

// Valida e migra dados sem acessar o navegador nem gravar no armazenamento.
export function restoreNetworkState(
  saved: unknown,
  computers: readonly ComputerConfig[],
  connectionsVersion: number,
): { state: NetworkState; connectionsMigrated: boolean } | null {
  // Só restaura uma rede completa e coerente criada por esta versão do aplicativo.
  if (!saved || typeof saved !== 'object') return null;
  const candidate = saved as NetworkState;
  if (candidate.serverSessionId != null && typeof candidate.serverSessionId !== 'string')
    return null;
  const ids = new Set(computers.map((computer) => computer.id));
  const isConnection = (id: unknown) => id === null || (typeof id === 'string' && ids.has(id));
  if (!candidate.computers || !isConnection(candidate.destination)) return null;
  for (const id of ids) {
    const session = candidate.computers[id];
    if (
      !session ||
      !['acordado', 'dormindo'].includes(session.mode) ||
      (session.connectionsUnlocked !== undefined &&
        typeof session.connectionsUnlocked !== 'boolean') ||
      !isConnection(session.inputFrom) ||
      !isConnection(session.outputTo) ||
      session.inputFrom === id ||
      session.outputTo === id ||
      !Number.isSafeInteger(session.count) ||
      session.count < 0 ||
      !Number.isInteger(session.lastPhrase) ||
      !Array.isArray(session.commands) ||
      !session.commands.every((text) => typeof text === 'string') ||
      !Array.isArray(session.entries) ||
      !session.entries.every(
        (entry) =>
          entry &&
          Number.isSafeInteger(entry.id) &&
          typeof entry.text === 'string' &&
          typeof entry.output === 'string' &&
          typeof entry.system === 'boolean' &&
          (entry.source === undefined || ids.has(entry.source)),
      )
    )
      return null;
    if (session.outputTo && candidate.computers[session.outputTo]?.inputFrom !== id) return null;
    if (session.inputFrom && candidate.computers[session.inputFrom]?.outputTo !== id) return null;
  }
  const migrateConnections = candidate.connectionsVersion !== connectionsVersion;
  const state: NetworkState = {
    serverSessionId: candidate.serverSessionId ?? null,
    connectionsVersion: connectionsVersion,
    destination: candidate.destination,
    computers: Object.fromEntries(
      computers.map((computer) => [
        computer.id,
        {
          ...candidate.computers[computer.id],
          connectionsUnlocked: candidate.computers[computer.id].connectionsUnlocked === true,
          ...(migrateConnections
            ? { inputFrom: computer.inputFrom, outputTo: computer.outputTo }
            : {}),
        },
      ]),
    ),
  };
  return { state, connectionsMigrated: migrateConnections };
}
