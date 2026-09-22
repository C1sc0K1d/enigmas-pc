import { ComputerConfig } from '../models/computer.model';

export function getChainConnections(
  id: string,
  chain: readonly string[],
): Pick<ComputerConfig, 'inputFrom' | 'outputTo'> {
  const index = chain.indexOf(id);
  return {
    inputFrom: index > 0 ? chain[index - 1] : null,
    outputTo: index >= 0 ? (chain[index + 1] ?? null) : null,
  };
}
