import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { GameEvents } from './game-events.service';
import { TerminalNetwork } from './terminal-network.service';
import { TerminalApi, GameResponse } from './terminal-api.service';
import { PUBLIC_COMPUTERS } from '../data/public-computers';

const token = '83aa0b84-df03-4ce8-a7b9-7b2c8515e10f';
function snapshot(revision = 0): GameResponse {
  return {
    gameId: token,
    revision,
    state: {
      serverSessionId: '849a3049-3f88-4bdb-91d3-42ef4526a8f7',
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
}
describe('Remote terminal state', () => {
  let api: {
    catalog: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    load: ReturnType<typeof vi.fn>;
    submit: ReturnType<typeof vi.fn>;
  };
  beforeEach(() => {
    sessionStorage.clear();
    api = {
      catalog: vi.fn().mockResolvedValue(PUBLIC_COMPUTERS),
      create: vi.fn().mockResolvedValue(snapshot()),
      load: vi.fn().mockResolvedValue(snapshot()),
      submit: vi.fn().mockResolvedValue(snapshot(1)),
    };
    TestBed.configureTestingModule({
      providers: [
        { provide: TerminalApi, useValue: api },
        { provide: GameEvents, useValue: { watch: () => () => {} } },
      ],
    });
  });
  it('joins the shared game even if this browser has an old private token', async () => {
    sessionStorage.setItem('presos-api-game-id-v1', 'old-private-game');
    const net = TestBed.inject(TerminalNetwork);
    await net.initialize();
    expect(net.ready()).toBe(true);
    expect(api.create).toHaveBeenCalledTimes(1);
    expect(api.load).not.toHaveBeenCalled();
  });
  it('receives another player progress and reconnects after network failure', async () => {
    const net = TestBed.inject(TerminalNetwork);
    await net.initialize();
    const updated = snapshot(1);
    updated.state.computers['tec_la'].mode = 'dormindo';
    api.load.mockResolvedValueOnce(updated);
    await net.refresh();
    expect(net.session('tec_la').mode).toBe('dormindo');
    api.load.mockRejectedValueOnce(new HttpErrorResponse({ status: 502 }));
    await net.refresh();
    expect(net.ready()).toBe(false);
    api.create.mockResolvedValueOnce(updated);
    await net.refresh();
    expect(net.ready()).toBe(true);
    expect(net.session('tec_la').mode).toBe('dormindo');
  });
  it('does not let a pending poll overwrite a newer command result', async () => {
    const net = TestBed.inject(TerminalNetwork);
    await net.initialize();
    TestBed.tick();
    await net.initialize();
    let resolve!: (value: GameResponse) => void;
    api.load.mockReturnValueOnce(new Promise<GameResponse>((r) => (resolve = r)));
    const poll = net.refresh();
    const updated = snapshot(2);
    updated.state.computers['tec_la'].mode = 'dormindo';
    api.submit.mockResolvedValueOnce(updated);
    await net.submit('tec_la', 'dormindo');
    resolve(snapshot(1));
    await poll;
    expect(net.session('tec_la').mode).toBe('dormindo');
  });
  it('drains notifications received while sending and distinguishes a rejected conflict', async () => {
    const net = TestBed.inject(TerminalNetwork);
    await net.initialize();
    TestBed.tick();
    await net.initialize();
    let resolve!: (value: GameResponse) => void;
    api.submit.mockReturnValueOnce(new Promise<GameResponse>((r) => (resolve = r)));
    const sending = net.submit('tec_la', 'first');
    await net.refresh();
    expect(api.load).not.toHaveBeenCalled();
    const updated = snapshot(2);
    updated.state.computers['tec_la'].mode = 'dormindo';
    api.load.mockResolvedValue(updated);
    resolve(snapshot(1));
    await sending;
    await vi.waitFor(() => expect(net.session('tec_la').mode).toBe('dormindo'));
    api.submit.mockRejectedValueOnce(new HttpErrorResponse({ status: 409 }));
    expect(await net.submit('tec_la', 'second')).toBe(false);
    expect(net.error()).toContain('Seu comando não foi aplicado');
    expect(api.submit).toHaveBeenCalledTimes(2);
  });
  it('accepts a new time cycle at revision zero and uses its identity for commands', async () => {
    api.create.mockResolvedValueOnce(snapshot(20));
    const net = TestBed.inject(TerminalNetwork);
    await net.initialize();
    const reset = snapshot(0);
    reset.state.serverSessionId = 'new-time-cycle';
    api.load.mockResolvedValueOnce(reset);
    await net.refresh();
    expect(net.state().serverSessionId).toBe('new-time-cycle');
    await net.submit('tec_la', 'contexto');
    expect(api.submit.mock.calls[0][1]).toMatchObject({
      revision: 0,
      serverSessionId: 'new-time-cycle',
    });
  });
  it('sends the exact input with revision and a UUID, never client puzzle state', async () => {
    const net = TestBed.inject(TerminalNetwork);
    await net.initialize();
    expect(await net.submit('tec_la', '  a 😀  ')).toBe(true);
    const [id, command] = api.submit.mock.calls[0];
    expect(id).toBe(token);
    expect(command).toEqual({
      computerId: 'tec_la',
      text: '  a 😀  ',
      revision: 0,
      serverSessionId: snapshot().state.serverSessionId,
      requestId: expect.stringMatching(/^[0-9a-f-]{36}$/),
    });
  });
  it('blocks overlapping sends and only updates after the response', async () => {
    const net = TestBed.inject(TerminalNetwork);
    await net.initialize();
    TestBed.tick();
    await net.initialize();
    let resolve!: (value: GameResponse) => void;
    api.submit.mockReturnValueOnce(new Promise<GameResponse>((r) => (resolve = r)));
    const pending = net.submit('tec_la', 'first');
    expect(net.busy()).toBe(true);
    expect(await net.submit('tec_la', 'second')).toBe(false);
    expect(api.submit).toHaveBeenCalledTimes(1);
    resolve(snapshot(1));
    await pending;
    expect(net.busy()).toBe(false);
  });
  it('refreshes after an uncertain send without automatically replaying it', async () => {
    const net = TestBed.inject(TerminalNetwork);
    await net.initialize();
    api.submit.mockRejectedValueOnce(new HttpErrorResponse({ status: 0 }));
    api.load.mockResolvedValueOnce(snapshot(1));
    expect(await net.submit('tec_la', 'message')).toBe(false);
    expect(api.submit).toHaveBeenCalledTimes(1);
    expect(api.load).toHaveBeenCalledWith(token);
    expect(net.error()).toContain('Confira o histórico');
  });
});
describe('Terminal HTTP contract', () => {
  it('uses the same-origin API and sends the session only in a header', async () => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    const api = TestBed.inject(TerminalApi);
    const http = TestBed.inject(HttpTestingController);
    const pending = api.load(token);
    const request = http.expectOne('/api/games/current');
    expect(request.request.headers.get('X-Game-Session')).toBe(token);
    request.flush(snapshot());
    expect(await pending).toEqual(snapshot());
    http.verify();
  });
});
