import { getChainConnections } from './chain-connections';

describe('Initial chain connections', () => {
  it('leaves endpoints open and connects the middle in both directions', () => {
    const chain = ['a', 'b', 'c'];
    expect(getChainConnections('a', chain)).toEqual({ inputFrom: null, outputTo: 'b' });
    expect(getChainConnections('b', chain)).toEqual({ inputFrom: 'a', outputTo: 'c' });
    expect(getChainConnections('c', chain)).toEqual({ inputFrom: 'b', outputTo: null });
  });
  it('leaves PCs outside the chain disconnected', () => {
    expect(getChainConnections('d', ['a', 'b'])).toEqual({ inputFrom: null, outputTo: null });
    expect(getChainConnections('a', [])).toEqual({ inputFrom: null, outputTo: null });
  });
});
