import { createNetworkState, restoreNetworkState } from './network-state';
import { COMPUTERS } from '../data/computers';
import { CONNECTIONS_VERSION } from '../config/network.config';

describe('Network state', () => {
  it('creates independent sessions for each PC and each new game', () => {
    const first = createNetworkState(COMPUTERS, CONNECTIONS_VERSION);
    const second = createNetworkState(COMPUTERS, CONNECTIONS_VERSION);
    first.computers['inno_m1nvl'].commands.push('abc');
    expect(first.computers['sultao_d'].commands).toEqual([]);
    expect(second.computers['inno_m1nvl'].commands).toEqual([]);
  });
  it.each([null, {}, { computers: {}, destination: null }])(
    'rejects incomplete saved state',
    (saved) => {
      expect(restoreNetworkState(saved, COMPUTERS, CONNECTIONS_VERSION)).toBeNull();
    },
  );
  it('starts locked and restores older sessions without unlocking PCs', () => {
    const saved = createNetworkState(COMPUTERS, CONNECTIONS_VERSION);
    expect(Object.values(saved.computers).every((session) => !session.connectionsUnlocked)).toBe(
      true,
    );
    const legacy = JSON.parse(JSON.stringify(saved));
    for (const session of Object.values(legacy.computers) as Record<string, unknown>[]) {
      delete session['connectionsUnlocked'];
    }
    expect(restoreNetworkState(legacy, COMPUTERS, CONNECTIONS_VERSION)?.state).toEqual(saved);
  });
  it('rejects invalid unlock state', () => {
    const saved = JSON.parse(JSON.stringify(createNetworkState(COMPUTERS, CONNECTIONS_VERSION)));
    saved.computers['chma_vva'].connectionsUnlocked = 'true';
    expect(restoreNetworkState(saved, COMPUTERS, CONNECTIONS_VERSION)).toBeNull();
  });
  it('rejects nonreciprocal connections', () => {
    const saved = createNetworkState(COMPUTERS, CONNECTIONS_VERSION);
    saved.computers['chma_vva'].outputTo = 'inno_m1nvl';
    expect(restoreNetworkState(saved, COMPUTERS, CONNECTIONS_VERSION)).toBeNull();
  });
  it('preserves an existing current-version game without requesting migration', () => {
    const saved = createNetworkState(COMPUTERS, CONNECTIONS_VERSION);
    saved.destination = 'sultao_d';
    saved.computers['chma_vva'].connectionsUnlocked = true;
    saved.computers['sultao_d'].mode = 'dormindo';
    expect(restoreNetworkState(saved, COMPUTERS, CONNECTIONS_VERSION)).toEqual({
      state: saved,
      connectionsMigrated: false,
    });
  });
});
