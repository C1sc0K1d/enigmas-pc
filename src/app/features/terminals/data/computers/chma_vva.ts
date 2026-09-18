import { CHAMA_ROUTE } from '../../config/puzzle-routes';
import { createComputer } from '../../functions/create-computer';

export const chma_vva = createComputer(
  {
    id: 'chma_vva',
    serial: 6,
    riddle:
      'Preciso de alimento e ar, mas não tenho boca. Danço, aqueço e deixo cinzas. O que sou?',
    answer: 'fogo',
    context: { route: CHAMA_ROUTE },
    awakePhrases: [
      'Cada ponto daquela luz se move como se estivesse com fome.',
      'A madeira acabou. O clarão ainda procurava alguma coisa.',
      'Guardo o calor de lugares que o céu já esqueceu.',
      'As pequenas luzes se reuniram antes que alguém sentisse o cheiro.',
      'Restou uma sombra na parede. O corpo virou brilho.',
    ],
  },
  { requiredComputerId: null },
);
