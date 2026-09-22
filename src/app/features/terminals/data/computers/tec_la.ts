import { createComputer } from '../../functions/create-computer';
import { weaveText } from '../../ciphers/web';
import { WEB_ROUTE } from '../../config/puzzle-routes';

export const tec_la = createComputer({
  id: 'tec_la',
  serial: 3,
  riddle: [
    'Partem separados.',
    'Alguns seguem retos, outros retornam.',
    'Podem nascer distantes e jamais conhecer a origem uns dos outros.',
    '',
    'Ainda assim, para continuar, todos entregam parte de seu caminho ao mesmo lugar.',
    '',
    'Não procure o início.',
    'Não procure o fim.',
    'Nomeie aquilo que inevitavelmente existe quando caminhos diferentes precisam se tornar um só.',
  ].join('\n'),
  answer: 'TODO FIO ENCONTRA O MESMO NÓ',
  encode: weaveText,
  context: {
    route: WEB_ROUTE,
    successMessage: ['O nó foi fechado.', 'O caminho que entrou já não é o caminho que sai.'].join(
      '\n',
    ),
  },
  awakePhrases: [
    'Nenhum fio é criado. Nenhum fio é perdido. Apenas o caminho muda.',
    'A outra margem se afasta a cada ponto que termino.',
    'Senti seus passos muito antes de vocês chegarem.',
    'O vazio suporta meu trabalho. Ainda não suporta o peso de vocês.',
    'Nunca vi o fundo. Conheço cada tensão sobre ele.',
    'Quando a última passagem estiver pronta, talvez não reste ninguém para atravessar.',
  ],
});
