export interface ComputerContext {
  riddle: string;
  answer: string; // Referência do mestre; nunca exibida pelo comando contexto.
  route: readonly string[]; // Inclui o computador inicial e o destino.
}

export interface ComputerConfig {
  id: string;
  name: string;
  location: string;
  serial: string;
  welcome: string;
  encode: (text: string) => string;
  inputFrom: string | null;
  outputTo: string | null;
  context: ComputerContext;
  awakePhrases: readonly [string, ...string[]];
}

// Ordem dos percursos dos enigmas; não representa as conexões iniciais dos PCs.
export const PUZZLE_ORDER = [
  'inno_m1nvl',
  'grd_s0nhadr',
  'caosra_st',
  'sultao_d',
  'tec_la',
  'nkai_a',
  'chma_vva',
  'h_colinas',
  'sr_grdabs',
  'fnt_primdal',
] as const;

type ComputerId = (typeof PUZZLE_ORDER)[number];

// Cifras e charadas provisórias para demonstrar o jogo.
const encodeExample = (text: string): string =>
  text.replace(/[a-z]/gi, (letter) => {
    const base = letter >= 'a' && letter <= 'z' ? 97 : 65;
    return String.fromCharCode(((letter.charCodeAt(0) - base + 3) % 26) + base);
  });

function createComputer(
  id: ComputerId,
  serial: number,
  riddle: string,
  answer: string,
  awakePhrases: ComputerConfig['awakePhrases'],
  steps = 3,
  encode = encodeExample,
): ComputerConfig {
  if (!Number.isInteger(steps) || steps < 1 || steps > PUZZLE_ORDER.length) {
    throw new Error(`Percurso inválido para ${id}: ${steps}`);
  }
  const index = PUZZLE_ORDER.indexOf(id);
  const at = (offset: number) =>
    PUZZLE_ORDER[(index + offset + PUZZLE_ORDER.length) % PUZZLE_ORDER.length];
  return {
    id,
    name: id,
    location: `ESTAÇÃO ${String(serial).padStart(2, '0')}`,
    serial: `PRS-${String(serial).padStart(3, '0')}`,
    welcome: 'Há algo do outro lado da tela.',
    encode,
    inputFrom: id === 'tec_la' ? 'chma_vva' : id === 'fnt_primdal' ? 'tec_la' : null,
    outputTo: id === 'chma_vva' ? 'tec_la' : id === 'tec_la' ? 'fnt_primdal' : null,
    context: {
      riddle,
      answer,
      route: Array.from({ length: steps }, (_, step) => at(step - steps + 1)),
    },
    awakePhrases,
  };
}

