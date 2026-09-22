import { encodeCaesar } from '../ciphers/caesar';
import { INITIAL_CONNECTION_CHAIN } from '../config/initial-connections';
import { PUZZLE_ORDER, REQUIRED_PUZZLE_COMPUTER } from '../config/puzzle-routes';
import { ComputerConfig, ComputerDefinition } from '../models/computer.model';
import { getChainConnections } from './chain-connections';
import { createPuzzleRoute, includeRequiredComputer } from './puzzle-route';

export interface ComputerFactoryOptions {
  requiredComputerId?: string | null;
  puzzleOrder?: readonly string[];
  initialConnectionChain?: readonly string[];
}

export function createComputer(
  definition: ComputerDefinition,
  options: ComputerFactoryOptions = {},
): ComputerConfig {
  const { id, serial, riddle, answer, awakePhrases } = definition;
  const baseRoute =
    definition.context?.route ??
    createPuzzleRoute(options.puzzleOrder ?? PUZZLE_ORDER, id, definition.steps ?? 3);
  const route = includeRequiredComputer(
    baseRoute,
    options.requiredComputerId === undefined
      ? REQUIRED_PUZZLE_COMPUTER
      : options.requiredComputerId,
  );
  return {
    id,
    name: definition.name ?? id,
    location: definition.location ?? 'ESTAÇÃO ' + String(serial).padStart(2, '0'),
    serial: 'PRS-' + String(serial).padStart(3, '0'),
    welcome: definition.welcome ?? 'Há algo do outro lado da tela.',
    encode: definition.encode ?? encodeCaesar,
    ...getChainConnections(id, options.initialConnectionChain ?? INITIAL_CONNECTION_CHAIN),
    context: { riddle, answer, ...definition.context, route },
    awakePhrases,
  };
}
