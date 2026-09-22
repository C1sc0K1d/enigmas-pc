import { Routes } from '@angular/router';
import { Terminal } from '../components/terminal/terminal';
import { ComputerConfig } from '../models/computer.model';

export interface TerminalRouteOptions {
  defaultComputerId?: string;
  titleSuffix?: string;
}

// Pode montar as rotas de outro conjunto de computadores sem duplicar a configuração.
export function createTerminalRoutes(
  computers: readonly ComputerConfig[],
  options: TerminalRouteOptions = {},
): Routes {
  if (!computers.length) throw new Error('É necessário configurar pelo menos um computador.');
  const ids = new Set(computers.map((computer) => computer.id));
  const defaultId = options.defaultComputerId ?? computers[0].id;
  if (ids.size !== computers.length || !ids.has(defaultId)) {
    throw new Error('Computadores duplicados ou terminal inicial inválido.');
  }
  const suffix = options.titleSuffix ?? 'PRESOS';
  return [
    { path: '', pathMatch: 'full', redirectTo: defaultId },
    ...computers.map((computer) => ({
      path: computer.id,
      component: Terminal,
      data: { computer },
      title: suffix ? computer.name + ' | ' + suffix : computer.name,
    })),
    { path: '**', redirectTo: defaultId },
  ];
}