export const COMPUTERS: ComputerConfig[] = [
  createComputer(
    'inno_m1nvl',
    1,
    'Ainda não conheço a culpa. Antes da primeira mentira, todos me possuem. Quem sou?',
    'inocencia',
    [
      'A plateia foi embora. Ainda sinto os olhos atrás das cortinas.',
      'Há um papel reservado para você desde antes do seu nascimento.',
      'O tecido desbotou. A mancha por baixo continua crescendo.',
      'Alguém pronunciou uma sílaba a mais. Desde então, o quarto parece ocupado.',
      'Reconheci minha assinatura numa carta que ninguém teve coragem de terminar.',
    ],
  ),
  createComputer(
    'sultao_d',
    2,
    'Não sou a cabeça nem o reino. Sobre a primeira, anuncio quem governa o segundo. O que sou?',
    'coroa',
    [
      'O ruído continua, mesmo quando já não há ninguém tocando.',
      'Tudo gira em torno de um lugar que nunca percebeu vocês.',
      'Há um compasso aqui. Contar não ajuda a encontrá-lo.',
      'Nenhuma vontade move o centro. As bordas obedecem mesmo assim.',
      'Entre duas notas, a distância esqueceu quanto devia medir.',
    ],
    3,
    (text) => Array.from(text).reverse().join(''),
  ),
  createComputer(
    'tec_la',
    3,
    'Sou uma estrada fina que a agulha leva. Sozinha me enrosco; entrelaçada, viro tecido. O que sou?',
    'linha',
    [
      'A outra margem se afasta a cada ponto que termino.',
      'Senti seus passos muito antes de vocês chegarem.',
      'O vazio suporta meu trabalho. Ainda não suporta o peso de vocês.',
      'Nunca vi o fundo. Conheço cada tensão sobre ele.',
      'Quando a última passagem estiver pronta, talvez não reste ninguém para atravessar.',
    ],
  ),
  createComputer(
    'nkai_a',
    4,
    'Quanto mais luz chega, menos de mim resta. Sem chama, estrela ou lâmpada, cubro tudo. O que sou?',
    'escuridao',
    [
      'O que vocês chamam de séculos mal interrompe meu repouso.',
      'Alguma coisa sem contorno trouxe alimento outra vez.',
      'A pedra esfriou ao meu redor. Não encontrei motivo para me mover.',
      'Ouço a fome chegar antes dos passos.',
      'Os que me servem passam por frestas menores que suas sombras.',
    ],
  ),
  createComputer(
    'grd_s0nhadr',
    5,
    'Posso criar mundos enquanto seus olhos estão fechados. Ao despertar, começo a desaparecer. O que sou?',
    'sonho',
    [
      'A pressão sobre a pedra não alcança o que penso.',
      'Vocês desenham durante o sono lugares que ainda não visitaram.',
      'Uma escada desce por dentro do mesmo degrau.',
      'O sal chegou antes dos nomes. Continuará aqui depois deles.',
      'Às vezes, uma cidade inteira respira no intervalo entre duas ondas.',
    ],
  ),
  createComputer(
    'chma_vva',
    6,
    'Preciso de alimento e ar, mas não tenho boca. Danço, aqueço e deixo cinzas. O que sou?',
    'fogo',
    [
      'Cada ponto daquela luz se move como se estivesse com fome.',
      'A madeira acabou. O clarão ainda procurava alguma coisa.',
      'Guardo o calor de lugares que o céu já esqueceu.',
      'As pequenas luzes se reuniram antes que alguém sentisse o cheiro.',
      'Restou uma sombra na parede. O corpo virou brilho.',
    ],
  ),
  createComputer(
    'h_colinas',
    7,
    'Sou um gigante de pedra. Meu pé toca a terra e meu cume encontra as nuvens. O que sou?',
    'montanha',
    [
      'Mudaram meu pedestal de lugar. Agora durmo mais perto de vocês.',
      'O vigia envelheceu muito durante uma única ronda.',
      'Pela manhã, mediram outra vez a distância entre a estátua e a porta.',
      'A pedra guarda um calor que não veio do sol.',
      'Trouxeram oferendas secas. Minha sede permaneceu.',
    ],
  ),
  createComputer(
    'caosra_st',
    8,
    'Quando a razão perde o trono, faço do absurdo uma lei. Meu nome tem sete letras e começa onde a lógica termina. O que sou?',
    'loucura',
    [
      'Já conversamos. Naquela ocasião, minha voz era outra.',
      'A demonstração terminou quando a plateia começou a entender.',
      'Trouxe a notícia pessoalmente. Queria observar seus rostos.',
      'Vocês chamaram de invenção aquilo que eu apenas descobri como mostrar.',
      'Posso parecer confiável pelo tempo que for necessário.',
    ],
  ),
  createComputer(
    'sr_grdabs',
    9,
    'Não sou uma porta, mas decido se ela se abre. Vigio a passagem e impeço quem não pode entrar. Quem sou?',
    'guardiao',
    [
      'A caçada continua além do último lugar que vocês conseguem sonhar.',
      'Meus batedores voltaram em silêncio. Nunca precisaram de voz.',
      'Algo os seguia. Agora segue outra coisa.',
      'Reconheço esse rastro, mesmo onde não existe chão.',
      'Hoje vocês saíram vivos. Isso basta para esta noite.',
    ],
  ),
  createComputer(
    'fnt_primdal',
    10,
    'Sou o primeiro ponto de toda história. Tudo que existe veio depois de mim. O que sou?',
    'origem',
    [
      'Esse rosto já passou por mim. Ainda não tinha olhos.',
      'A lama se contrai, ensaiando formas que vocês chamariam de vida.',
      'Cada corpo leva consigo uma pequena parte do que deixou aqui.',
      'As pedras guardam registros de antes de existir alguém para lê-los.',
      'Quanto mais longe a lembrança recua, menos diferença existe entre nós.',
    ],
  ),
];

export function describeContext(computer: ComputerConfig): string {
  const { riddle, route } = computer.context;
  return [
    riddle,
    '',
    `INÍCIO: ${route[0]}`,
    `PERCURSO: ${route.length} computador${route.length === 1 ? '' : 'es'}.`,
    `DESTINO: ${computer.name}`,
  ].join('\n');
}
