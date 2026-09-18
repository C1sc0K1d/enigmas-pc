import { createComputer } from '../../functions/create-computer';
import { decodeChaoticCore } from '../../ciphers/chaotic-core';
import { SULTAO_ROUTE } from '../../config/puzzle-routes';

export const sultao_d = createComputer({
  id: 'sultao_d',
  serial: 2,
  riddle: [
    'Sou um lugar que nunca existiu,',
    'mas nele já caminhastes.',
    '',
    'Posso durar anos sem consumir uma hora,',
    'posso mostrar mortos sem devolvê-los à vida.',
    '',
    'Construo cidades que ninguém ergueu,',
    'entrego lembranças de coisas que jamais aconteceram.',
    '',
    'Enquanto permaneço, minhas mentiras são verdade.',
    'Quando termino, até minhas verdades desaparecem.',
    '',
    'Não posso ser levado comigo,',
    'embora às vezes reste algo de mim.'
  ].join('\n'),
  answer: 'SONHO',
  awakePhrases: [
    'O ruído continua, mesmo quando já não há ninguém tocando.',
    'Tudo gira em torno de um lugar que nunca percebeu vocês.',
    'Há um compasso aqui. Contar não ajuda a encontrá-lo.',
    'Nenhuma vontade move o centro. As bordas obedecem mesmo assim.',
    'Entre duas notas, a distância esqueceu quanto devia medir.',
  ],
  steps: 10,
  encode: decodeChaoticCore,
  context: {
    route: SULTAO_ROUTE,
    revealRouteOnLocalAnswer: true,
    successMessage: [
      'A primeira mentira foi aceita.',
      'Aquilo que não existe agora conhece teu nome.',
      'Não desperte ainda.',
    ].join('\n'),
  },
});
