import { getOutputChain } from './output-chain';

describe('Percurso pelas saídas', () => {
  it('includes a disconnected origin', () => {
    expect(getOutputChain('a', () => null)).toEqual({ route: ['a'], cycleAt: null });
  });
  it('follows the output chain until the last PC', () => {
    const next = (id: string) => ({ a: 'b', b: 'c' })[id] ?? null;
    expect(getOutputChain('a', next)).toEqual({ route: ['a', 'b', 'c'], cycleAt: null });
  });
  it('detects a cycle without adding a PC twice', () => {
    const next = (id: string) => ({ a: 'b', b: 'c', c: 'b' })[id] ?? null;
    expect(getOutputChain('a', next)).toEqual({ route: ['a', 'b', 'c'], cycleAt: 'b' });
  });
});
