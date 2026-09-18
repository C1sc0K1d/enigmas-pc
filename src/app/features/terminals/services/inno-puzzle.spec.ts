import { TestBed } from '@angular/core/testing';
import { unlockConnections } from '../testing/unlocked-network';
import { COMPUTERS } from '../data/computers';
import { STORAGE_KEY } from '../config/network.config';
import { describeRoute } from '../functions/describe-route';
import { describeContext } from '../functions/describe-context';
import { TerminalNetwork } from './terminal-network.service';

beforeEach(() => sessionStorage.removeItem(STORAGE_KEY));

describe('Enigma de Hastur', () => {
  const hastur = COMPUTERS.find((computer) => computer.id === 'inno_m1nvl')!;
  const success = 'O papel estava vazio. Agora ele pertence a você.';

  function connectedNetwork(route: readonly string[] = hastur.context.route, context = true) {
    TestBed.configureTestingModule({});
    const net = TestBed.inject(TerminalNetwork);
    unlockConnections(net);
    route.forEach((id, index) => {
      net.submit(id, 'cncta_sda ' + (route[index + 1] ?? 'nenhum'));
      net.submit(id, 'dormindo');
    });
    if (context) net.submit('inno_m1nvl', 'contexto');
    return net;
  }

  it('shows the new riddle and keeps its answer and ending hidden', () => {
    expect(hastur.context.route).toEqual(['sr_grdabs', 'tec_la', 'inno_m1nvl']);
    const context = describeContext(hastur);
    expect(context).toContain('Aqui, ninguém precisa ser quem é.');
    expect(context).toContain('A mentira só precisa durar enquanto houver olhos sobre ela.');
    expect(context).not.toMatch(/palco|papel estava vazio/i);
  });

  it.each([true, false])('finishes the route with PALCO (context selected: %s)', (context) => {
    const net = connectedNetwork(hastur.context.route, context);
    net.submit('sr_grdabs', 'LMNKWAYYHJ');
    expect(net.session('inno_m1nvl').entries.at(-1)).toMatchObject({
      text: 'OQZBKMBDNP',
      output: 'PALCO\n' + success,
      source: 'tec_la',
    });
    expect(net.session('sr_grdabs').entries.at(-1)?.output).toContain(success);
  });

  it('accepts lowercase output after the complete route', () => {
    const net = connectedNetwork();
    net.submit('sr_grdabs', 'lmnkwayyhj');
    expect(net.session('inno_m1nvl').entries.at(-1)?.output).toBe('palco\n' + success);
  });

  it('allows local experiments without awarding the route ending', () => {
    const net = connectedNetwork(['inno_m1nvl'], false);
    net.submit('inno_m1nvl', 'PORTA');
    expect(net.session('inno_m1nvl').entries.at(-1)?.output).toBe('BS ');
    net.submit('inno_m1nvl', 'OQZBKMBDNP');
    expect(net.session('inno_m1nvl').entries.at(-1)?.output).toBe(
      'PALCO\n' + describeRoute(hastur),
    );
  });

  it('rejects the right answer after a reordered route', () => {
    const net = connectedNetwork(['tec_la', 'sr_grdabs', 'inno_m1nvl']);
    net.submit('tec_la', 'LMNKWAYYHJ');
    expect(net.session('inno_m1nvl').entries.at(-1)?.output).toBe(
      'PALCO\n' + describeRoute(hastur),
    );
    expect(net.session('tec_la').entries.at(-1)?.output).toContain(describeRoute(hastur));
  });

  it('does not award an incorrect answer on the correct route', () => {
    const net = connectedNetwork();
    net.submit('sr_grdabs', 'AAAA');
    expect(net.session('inno_m1nvl').entries.at(-1)?.output).toBe('  ');
    expect(net.session('sr_grdabs').entries.at(-1)?.output).toBe(
      'TRANSMISSÃO INTERROMPIDA: resposta inválida.',
    );
  });

  it('stops when Hastur is awake without applying the mask or showing the ending', () => {
    const net = connectedNetwork();
    net.submit('inno_m1nvl', 'acordado');
    net.submit('sr_grdabs', 'LMNKWAYYHJ');
    expect(hastur.awakePhrases).toContain(net.session('inno_m1nvl').entries.at(-1)?.output);
    expect(net.session('sr_grdabs').entries.at(-1)?.output).toBe(
      'TRANSMISSÃO INTERROMPIDA: inno_m1nvl está acordado.',
    );
  });

  it('rejects PALCO when the mandatory tec_la step is skipped', () => {
    const net = connectedNetwork(['sr_grdabs', 'fnt_primdal', 'inno_m1nvl']);
    net.submit('sr_grdabs', 'IKTVEGVXHJ');
    expect(net.session('inno_m1nvl').entries.at(-1)?.output).toBe(
      'PALCO\n' + describeRoute(hastur),
    );
    expect(net.session('sr_grdabs').entries.at(-1)?.output).toContain(describeRoute(hastur));
  });

  it('preserves a generated blank space when forwarding to the next PC', () => {
    const net = connectedNetwork(['inno_m1nvl', 'tec_la'], false);
    net.submit('inno_m1nvl', 'AB');
    expect(net.session('tec_la').entries.at(-1)).toMatchObject({
      text: ' ',
      output: ' ',
      source: 'inno_m1nvl',
    });
    expect(net.session('tec_la').count).toBe(1);
  });
});
