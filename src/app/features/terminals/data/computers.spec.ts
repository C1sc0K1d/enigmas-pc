import { COMPUTERS } from './computers';
import { describeContext } from '../functions/describe-context';

describe('Rede de enigmas', () => {
  it('keeps initial links reciprocal and riddle routes valid independently of the connections', () => {
    const byId = new Map(COMPUTERS.map((computer) => [computer.id, computer]));
    for (const computer of COMPUTERS) {
      if (computer.outputTo) expect(byId.get(computer.outputTo)?.inputFrom).toBe(computer.id);
      if (computer.inputFrom) expect(byId.get(computer.inputFrom)?.outputTo).toBe(computer.id);
      const route = computer.context.route;
      if (computer.id === 'chma_vva') {
        expect(route).toEqual(['chma_vva']);
      } else {
        expect(route.filter((id) => id === 'tec_la')).toHaveLength(1);
      }
      expect(route.at(-1)).toBe(computer.id);
      expect(new Set(route).size).toBe(route.length);
      route.forEach((id) => expect(byId.has(id)).toBe(true));
      expect(describeContext(computer)).not.toContain(computer.context.answer);
    }
  });

  it('returns loucura only after applying all four ciphers in the example route', () => {
    const computer = COMPUTERS.find((computer) => computer.id === 'caosra_st')!;
    expect(computer.context.route).toEqual(['inno_m1nvl', 'tec_la', 'grd_s0nhadr', 'caosra_st']);
    let output = 'egtvhjkmnpnpvx';
    for (const id of computer.context.route) {
      expect(output).not.toBe('loucura');
      output = COMPUTERS.find((computer) => computer.id === id)!.encode(output);
    }
    expect(output).toBe(computer.context.answer);
  });
});
