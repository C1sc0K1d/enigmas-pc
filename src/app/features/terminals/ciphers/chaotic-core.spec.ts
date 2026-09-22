import { decodeChaoticCore } from './chaotic-core';

describe('Núcleo Caótico', () => {
  it.each([
    ['FQQYSDDWW', 'ENTRAR'],
    ['fqqysddww', 'entrar'],
    ['FQ?YSD🙂W#', 'ENTRAR'],
    ['FQQYSDDWWFQQYSDDWW', 'ENTRARENTRAR'],
    ['TRRSIRR', 'SONHO'],
    ['ZZ!ZZZ?Z@', 'YWUYWU'],
    ['F !Q', 'E N'],
    ['', ''],
    ['F', 'E'],
    ['FQ', 'EN'],
    ['FQQY', 'ENT'],
  ])('decodes %s as %s', (input, expected) => {
    expect(decodeChaoticCore(input)).toBe(expected);
  });

  it('restarts both pulses for every message', () => {
    decodeChaoticCore('F');
    expect(decodeChaoticCore('TRRSIRR')).toBe('SONHO');
  });
});
