import { weaveText, unweaveText } from './web';

describe('Cifra da Teia', () => {
  it.each([
    ['PORTA', 'PRATO'],
    ['SOOHN', 'SONHO'],
    ['ABCDEFGH', 'ACEGHFDB'],
    ['ABC', 'ACB'],
    ['ABCD', 'ACDB'],
    ['AB', 'AB'],
    ['A', 'A'],
    ['', ''],
    ['A🙂 B!', 'A !B🙂'],
  ])('weaves %s into %s', (input, output) => {
    expect(weaveText(input)).toBe(output);
    expect(unweaveText(output)).toBe(input);
  });

  it.each([
    'TODO FIO ENCONTRA O MESMO NÓ',
    'aA! áÓ🙂\n  ',
    'a\u0301b',
    '   ',
    'x'.repeat(1999) + '🙂',
  ])('preserves characters and supports the inverse in both directions', (input) => {
    const output = weaveText(input);
    expect(Array.from(output).length).toBe(Array.from(input).length);
    expect(Array.from(output).sort()).toEqual(Array.from(input).sort());
    expect(unweaveText(output)).toBe(input);
    expect(weaveText(unweaveText(input))).toBe(input);
  });

  it('uses the whole message including spaces instead of weaving individual words', () => {
    expect(weaveText('AB CD')).toBe('A DCB');
  });
});
