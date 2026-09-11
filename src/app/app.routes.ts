import { Routes } from '@angular/router';
import { COMPUTERS } from './computers';
import { Terminal } from './terminal/terminal';
export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: COMPUTERS[0].id },
  ...COMPUTERS.map((computer) => ({
    path: computer.id, component: Terminal, data: { computer }, title: `${computer.name} | PRESOS`,
  })),
  { path: '**', redirectTo: COMPUTERS[0].id },
];
