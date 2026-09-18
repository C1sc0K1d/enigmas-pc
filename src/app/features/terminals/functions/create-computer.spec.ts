import { createComputer } from './create-computer';
import { ComputerDefinition } from '../models/computer.model';

const definition: ComputerDefinition = {
  id: 'beta',
  serial: 12,
  riddle: 'Qual palavra?',
  answer: 'segredo',
  awakePhrases: ['Estou aqui.'],
};

describe('Computer factory', () => {
  it('creates a PC for a different campaign with independent routes and connections', () => {
    const computer = createComputer(definition, {
      puzzleOrder: ['alpha', 'beta', 'gamma'],
      requiredComputerId: null,
      initialConnectionChain: ['alpha', 'beta'],
    });
    expect(computer.context.route).toEqual(['gamma', 'alpha', 'beta']);
    expect(computer.inputFrom).toBe('alpha');
    expect(computer.outputTo).toBeNull();
    expect(computer.encode('XYZ')).toBe('ABC');
    expect(computer.serial).toBe('PRS-012');
  });
  it('supports a custom route and cipher without depending on the default campaign order', () => {
    const computer = createComputer(
      {
        ...definition,
        name: 'Segundo PC',
        encode: (text) => text.toUpperCase(),
        context: { route: ['alpha', 'beta'], successMessage: 'Concluído.' },
      },
      { initialConnectionChain: [], requiredComputerId: null },
    );
    expect(computer.name).toBe('Segundo PC');
    expect(computer.context.route).toEqual(['alpha', 'beta']);
    expect(computer.context.successMessage).toBe('Concluído.');
    expect(computer.encode('texto')).toBe('TEXTO');
    expect(computer.inputFrom).toBeNull();
  });

  it('applies the mandatory PC to explicit routes as well as generated routes', () => {
    const computer = createComputer(
      {
        ...definition,
        context: { route: ['alpha', 'beta'] },
      },
      { requiredComputerId: 'gate', initialConnectionChain: [] },
    );
    expect(computer.context.route).toEqual(['alpha', 'gate', 'beta']);
  });
});
