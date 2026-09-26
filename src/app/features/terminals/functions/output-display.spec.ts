import { outputDisplayParts } from './output-display';
import { TerminalEntry } from '../models/network.model';

const entry = (output: string, outputParts?: TerminalEntry['outputParts']): TerminalEntry => ({
  id: 0,
  text: 'input',
  output,
  outputParts,
  system: false,
});

describe('Cipher output display', () => {
  it('marks each space, including repeated and trailing spaces, without replacing text', () => {
    const text = '  A  B \t\n';
    const parts = outputDisplayParts(entry(text, [{ text, cipher: true }]));
    expect(parts.filter((part) => part.space)).toHaveLength(5);
    expect(parts.filter((part) => part.space).every((part) => part.text === ' ')).toBe(true);
    expect(parts.map((part) => part.text).join('')).toBe(text);
  });
  it('keeps trace labels and completion messages undecorated', () => {
    const parts = outputDisplayParts(
      entry('tec_la: A B\nO nó foi fechado.', [
        { text: 'tec_la: ' },
        { text: 'A B', cipher: true },
        { text: '\nO nó foi fechado.' },
      ]),
    );
    expect(parts.filter((part) => part.space)).toHaveLength(1);
    expect(parts.map((part) => part.text).join('')).toBe('tec_la: A B\nO nó foi fechado.');
  });
  it('preserves older saved entries without guessing which text came from a cipher', () => {
    expect(outputDisplayParts(entry('A B'))).toEqual([{ text: 'A B', space: false }]);
  });
  it('preserves literal dots and blank output', () => {
    expect(outputDisplayParts(entry('·', [{ text: '·', cipher: true }]))).toEqual([
      { text: '·', space: false },
    ]);
    expect(outputDisplayParts(entry('', [{ text: '', cipher: true }]))).toEqual([]);
  });
});
