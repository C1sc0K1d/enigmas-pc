import { TestBed } from '@angular/core/testing';
import { unlockConnections } from '../testing/unlocked-network';
import { Terminal } from '../components/terminal/terminal';
import { COMPUTERS } from '../data/computers';
import { PUZZLE_ORDER } from '../config/puzzle-routes';
import { TerminalNetwork } from './terminal-network.service';

beforeEach(() => sessionStorage.removeItem('presos-terminal-network-v1'));

describe('Transmissão automática', () => {
  function network() {
    TestBed.configureTestingModule({});
    const net = TestBed.inject(TerminalNetwork);
    unlockConnections(net);
    return net;
  }

  it('starts with only chma_vva -> tec_la -> fnt_primdal and forwards through the chain', () => {
    const net = network();
    for (const computer of COMPUTERS) {
      expect(net.session(computer.id).inputFrom).toBe(
        computer.id === 'tec_la' ? 'chma_vva' : computer.id === 'fnt_primdal' ? 'tec_la' : null,
      );
      expect(net.session(computer.id).outputTo).toBe(
        computer.id === 'chma_vva' ? 'tec_la' : computer.id === 'tec_la' ? 'fnt_primdal' : null,
      );
    }
    net.submit('chma_vva', 'dormindo');
    net.submit('tec_la', 'dormindo');
    net.submit('fnt_primdal', 'dormindo');
    net.submit('chma_vva', 'abc');
    expect(net.session('tec_la').entries.at(-1)).toMatchObject({
      text: 'def',
      output: 'dfe',
      source: 'chma_vva',
    });
    expect(net.session('fnt_primdal').entries.at(-1)).toMatchObject({
      text: 'dfe',
      output: 'gih',
      source: 'tec_la',
    });
    expect(net.session('inno_m1nvl').count).toBe(0);
  });

  it('keeps the chma_vva puzzle local even with its output connected to tec_la', () => {
    const net = network();
    net.submit('chma_vva', 'contexto');
    expect(net.session('chma_vva').entries.at(-1)?.output).toContain('DESTINO: fnt_primdal');
    net.submit('chma_vva', 'dormindo');
    net.submit('chma_vva', 'cldl');
    expect(net.session('chma_vva').entries.at(-1)?.output).toBe(
      'fogo\nDESTINO ALCANÇADO: chma_vva.',
    );
    expect(net.session('chma_vva').outputTo).toBe('tec_la');
    expect(net.session('tec_la').count).toBe(0);
    expect(net.session('fnt_primdal').count).toBe(0);
  });

  it.each([undefined, 2])(
    'migrates saved connections version %s without erasing conversation or mode',
    async (version) => {
      await TestBed.configureTestingModule({ imports: [Terminal] }).compileComponents();
      const fixture = TestBed.createComponent(Terminal);
      fixture.componentRef.setInput('computer', COMPUTERS[0]);
      await fixture.whenStable();
      const net = TestBed.inject(TerminalNetwork);
      net.submit('inno_m1nvl', 'dormindo');
      net.submit('inno_m1nvl', 'mensagem preservada');
      const saved = JSON.parse(JSON.stringify(net.state()));
      saved.connectionsVersion = version;
      PUZZLE_ORDER.forEach((id, index) => {
        saved.computers[id].inputFrom =
          version === 2
            ? id === 'fnt_primdal'
              ? 'chma_vva'
              : null
            : PUZZLE_ORDER[(index + PUZZLE_ORDER.length - 1) % PUZZLE_ORDER.length];
        saved.computers[id].outputTo =
          version === 2
            ? id === 'chma_vva'
              ? 'fnt_primdal'
              : null
            : PUZZLE_ORDER[(index + 1) % PUZZLE_ORDER.length];
      });
      sessionStorage.setItem('presos-terminal-network-v1', JSON.stringify(saved));
      TestBed.resetTestingModule();
      await TestBed.configureTestingModule({ imports: [Terminal] }).compileComponents();
      const reloaded = TestBed.createComponent(Terminal);
      reloaded.componentRef.setInput('computer', COMPUTERS[0]);
      await reloaded.whenStable();
      const restored = TestBed.inject(TerminalNetwork);
      for (const computer of COMPUTERS) {
        expect(restored.session(computer.id).inputFrom).toBe(
          computer.id === 'tec_la' ? 'chma_vva' : computer.id === 'fnt_primdal' ? 'tec_la' : null,
        );
        expect(restored.session(computer.id).outputTo).toBe(
          computer.id === 'chma_vva' ? 'tec_la' : computer.id === 'tec_la' ? 'fnt_primdal' : null,
        );
      }
      expect(restored.session('inno_m1nvl').entries).toEqual(saved.computers.inno_m1nvl.entries);
      expect(restored.session('inno_m1nvl').mode).toBe('dormindo');
      expect(restored.session('inno_m1nvl').count).toBe(1);
      expect(
        JSON.parse(sessionStorage.getItem('presos-terminal-network-v1')!).connectionsVersion,
      ).toBe(3);
    },
  );
  it('forwards through all four PCs and stops at the selected destination', () => {
    const net = network();
    net.submit('caosra_st', 'contexto');
    for (const id of ['inno_m1nvl', 'tec_la', 'grd_s0nhadr', 'caosra_st'])
      net.submit(id, 'dormindo');
    net.submit('inno_m1nvl', 'cncta_sda tec_la');
    net.submit('tec_la', 'cncta_sda grd_s0nhadr');
    net.submit('grd_s0nhadr', 'cncta_sda caosra_st');
    net.submit('inno_m1nvl', 'egtvhjkmnpnpvx');
    expect(net.session('inno_m1nvl').entries.at(-1)?.output).toContain('caosra_st: loucura');
    expect(net.session('grd_s0nhadr').entries.at(-1)).toMatchObject({
      text: 'fiowolu',
      output: 'ilrzrox',
      source: 'tec_la',
    });
    expect(net.session('caosra_st').entries.at(-1)).toMatchObject({
      text: 'ilrzrox',
      output: 'loucura\nDESTINO ALCANÇADO: caosra_st.',
      source: 'grd_s0nhadr',
    });
    expect(net.session('sultao_d').entries).toHaveLength(0);
  });

  it('updates reciprocal connections and removes displaced links', () => {
    const net = network();
    net.submit('inno_m1nvl', 'cncta_sda grd_s0nhadr');
    net.submit('sultao_d', 'cncta_sda tec_la');
    net.submit('nkai_a', 'cncta_sda chma_vva');
    net.submit('inno_m1nvl', ' CNCTA_SDA  tec_la ');
    expect(net.session('inno_m1nvl').outputTo).toBe('tec_la');
    expect(net.session('tec_la').inputFrom).toBe('inno_m1nvl');
    expect(net.session('grd_s0nhadr').inputFrom).toBeNull();
    expect(net.session('sultao_d').outputTo).toBeNull();
    net.submit('tec_la', 'cncta_ent nkai_a');
    expect(net.session('nkai_a').outputTo).toBe('tec_la');
    expect(net.session('tec_la').inputFrom).toBe('nkai_a');
    expect(net.session('inno_m1nvl').outputTo).toBeNull();
    expect(net.session('chma_vva').inputFrom).toBeNull();
    net.submit('tec_la', 'cncta_ent nenhum');
    expect(net.session('tec_la').inputFrom).toBeNull();
    expect(net.session('nkai_a').outputTo).toBeNull();
  });

  it('queries connections and rejects unknown PCs, extra arguments and self-connections', () => {
    const net = network();
    const original = net.session('inno_m1nvl').outputTo;
    for (const command of [
      'cncta_sda inexistente',
      'cncta_sda inno_m1nvl',
      'cncta_sda tec_la extra',
    ]) {
      net.submit('inno_m1nvl', command);
      expect(net.session('inno_m1nvl').outputTo).toBe(original);
    }
    net.submit('inno_m1nvl', 'sda');
    expect(net.session('inno_m1nvl').entries.at(-1)?.output).toBe('SAÍDA CONECTADA: nenhum');
    net.submit('inno_m1nvl', 'entd');
    expect(net.session('inno_m1nvl').entries.at(-1)?.output).toBe('ENTRADA: nenhum');
  });

  it('treats connection keywords without a PC name as ordinary messages in both modes', () => {
    const net = network();
    const examples = [
      ['cncta_ent', 'hk _i '],
      ['cncta_sda ', 'hk _x  '],
      ['  CNCTA_ENT\t', '  HK _I \t'],
      ['cncta_sda\t \n', 'hk _x \t \n'],
    ];
    for (const [text] of examples) {
      net.submit('inno_m1nvl', text);
      const entry = net.session('inno_m1nvl').entries.at(-1)!;
      expect(entry.system).toBe(false);
      expect(entry.text).toBe(text);
      expect(COMPUTERS[0].awakePhrases).toContain(entry.output);
    }
    expect(net.session('inno_m1nvl').inputFrom).toBeNull();
    expect(net.session('inno_m1nvl').outputTo).toBeNull();
    net.submit('inno_m1nvl', 'cncta_sda nenhum');
    net.submit('inno_m1nvl', 'dormindo');
    for (const [text, output] of examples) {
      net.submit('inno_m1nvl', text);
      expect(net.session('inno_m1nvl').entries.at(-1)).toMatchObject({
        text,
        output,
        system: false,
      });
    }
    expect(net.session('inno_m1nvl').count).toBe(8);
  });
  it('handles circular networks without visiting any computer twice', () => {
    const net = network();
    PUZZLE_ORDER.forEach((id, index) =>
      net.submit(id, 'cncta_sda ' + PUZZLE_ORDER[(index + 1) % PUZZLE_ORDER.length]),
    );
    for (const computer of COMPUTERS) net.submit(computer.id, 'dormindo');
    net.submit('inno_m1nvl', 'abc');
    for (const computer of COMPUTERS) expect(net.session(computer.id).count).toBe(1);
    expect(net.session('inno_m1nvl').entries.at(-1)?.output).toContain('ciclo detectado');
  });

  it('stops on an awake receiver and on a disconnected output', () => {
    const net = network();
    net.submit('inno_m1nvl', 'cncta_sda grd_s0nhadr');
    net.submit('caosra_st', 'contexto');
    net.submit('inno_m1nvl', 'dormindo');
    net.submit('grd_s0nhadr', 'acordado');
    net.submit('inno_m1nvl', 'abc');
    expect(net.session('inno_m1nvl').entries.at(-1)?.output).toBe(
      'TRANSMISSÃO INTERROMPIDA: grd_s0nhadr está acordado.',
    );
    expect(net.session('grd_s0nhadr').count).toBe(1);
    expect(net.session('caosra_st').count).toBe(0);
    net.submit('inno_m1nvl', 'cncta_sda nenhum');
    net.submit('inno_m1nvl', 'abc');
    expect(net.session('inno_m1nvl').entries.at(-1)?.output).toBe(
      'TRANSMISSÃO INTERROMPIDA: inno_m1nvl está sem saída.',
    );
  });

  it('treats command-like received words as data and keeps local commands off the network', () => {
    const net = network();
    net.submit('inno_m1nvl', 'dormindo');
    net.submit('grd_s0nhadr', 'dormindo');
    net.submit('grd_s0nhadr', 'cncta_sda nenhum');
    net.submit('inno_m1nvl', 'cncta_sda grd_s0nhadr');
    net.submit('inno_m1nvl', 'kmhjlnoqzb'); // Máscara => limpa; must be encrypted, not executed remotely.
    expect(net.session('grd_s0nhadr').entries.at(-1)).toMatchObject({
      text: 'limpa',
      output: 'olpsd',
    });
    const count = net.session('grd_s0nhadr').entries.length;
    net.submit('inno_m1nvl', '/segredos');
    net.submit('inno_m1nvl', 'entd');
    net.submit('inno_m1nvl', 'limpa');
    expect(net.session('grd_s0nhadr').entries).toHaveLength(count);
  });

  it('reports a destination reached by the wrong start or number of computers', () => {
    const net = network();
    unlockConnections(net);
    net.submit('caosra_st', 'contexto');
    net.submit('inno_m1nvl', 'cncta_sda caosra_st');
    net.submit('inno_m1nvl', 'dormindo');
    net.submit('caosra_st', 'dormindo');
    net.submit('inno_m1nvl', 'abc');
    expect(net.session('inno_m1nvl').entries.at(-1)?.output).toBe(
      'TRANSMISSÃO INTERROMPIDA: percurso inválido.',
    );
  });

  it('restores connections, modes, destination and received history after reloading the app', async () => {
    await TestBed.configureTestingModule({ imports: [Terminal] }).compileComponents();
    const fixture = TestBed.createComponent(Terminal);
    fixture.componentRef.setInput('computer', COMPUTERS[0]);
    await fixture.whenStable();
    const net = TestBed.inject(TerminalNetwork);
    net.submit('caosra_st', 'contexto');
    net.submit('inno_m1nvl', 'cncta_sda caosra_st');
    net.submit('inno_m1nvl', 'dormindo');
    net.submit('caosra_st', 'dormindo');
    net.submit('inno_m1nvl', 'abc');
    const snapshot = JSON.parse(JSON.stringify(net.state()));
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({ imports: [Terminal] }).compileComponents();
    const reloaded = TestBed.createComponent(Terminal);
    reloaded.componentRef.setInput('computer', COMPUTERS[7]);
    await reloaded.whenStable();
    expect(JSON.parse(JSON.stringify(TestBed.inject(TerminalNetwork).state()))).toEqual(snapshot);
  });
});
