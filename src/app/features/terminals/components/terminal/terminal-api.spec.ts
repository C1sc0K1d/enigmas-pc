import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Terminal } from './terminal';
import { TerminalApi, GameResponse } from '../../services/terminal-api.service';
import { TerminalNetwork } from '../../services/terminal-network.service';
import { GameEvents } from '../../services/game-events.service';
import { PUBLIC_COMPUTERS } from '../../data/public-computers';

describe('Terminal connected to the API', () => {
  it('waits for the API, displays its result and preserves the draft after a failed send', async () => {
    sessionStorage.clear();
    const computer = PUBLIC_COMPUTERS[5];
    const initial: GameResponse = {
      gameId: '7ef7c51d-0646-48d1-a057-6ad6e272ce9d',
      revision: 0,
      state: {
        serverSessionId: 'cc8bdb71-dc47-461f-9090-4fe9941bc188',
        connectionsVersion: 3,
        destination: null,
        computers: Object.fromEntries(
          PUBLIC_COMPUTERS.map((c) => [
            c.id,
            {
              mode: 'acordado' as const,
              connectionsUnlocked: false,
              inputFrom: null,
              outputTo: null,
              entries: [],
              commands: [],
              count: 0,
              lastPhrase: -1,
            },
          ]),
        ),
      },
    };
    let accept!: (value: GameResponse) => void;
    const api = {
      catalog: vi.fn().mockResolvedValue(PUBLIC_COMPUTERS),
      create: vi.fn().mockResolvedValue(initial),
      load: vi.fn().mockResolvedValue(initial),
      submit: vi
        .fn()
        .mockImplementation(() => new Promise<GameResponse>((resolve) => (accept = resolve))),
    };
    await TestBed.configureTestingModule({
      imports: [Terminal],
      providers: [
        provideRouter([]),
        { provide: TerminalApi, useValue: api },
        { provide: GameEvents, useValue: { watch: () => () => {} } },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(Terminal);
    fixture.componentRef.setInput('computer', computer);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    const input = element.querySelector('input')!;
    await TestBed.inject(TerminalNetwork).initialize();
    fixture.detectChanges();
    await fixture.whenStable();
    const send = async (text: string) => {
      input.value = text;
      input.dispatchEvent(new Event('input'));
      element.querySelector('form')!.dispatchEvent(new Event('submit', { cancelable: true }));
      await fixture.whenStable();
    };
    await send('test input');
    expect(input.disabled).toBe(true);
    expect(element.querySelectorAll('.terminal__entry')).toHaveLength(0);
    const response = structuredClone(initial);
    response.revision = 1;
    response.state.computers[computer.id].entries.push({
      id: 0,
      text: 'test input',
      output: 'API result',
      system: false,
    });
    api.load.mockResolvedValue(response);
    accept(response);
    await vi.waitFor(() => {
      fixture.detectChanges();
      expect(element.querySelector('.terminal__result-content')?.textContent).toBe('API result');
      expect(input.value).toBe('');
    });
    expect(input.value).toBe('');
    api.submit.mockRejectedValueOnce(new Error('offline'));
    await send('keep this draft');
    await vi.waitFor(() => {
      fixture.detectChanges();
      expect(element.querySelector('[role="alert"]')?.textContent).toContain('Confira o histórico');
    });
    expect(input.value).toBe('keep this draft');
    expect(element.querySelectorAll('.terminal__entry')).toHaveLength(1);
  });
});
