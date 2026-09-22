import { describeContext } from './describe-context';
import { COMPUTERS } from '../data/computers';

describe('Context formatting', () => {
  it('lists the configured route in order without exposing the answer or ending', () => {
    const computer = {
      ...COMPUTERS[0],
      context: {
        riddle: 'Uma pergunta.',
        answer: 'RESPOSTA OCULTA',
        route: ['a', 'b', 'c'],
        successMessage: 'FINAL OCULTO',
      },
    };
    expect(describeContext(computer)).toBe(
      'Uma pergunta.\n\nINÍCIO: a\nPERCURSO: 3 computadores.\n1. a\n2. b\n3. c\nDESTINO: ' +
        computer.name,
    );
  });
});
