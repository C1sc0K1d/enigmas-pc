import { GameEvents } from './game-events.service';

describe('Game SSE connection', () => {
  afterEach(() => vi.unstubAllGlobals());
  it('refreshes on notifications and reconnects, ignores heartbeat, and closes on cleanup', () => {
    const source = new EventTarget();
    const close = vi.fn();
    const factory = vi.fn(function () {
      return Object.assign(source, { close });
    });
    vi.stubGlobal('EventSource', factory);
    const changed = vi.fn();
    const stop = new GameEvents().watch(changed);
    expect(factory).toHaveBeenCalledWith('/api/games/events');
    source.dispatchEvent(new Event('open'));
    source.dispatchEvent(new Event('changed'));
    source.dispatchEvent(new Event('heartbeat'));
    source.dispatchEvent(new Event('error'));
    source.dispatchEvent(new Event('open'));
    expect(changed).toHaveBeenCalledTimes(3);
    stop();
    expect(close).toHaveBeenCalledTimes(1);
  });
});
