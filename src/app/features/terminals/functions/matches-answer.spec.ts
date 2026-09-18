import { matchesAnswer } from './matches-answer';

describe('Comparação de respostas', () => {
  it.each([
    ['todo fio encontra o mesmo no', 'TODO FIO ENCONTRA O MESMO NÓ'],
    ['ToDo FiO EnCoNtRa O MeSmO Nó', 'TODO FIO ENCONTRA O MESMO NÓ'],
    ['  no\u0301  ', 'NÓ'],
    ['AÇÃO', 'acao'],
    ['coracao', 'CORAÇÃO'],
    ['a e i o u c', 'À É Í Õ Ü Ç'],
    [' SÔnHÓ ', 'sonho'],
  ])('accepts equivalent answers %s and %s', (actual, expected) => {
    expect(matchesAnswer(actual, expected)).toBe(true);
    expect(matchesAnswer(expected, actual)).toBe(true);
  });

  it.each([
    ['', 'SONHO'],
    ['SONHOS', 'SONHO'],
    ['isto é um sonho', 'SONHO'],
    ['ISTO E UM SONHO', 'sonho'],
    ['sonho de alguém', 'SONHO'],
    ['um sonho distante', 'SONHO'],
    ['sim, TODO FIO ENCONTRA O MESMO NO', 'TODO FIO ENCONTRA O MESMO NÓ'],
    ['PALCO', 'SONHO'],
    ['TODOFIO', 'TODO FIO'],
    ['TODO  FIO', 'TODO FIO'],
    ['SONHO!', 'SONHO'],
  ])('rejects a changed answer %s against %s', (actual, expected) => {
    expect(matchesAnswer(actual, expected)).toBe(false);
  });
});
