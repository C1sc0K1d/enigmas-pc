import { encodeCaesar } from './caesar';

describe('Caesar cipher', () => {
  it('wraps both alphabets while preserving other characters', () => {
    expect(encodeCaesar('abc XYZ! ação 123')).toBe('def ABC! dçãr 123');
  });
  it('supports negative and multi-cycle shifts', () => {
    expect(encodeCaesar('AbZ', -3)).toBe('XyW');
    expect(encodeCaesar('AbZ', 29)).toBe('DeC');
  });
});
