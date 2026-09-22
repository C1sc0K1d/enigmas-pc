import { ComputerConfig } from '../models/computer.model';

export function describeRoute(computer: ComputerConfig): string {
  const { route } = computer.context;
  return [
    `INÍCIO: ${route[0]}`,
    `PERCURSO: ${route.length} computador${route.length === 1 ? '' : 'es'}.`,
    ...route.map((id, index) => `${index + 1}. ${id}`),
    `DESTINO: ${computer.name}`,
  ].join('\n');
}
