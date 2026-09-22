import { createComputer } from '../../functions/create-computer';

export const h_colinas = createComputer({
  id: 'h_colinas',
  serial: 7,
  riddle: 'Sou um gigante de pedra. Meu pé toca a terra e meu cume encontra as nuvens. O que sou?',
  answer: 'montanha',
  awakePhrases: [
    'Mudaram meu pedestal de lugar. Agora durmo mais perto de vocês.',
    'O vigia envelheceu muito durante uma única ronda.',
    'Pela manhã, mediram outra vez a distância entre a estátua e a porta.',
    'A pedra guarda um calor que não veio do sol.',
    'Trouxeram oferendas secas. Minha sede permaneceu.',
  ],
});
