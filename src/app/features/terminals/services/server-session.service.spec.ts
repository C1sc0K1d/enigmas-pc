import { TestBed } from '@angular/core/testing';
import { ServerSession } from './server-session.service';

const reply = (sessionId: string) => ({ ok: true, json: async () => ({ sessionId }) }) as Response;

describe('Server session monitor', () => {
  let stop: (() => void) | undefined;
  afterEach(() => {
    stop?.();
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('checks without cache, detects restart and stops polling on teardown', async () => {
    vi.useFakeTimers();
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(reply('first'))
      .mockResolvedValue(reply('second'));
    vi.stubGlobal('fetch', fetcher);
    const receive = vi.fn();
    stop = TestBed.inject(ServerSession).watch(receive);
    await vi.advanceTimersByTimeAsync(0);
    expect(receive).toHaveBeenLastCalledWith('first');
    expect(fetcher).toHaveBeenCalledWith(
      '/api/session',
      expect.objectContaining({ cache: 'no-store' }),
    );
    await vi.advanceTimersByTimeAsync(10000);
    expect(receive).toHaveBeenLastCalledWith('second');
    stop();
    const count = fetcher.mock.calls.length;
    await vi.advanceTimersByTimeAsync(20000);
    expect(fetcher).toHaveBeenCalledTimes(count);
  });

  it('retains the game on network errors and retries when coming online', async () => {
    vi.useFakeTimers();
    const fetcher = vi
      .fn()
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValue(reply('new'));
    vi.stubGlobal('fetch', fetcher);
    const receive = vi.fn();
    stop = TestBed.inject(ServerSession).watch(receive);
    await vi.advanceTimersByTimeAsync(0);
    expect(receive).not.toHaveBeenCalled();
    window.dispatchEvent(new Event('online'));
    await vi.advanceTimersByTimeAsync(0);
    expect(receive).toHaveBeenCalledWith('new');
  });

  it.each([
    { ok: false },
    { ok: true, json: async () => ({ sessionId: '' }) },
    { ok: true, json: async () => ({ sessionId: 42 }) },
    { ok: true, json: async () => null },
  ])('ignores invalid responses', async (response) => {
    vi.useFakeTimers();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response));
    const receive = vi.fn();
    stop = TestBed.inject(ServerSession).watch(receive);
    await vi.advanceTimersByTimeAsync(0);
    expect(receive).not.toHaveBeenCalled();
  });

  it('aborts a hanging request and permits the next check', async () => {
    vi.useFakeTimers();
    let signal: AbortSignal;
    const fetcher = vi
      .fn()
      .mockImplementationOnce((_url, options) => {
        signal = options.signal;
        return new Promise((_resolve, reject) =>
          signal.addEventListener('abort', () => reject(new Error('aborted'))),
        );
      })
      .mockResolvedValue(reply('restored'));
    vi.stubGlobal('fetch', fetcher);
    const receive = vi.fn();
    stop = TestBed.inject(ServerSession).watch(receive);
    await vi.advanceTimersByTimeAsync(5000);
    expect(signal!.aborted).toBe(true);
    await vi.advanceTimersByTimeAsync(5000);
    expect(receive).toHaveBeenCalledWith('restored');
  });
});
