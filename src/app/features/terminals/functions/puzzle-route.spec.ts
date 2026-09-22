import { createPuzzleRoute, matchesPuzzleRoute, includeRequiredComputer } from './puzzle-route';

describe('Puzzle routes', () => {
  it('wraps around the order and includes the start and destination', () => {
    expect(createPuzzleRoute(['a', 'b', 'c', 'd'], 'b', 3)).toEqual(['d', 'a', 'b']);
    expect(createPuzzleRoute(['a', 'b'], 'b', 1)).toEqual(['b']);
  });
  it.each([0, -1, 1.5, 4])('rejects invalid length %s', (steps) => {
    expect(() => createPuzzleRoute(['a', 'b', 'c'], 'b', steps)).toThrow();
  });
  it('rejects missing destinations and repeated PCs', () => {
    expect(() => createPuzzleRoute(['a', 'b'], 'c', 1)).toThrow();
    expect(() => createPuzzleRoute(['a', 'a'], 'a', 1)).toThrow();
  });
  it('requires the complete ordered route', () => {
    expect(matchesPuzzleRoute(['a', 'b', 'c'], ['a', 'b', 'c'])).toBe(true);
    expect(matchesPuzzleRoute(['a', 'c', 'b'], ['a', 'b', 'c'])).toBe(false);
    expect(matchesPuzzleRoute(['a', 'b'], ['a', 'b', 'c'])).toBe(false);
  });
});

describe('Mandatory puzzle computer', () => {
  it('inserts after the origin without mutating the configured route', () => {
    const original = ['a', 'b', 'c'];
    expect(includeRequiredComputer(original, 'gate')).toEqual(['a', 'gate', 'b', 'c']);
    expect(original).toEqual(['a', 'b', 'c']);
  });
  it('preserves existing mandatory PCs including the destination', () => {
    expect(includeRequiredComputer(['a', 'gate', 'c'], 'gate')).toEqual(['a', 'gate', 'c']);
    expect(includeRequiredComputer(['a', 'gate'], 'gate')).toEqual(['a', 'gate']);
    expect(includeRequiredComputer(['gate', 'c'], 'gate')).toEqual(['gate', 'c']);
  });
  it('preserves a single destination by placing the mandatory PC before it', () => {
    expect(includeRequiredComputer(['c'], 'gate')).toEqual(['gate', 'c']);
  });
  it('can be disabled for another campaign and rejects empty routes', () => {
    expect(includeRequiredComputer(['a', 'b'], null)).toEqual(['a', 'b']);
    expect(() => includeRequiredComputer([], 'gate')).toThrow();
  });
});
