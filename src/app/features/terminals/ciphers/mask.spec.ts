import { decodeMask } from './mask';

describe('Cifra da Máscara', () => {
  it.each([
    ['RT', 'S'],
    ['TR', 'F'],
    ['PO', 'B'],
    ['PORTA', 'BS '],
    ['AA', ' '],
    ['A', ' '],
    ['ZA', ' '],
    ['ab', ' '],
    ['bc', ' '],
    ['aB', ' '],
    ['ABBCZA', '   '],
    ['PPABAALLCCOO', '      '],
    ['AZ', 'M'],
    ['BA', 'N'],
    ['porta', 'bs '],
    ['pO', 'b'],
    ['Po', 'B'],
    ['PPAALLCCOO', '     '],
    ['OQZBKMBDNP', 'PALCO'],
    ['PORTA! RT 123🙂', 'BS ! S 123🙂'],
    ['A-B', ' - '],
    ['ação', ' çã '],
    ['', ''],
  ])('decodes %s as %s', (input, expected) => {
    expect(decodeMask(input)).toBe(expected);
  });

  it('restarts pair grouping for each new message', () => {
    expect(decodeMask('R')).toBe(' ');
    expect(decodeMask('T')).toBe(' ');
    expect(decodeMask('RT')).toBe('S');
  });
});
