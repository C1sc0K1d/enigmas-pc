import { createComputer } from '../../functions/create-computer';

export const fnt_primdal = createComputer({
  id: 'fnt_primdal',
  serial: 10,
  riddle: 'Sou o primeiro ponto de toda história. Tudo que existe veio depois de mim. O que sou?',
  answer: 'origem',
  awakePhrases: [
    'Esse rosto já passou por mim. Ainda não tinha olhos.',
    'A lama se contrai, ensaiando formas que vocês chamariam de vida.',
    'Cada corpo leva consigo uma pequena parte do que deixou aqui.',
    'As pedras guardam registros de antes de existir alguém para lê-los.',
    'Quanto mais longe a lembrança recua, menos diferença existe entre nós.',
  ],
});
