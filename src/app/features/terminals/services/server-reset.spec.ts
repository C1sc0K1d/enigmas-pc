import { TestBed } from '@angular/core/testing';
import { Terminal } from '../components/terminal/terminal';
import { COMPUTERS } from '../data/computers';
import { CONNECTIONS_VERSION, STORAGE_KEY } from '../config/network.config';
import { createNetworkState } from '../functions/network-state';
import { TerminalNetwork } from './terminal-network.service';
import { ServerSession } from './server-session.service';

beforeEach(() => sessionStorage.removeItem(STORAGE_KEY));

async function setup() {
  let report!: (id: string) => void;
  const stop = vi.fn();
  await TestBed.configureTestingModule({
    imports: [Terminal],
    providers: [
      {
        provide: ServerSession,
        useValue: {
          watch: (listener: typeof report) => {
            report = listener;
            return stop;
          },
        },
      },
    ],
  }).compileComponents();
  const fixture = TestBed.createComponent(Terminal);
  fixture.componentRef.setInput(
    'computer',
    COMPUTERS.find(({ id }) => id === 'chma_vva'),
  );
  await fixture.whenStable();
  return { net: TestBed.inject(TerminalNetwork), report, fixture, stop };
}

describe('Reinício do servidor', () => {
  it('resets every PC, unlock, connection, mode, destination and draft when the server changes', async () => {
    const { net, report, fixture, stop } = await setup();
    report('first');
    net.submit('chma_vva', 'dormindo');
    net.submit('chma_vva', 'cldl');
    net.submit('chma_vva', 'cncta_sda sultao_d');
    net.submit('tec_la', 'contexto');
    await fixture.whenStable();
    expect(net.session('chma_vva').connectionsUnlocked).toBe(true);
    const input = (fixture.nativeElement as HTMLElement).querySelector('input')!;
    input.value = 'rascunho antigo';
    input.dispatchEvent(new Event('input'));
    await fixture.whenStable();
    report('second');
    await fixture.whenStable();
    const expected = {
      ...createNetworkState(COMPUTERS, CONNECTIONS_VERSION),
      serverSessionId: 'second',
    };
    expect(net.state()).toEqual(expected);
    expect(JSON.parse(sessionStorage.getItem(STORAGE_KEY)!)).toEqual(expected);
    expect(input.value).toBe('');
    TestBed.resetTestingModule();
    expect(stop).toHaveBeenCalled();
  });

  it('preserves saved progress when reloading during the same server session', async () => {
    let app = await setup();
    app.report('same');
    app.net.submit('chma_vva', 'dormindo');
    app.net.submit('chma_vva', 'cldl');
    const expected = app.net.state();
    app.report('same');
    expect(app.net.state()).toEqual(expected);
    TestBed.resetTestingModule();
    app = await setup();
    app.report('same');
    expect(app.net.state()).toEqual(expected);
  });

  it('clears old saved progress after a restart while the tab was closed', async () => {
    const saved = createNetworkState(COMPUTERS, CONNECTIONS_VERSION);
    saved.serverSessionId = 'old';
    saved.computers['sultao_d'].connectionsUnlocked = true;
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
    const { net, report } = await setup();
    report('new');
    expect(net.state()).toEqual({
      ...createNetworkState(COMPUTERS, CONNECTIONS_VERSION),
      serverSessionId: 'new',
    });
  });
});
