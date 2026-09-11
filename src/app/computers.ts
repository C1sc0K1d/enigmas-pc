export interface ComputerConfig {
  id: string;
  name: string;
  location: string;
  serial: string;
  welcome: string;
  encode: (text: string) => string;
}

// Regra provisória. Cada terminal pode receber sua própria função encode.
const encodeExample = (text: string): string => text.replace(/[a-z]/gi, (letter) => {
  const base = letter >= 'a' && letter <= 'z' ? 97 : 65;
  return String.fromCharCode((letter.charCodeAt(0) - base + 3) % 26 + base);
});

export const COMPUTERS: ComputerConfig[] = [
  {
    id: 'inno_m1nvl', name: 'inno_m1nvl', location: 'BLOCO A / RECEPÇÃO', serial: 'PRS-001-A',
    welcome: 'Toda mensagem passa pelo protocolo de codificação. Encontre uma forma de se fazer entender.',
    encode: encodeExample,
  },
  {
    id: 'sultao_d', name: 'sultao_d', location: 'BLOCO B / ARQUIVO', serial: 'PRS-002-B',
    welcome: 'Os registros nem sempre dizem o que parecem. Escreva sua mensagem.',
    encode: (text) => Array.from(text).reverse().join(''),
  },
  {
    id: 'tec_la', name: 'tec_la', location: 'ESTAÇÃO 03', serial: 'PRS-003',
    welcome: 'Escreva sua mensagem.', encode: encodeExample,
  },
  {
    id: 'nkai_a', name: 'nkai_a', location: 'ESTAÇÃO 04', serial: 'PRS-004',
    welcome: 'Escreva sua mensagem.', encode: encodeExample,
  },
  {
    id: 'grd_s0nhadr', name: 'grd_s0nhadr', location: 'ESTAÇÃO 05', serial: 'PRS-005',
    welcome: 'Escreva sua mensagem.', encode: encodeExample,
  },
  {
    id: 'chma_vva', name: 'chma_vva', location: 'ESTAÇÃO 06', serial: 'PRS-006',
    welcome: 'Escreva sua mensagem.', encode: encodeExample,
  },
  {
    id: 'h_colinas', name: 'h_colinas', location: 'ESTAÇÃO 07', serial: 'PRS-007',
    welcome: 'Escreva sua mensagem.', encode: encodeExample,
  },
  {
    id: 'caosra_st', name: 'caosra_st', location: 'ESTAÇÃO 08', serial: 'PRS-008',
    welcome: 'Escreva sua mensagem.', encode: encodeExample,
  },
  {
    id: 'sr_grdabs', name: 'sr_grdabs', location: 'ESTAÇÃO 09', serial: 'PRS-009',
    welcome: 'Escreva sua mensagem.', encode: encodeExample,
  },
  {
    id: 'fnt_primdal', name: 'fnt_primdal', location: 'ESTAÇÃO 10', serial: 'PRS-010',
    welcome: 'Escreva sua mensagem.', encode: encodeExample,
  },
];
