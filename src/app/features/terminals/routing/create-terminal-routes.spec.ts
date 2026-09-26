import { TerminalNetwork } from '../services/terminal-network.service';
import { createTerminalNetworkStub } from '../testing/terminal-network.stub';
import { TestBed } from '@angular/core/testing';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { createTerminalRoutes } from './create-terminal-routes';
import { PUBLIC_COMPUTERS as COMPUTERS } from '../data/public-computers';
import { Terminal } from '../components/terminal/terminal';

describe('Terminal page routes', () => {
  it('creates redirects, one page per PC and the configured titles', () => {
    const computers = COMPUTERS.slice(0, 2);
    const routes = createTerminalRoutes(computers, {
      defaultComputerId: 'sultao_d',
      titleSuffix: 'Campanha',
    });
    expect(routes[0]).toEqual({ path: '', pathMatch: 'full', redirectTo: 'sultao_d' });
    expect(routes.at(-1)).toEqual({ path: '**', redirectTo: 'sultao_d' });
    expect(routes.slice(1, -1).map((route) => route.path)).toEqual(['inno_m1nvl', 'sultao_d']);
    expect(routes[2].data?.['computer']).toBe(computers[1]);
    expect(routes[2].title).toBe('sultao_d | Campanha');
  });
  it('rejects an empty list, duplicate IDs or an unknown default PC', () => {
    expect(() => createTerminalRoutes([])).toThrow();
    expect(() => createTerminalRoutes([COMPUTERS[0], COMPUTERS[0]])).toThrow();
    expect(() => createTerminalRoutes(COMPUTERS, { defaultComputerId: 'inexistente' })).toThrow();
  });
  it('binds each routed PC to the reusable terminal and redirects unknown URLs', async () => {
    TestBed.configureTestingModule({
      providers: [provideRouter(createTerminalRoutes(COMPUTERS), withComponentInputBinding())],
    });
    const harness = await RouterTestingHarness.create();
    const sultao = await harness.navigateByUrl('/sultao_d', Terminal);
    expect(sultao.computer().id).toBe('sultao_d');
    const tec = await harness.navigateByUrl('/tec_la', Terminal);
    expect(tec.computer().id).toBe('tec_la');
    const fallback = await harness.navigateByUrl('/inexistente', Terminal);
    expect(fallback.computer().id).toBe(COMPUTERS[0].id);
  });
});

beforeEach(() =>
  TestBed.configureTestingModule({
    providers: [{ provide: TerminalNetwork, useValue: createTerminalNetworkStub() }],
  }),
);
