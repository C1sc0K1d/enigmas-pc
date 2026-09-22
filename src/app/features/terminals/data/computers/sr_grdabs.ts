import { createComputer } from '../../functions/create-computer';

export const sr_grdabs = createComputer({
  id: 'sr_grdabs',
  serial: 9,
  riddle:
    'Não sou uma porta, mas decido se ela se abre. Vigio a passagem e impeço quem não pode entrar. Quem sou?',
  answer: 'guardiao',
  awakePhrases: [
    'A caçada continua além do último lugar que vocês conseguem sonhar.',
    'Meus batedores voltaram em silêncio. Nunca precisaram de voz.',
    'Algo os seguia. Agora segue outra coisa.',
    'Reconheço esse rastro, mesmo onde não existe chão.',
    'Hoje vocês saíram vivos. Isso basta para esta noite.',
  ],
});
