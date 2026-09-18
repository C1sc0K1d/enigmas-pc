import { TestBed } from '@angular/core/testing';
import { encodeCaesar } from '../ciphers/caesar';
import { COMPUTERS } from '../data/computers';
import { STORAGE_KEY } from '../config/network.config';
import { describeContext } from '../functions/describe-context';
import { unlockConnections } from '../testing/unlocked-network';
import { TerminalNetwork } from './terminal-network.service';

beforeEach(() => sessionStorage.removeItem(STORAGE_KEY));
const chain = ['chma_vva', 'tec_la', 'fnt_primdal'];
function network() {
  TestBed.configureTestingModule({});
  return TestBed.inject(TerminalNetwork);
}

describe('Comandos pela rede', () => {
  it('puts the origin and every output-connected PC to sleep, including locked awake receivers', () => {
    const net = network();
    net.submit('chma_vva', '  DoRmInDo  ');
    for (const id of chain) {
      expect(net.session(id).mode).toBe('dormindo');
      expect(net.session(id).entries.at(-1)).toMatchObject({
        output: 'MODO DORMINDO.',
        system: true,
      });
      expect(net.session(id).count).toBe(0);
      expect(net.session(id).connectionsUnlocked).toBe(false);
    }
    expect(net.session('tec_la').entries.at(-1)?.source).toBe('chma_vva');
    expect(net.session('fnt_primdal').entries.at(-1)?.source).toBe('tec_la');
    expect(net.session('tec_la').commands).toEqual([]);
    expect(net.session('inno_m1nvl').mode).toBe('acordado');
    net.submit('chma_vva', 'abc');
    expect(net.session('fnt_primdal').entries.at(-1)?.output).toBe('gih');
  });

  it('sends sleep only downstream, without following input links', () => {
    const net = network();
    net.submit('tec_la', 'dormindo');
    expect(net.session('chma_vva').mode).toBe('acordado');
    expect(net.session('tec_la').mode).toBe('dormindo');
    expect(net.session('fnt_primdal').mode).toBe('dormindo');
  });

  it.each(['acordado', 'dormindo'])('returns only the last riddle while %s', (mode) => {
    const net = network();
    if (mode === 'dormindo') net.submit('chma_vva', 'dormindo');
    const middleEntries = net.session('tec_la').entries.length;
    net.submit('chma_vva', '  CoNtExTo  ');
    const last = COMPUTERS.find(({ id }) => id === 'fnt_primdal')!;
    expect(net.session('chma_vva').entries.at(-1)?.output).toBe(describeContext(last));
    expect(net.session('fnt_primdal').entries.at(-1)).toMatchObject({
      output: describeContext(last),
      system: true,
      source: 'tec_la',
    });
    expect(net.session('tec_la').entries).toHaveLength(middleEntries);
    expect(net.state().destination).toBe('fnt_primdal');
    for (const id of chain) expect(net.session(id).mode).toBe(mode);
  });

  it('uses the local riddle when there is no output and changes the last PC after disconnecting', () => {
    const net = network();
    net.submit('nkai_a', 'contexto');
    expect(net.state().destination).toBe('nkai_a');
    unlockConnections(net, ['tec_la']);
    net.submit('tec_la', 'lbr_sda');
    net.submit('chma_vva', 'contexto');
    const web = COMPUTERS.find(({ id }) => id === 'tec_la')!;
    expect(net.session('chma_vva').entries.at(-1)?.output).toBe(describeContext(web));
    expect(net.state().destination).toBe('tec_la');
    net.submit('tec_la', 'cncta_sda fnt_primdal');
    net.submit('chma_vva', 'contexto');
    expect(net.state().destination).toBe('fnt_primdal');
  });

  it.each(['lbr_ent', 'lbr_sda'])(
    'leaves the side empty after %s and permits reconnecting',
    (command) => {
      const net = network();
      unlockConnections(net, ['tec_la']);
      net.submit('tec_la', command);
      const input = command === 'lbr_ent';
      expect(net.session('tec_la')[input ? 'inputFrom' : 'outputTo']).toBeNull();
      expect(
        net.session(input ? 'chma_vva' : 'fnt_primdal')[input ? 'outputTo' : 'inputFrom'],
      ).toBeNull();
      net.submit('tec_la', input ? 'cncta_ent chma_vva' : 'cncta_sda fnt_primdal');
      expect(net.session('chma_vva').outputTo).toBe('tec_la');
      expect(net.session('tec_la').inputFrom).toBe('chma_vva');
      expect(net.session('tec_la').outputTo).toBe('fnt_primdal');
      expect(net.session('fnt_primdal').inputFrom).toBe('tec_la');
    },
  );

  it('preserves the full connection chain after accepting a key and forwards later messages', () => {
    const net = network();
    const links = () => chain.map((id) => [net.session(id).inputFrom, net.session(id).outputTo]);
    const initial = links();
    net.submit('chma_vva', 'dormindo');
    net.submit('chma_vva', 'cldl');
    expect(net.session('chma_vva').connectionsUnlocked).toBe(true);
    net.submit('chma_vva', 'QÓLKA LL JCPFBLJ  BLK ZXLOKQ');
    expect(net.session('tec_la').connectionsUnlocked).toBe(true);
    expect(net.session('fnt_primdal').count).toBe(0);
    expect(links()).toEqual(initial);
    net.submit('chma_vva', 'abc');
    expect(net.session('fnt_primdal').entries.at(-1)?.output).toBe('gih');
    expect(links()).toEqual(initial);
  });

  it('reports a cycle without choosing an arbitrary final riddle or looping forever', () => {
    const net = network();
    unlockConnections(net, ['fnt_primdal']);
    net.submit('nkai_a', 'contexto');
    net.submit('fnt_primdal', 'cncta_sda chma_vva');
    net.submit('chma_vva', 'contexto');
    expect(net.session('chma_vva').entries.at(-1)?.output).toBe(
      'TRANSMISSÃO INTERROMPIDA: ciclo detectado em chma_vva.',
    );
    expect(net.state().destination).toBe('nkai_a');
    net.submit('chma_vva', 'dormindo');
    for (const id of chain) expect(net.session(id).mode).toBe('dormindo');
    expect(net.session('chma_vva').entries.at(-1)?.output).toContain('ciclo detectado');
    expect(net.session('tec_la').entries).toHaveLength(1);
  });

  it.each(['dormindo', 'contexto'])(
    'keeps cipher-generated %s as data instead of executing it',
    (word) => {
      const net = network();
      net.submit('chma_vva', 'dormindo');
      net.submit('tec_la', 'acordado');
      net.submit('chma_vva', encodeCaesar(word, -3));
      expect(net.session('tec_la').entries.at(-1)).toMatchObject({ text: word, system: false });
      expect(net.session('tec_la').mode).toBe('acordado');
      expect(net.state().destination).toBeNull();
      expect(net.session('chma_vva').entries.at(-1)?.output).toBe(
        'TRANSMISSÃO INTERROMPIDA: tec_la está acordado.',
      );
    },
  );
});
