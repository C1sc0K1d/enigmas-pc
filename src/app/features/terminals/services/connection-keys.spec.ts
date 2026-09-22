import { TestBed } from '@angular/core/testing';
import { TerminalNetwork } from './terminal-network.service';
import { COMPUTERS } from '../data/computers';
import { STORAGE_KEY } from '../config/network.config';
import { unlockConnections } from '../testing/unlocked-network';

beforeEach(() => sessionStorage.removeItem(STORAGE_KEY));

const denied = 'Chave não encontrada ou não digitada nos ultimos 30 dias.';
function network() {
  TestBed.configureTestingModule({});
  return TestBed.inject(TerminalNetwork);
}
function solveFlame(net: TerminalNetwork) {
  net.submit('chma_vva', 'dormindo');
  net.submit('chma_vva', 'cldl');
}

describe('Chaves de conexão', () => {
  it.each(['lbr_ent', 'lbr_sda'])(
    'blocks %s on a locked terminal with both sides connected',
    (command) => {
      const net = network();
      net.submit('tec_la', command);
      expect(net.session('tec_la').entries.at(-1)?.output).toBe(denied);
      expect(net.session('tec_la').inputFrom).toBe('chma_vva');
      expect(net.session('chma_vva').outputTo).toBe('tec_la');
      expect(net.session('tec_la').outputTo).toBe('fnt_primdal');
      expect(net.session('fnt_primdal').inputFrom).toBe('tec_la');
    },
  );

  it.each([
    ['lbr_ent', 'acordado'],
    ['lbr_ent', 'dormindo'],
    ['lbr_sda', 'acordado'],
    ['lbr_sda', 'dormindo'],
  ])('disconnects only the requested side with %s while %s', (command, mode) => {
    const net = network();
    unlockConnections(net, ['tec_la']);
    net.submit('tec_la', mode);
    const input = command === 'lbr_ent';
    for (let attempt = 0; attempt < 2; attempt++) {
      net.submit('tec_la', '  ' + command.toUpperCase() + '  ');
      expect(net.session('tec_la').entries.at(-1)).toMatchObject({
        output: input ? 'ENTRADA: nenhum' : 'SAÍDA CONECTADA: nenhum',
        system: true,
      });
      expect(net.session('tec_la').inputFrom).toBe(input ? null : 'chma_vva');
      expect(net.session('chma_vva').outputTo).toBe(input ? null : 'tec_la');
      expect(net.session('tec_la').outputTo).toBe(input ? 'fnt_primdal' : null);
      expect(net.session('fnt_primdal').inputFrom).toBe(input ? 'tec_la' : null);
      expect(net.session('chma_vva').count).toBe(0);
      expect(net.session('fnt_primdal').count).toBe(0);
    }
  });

  it.each(['cncta_ent tec_la', 'cncta_sda inno_m1nvl', 'cncta_ent nenhum', 'cncta_sda nenhum'])(
    'blocks %s on a locked PC without changing any links',
    (command) => {
      const net = network();
      const links = () =>
        COMPUTERS.map(({ id }) => [net.session(id).inputFrom, net.session(id).outputTo]);
      const before = links();
      net.submit('chma_vva', command);
      expect(net.session('chma_vva').entries.at(-1)?.output).toBe(denied);
      expect(links()).toEqual(before);
    },
  );

  it('unlocks the local flame puzzle while asleep without a selected context', () => {
    const net = network();
    solveFlame(net);
    expect(net.session('chma_vva').connectionsUnlocked).toBe(true);
    expect(net.session('tec_la').count).toBe(0);
    net.submit('chma_vva', 'cncta_sda inno_m1nvl');
    expect(net.session('chma_vva').outputTo).toBe('inno_m1nvl');
    expect(net.session('inno_m1nvl').inputFrom).toBe('chma_vva');
    expect(net.session('inno_m1nvl').connectionsUnlocked).toBe(false);
    net.submit('inno_m1nvl', 'cncta_sda sultao_d');
    expect(net.session('inno_m1nvl').entries.at(-1)?.output).toBe(denied);
  });

  it('lets an unlocked PC choose a locked PC as its input', () => {
    const net = network();
    solveFlame(net);
    net.submit('chma_vva', 'cncta_ent nkai_a');
    expect(net.session('chma_vva').inputFrom).toBe('nkai_a');
    expect(net.session('nkai_a').outputTo).toBe('chma_vva');
    expect(net.session('nkai_a').connectionsUnlocked).toBe(false);
  });

  it('unlocks a receiver on its correct route through the initial connections', () => {
    const net = network();
    net.submit('chma_vva', 'dormindo');
    net.submit('tec_la', 'dormindo');
    net.submit('chma_vva', 'QÓLKA LL JCPFBLJ  BLK ZXLOKQ');
    expect(net.session('tec_la').connectionsUnlocked).toBe(true);
    expect(net.session('chma_vva').connectionsUnlocked).toBe(false);
    net.submit('tec_la', 'cncta_sda sultao_d');
    expect(net.session('sultao_d').inputFrom).toBe('tec_la');
  });

  it('requires the full route even when a local cipher produces the key', () => {
    const net = network();
    net.submit('sultao_d', 'dormindo');
    for (const word of ['TRRSIRR', 'sonho']) {
      net.submit('sultao_d', word);
      expect(net.session('sultao_d').connectionsUnlocked).toBe(false);
    }
    net.submit('sultao_d', 'cncta_sda chma_vva');
    expect(net.session('sultao_d').entries.at(-1)?.output).toBe(denied);
  });

  it('unlocks sultao_d only after all ten ciphers in order', () => {
    const net = network();
    const route = COMPUTERS.find(({ id }) => id === 'sultao_d')!.context.route;
    unlockConnections(
      net,
      route.filter((id) => id !== 'sultao_d'),
    );
    route.forEach((id, index) => {
      if (index + 1 < route.length) net.submit(id, 'cncta_sda ' + route[index + 1]);
      net.submit(id, 'dormindo');
    });
    net.submit('chma_vva', 'XXZVVXXVVOXMWY');
    expect(net.session('sultao_d').connectionsUnlocked).toBe(true);
  });

  it('does not unlock from an awake response, a wrong answer or a plain local key', () => {
    const net = network();
    net.submit('chma_vva', 'cldl');
    expect(net.session('chma_vva').connectionsUnlocked).toBe(false);
    net.submit('chma_vva', 'dormindo');
    for (const text of ['abc', 'fogo']) {
      net.submit('chma_vva', text);
      expect(net.session('chma_vva').connectionsUnlocked).toBe(false);
    }
  });

  it('keeps unlocks after clearing history and changing mode', () => {
    const net = network();
    solveFlame(net);
    net.submit('chma_vva', 'limpa');
    net.submit('chma_vva', 'acordado');
    net.submit('chma_vva', 'cncta_sda nenhum');
    expect(net.session('chma_vva').connectionsUnlocked).toBe(true);
    expect(net.session('chma_vva').outputTo).toBeNull();
    expect(net.session('tec_la').inputFrom).toBeNull();
  });

  it.each(['cncta_ent', 'cncta_sda '])('keeps bare %s as ordinary text while locked', (text) => {
    const net = network();
    net.submit('inno_m1nvl', 'dormindo');
    net.submit('inno_m1nvl', text);
    expect(net.session('inno_m1nvl').entries.at(-1)?.system).toBe(false);
    expect(net.session('inno_m1nvl').entries.at(-1)?.output).not.toBe(denied);
  });
});
