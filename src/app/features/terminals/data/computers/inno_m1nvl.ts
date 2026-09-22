import { createComputer } from '../../functions/create-computer';
import { decodeMask } from '../../ciphers/mask';
import { HASTUR_ROUTE } from '../../config/puzzle-routes';

export const inno_m1nvl = createComputer({
  id: 'inno_m1nvl',
  serial: 1,
  riddle: [
    'Aqui, ninguém precisa ser quem é.',
    'Um rei pode nascer sem coroa.',
    'Um morto pode falar.',
    'Um estranho pode receber seu nome.',
    '',
    'A mentira só precisa durar enquanto houver olhos sobre ela.',
  ].join('\n'),
  answer: 'PALCO',
  encode: decodeMask,
  context: {
    route: HASTUR_ROUTE,
    successMessage: 'O papel estava vazio. Agora ele pertence a você.',
  },
  awakePhrases: [
    'A plateia foi embora. Ainda sinto os olhos atrás das cortinas.',
    'Há um papel reservado para você desde antes do seu nascimento.',
    'O tecido desbotou. A mancha por baixo continua crescendo.',
    'Alguém pronunciou uma sílaba a mais. Desde então, o quarto parece ocupado.',
    'Reconheci minha assinatura numa carta que ninguém teve coragem de terminar.',
  ],
});
