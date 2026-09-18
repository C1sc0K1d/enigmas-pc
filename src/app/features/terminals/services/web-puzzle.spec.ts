import { TestBed } from '@angular/core/testing';
import { encodeCaesar } from '../ciphers/caesar';
import { unweaveText } from '../ciphers/web';
import { unlockConnections } from '../testing/unlocked-network';
import { COMPUTERS } from '../data/computers';
import { STORAGE_KEY } from '../config/network.config';
import { describeRoute } from '../functions/describe-route';
import { describeContext } from '../functions/describe-context';
import { TerminalNetwork } from './terminal-network.service';

beforeEach(() => sessionStorage.removeItem(STORAGE_KEY));

describe('Enigma da Tecelã', () => {
  const web = COMPUTERS.find((computer) => computer.id === 'tec_la')!;
  const answer = 'TODO FIO ENCONTRA O MESMO NÓ';
  const entry = 'QÓLKA LL JCPFBLJ  BLK ZXLOKQ';
  const inscription = 'TÓOND OO MFSIEOM  EON CAORNT';
  const success = 'O nó foi fechado.\nO caminho que entrou já não é o caminho que sai.';

  function network(context = true) {
    TestBed.configureTestingModule({});
    const net = TestBed.inject(TerminalNetwork);
    unlockConnections(net);
    net.submit('chma_vva', 'dormindo');
    net.submit('tec_la', 'dormindo');
    if (context) net.submit('tec_la', 'contexto');
    return net;
  }

  it('shows the riddle and the two-PC route without revealing the answer', () => {
    expect(web.context.route).toEqual(['chma_vva', 'tec_la']);
    const context = describeContext(web);
    expect(context).toContain('Partem separados.');
    expect(context).toContain('PERCURSO: 2 computadores.\n1. chma_vva\n2. tec_la');
    expect(context).not.toContain(answer);
    expect(context).not.toContain(success);
  });

  it.each([true, false])(
    'recognizes the full answer from chma_vva (context selected: %s)',
    (context) => {
      const net = network(context);
      net.submit('chma_vva', entry);
      expect(net.session('tec_la').entries.at(-1)).toMatchObject({
        text: inscription,
        output: answer + '\n' + success,
        source: 'chma_vva',
      });
      expect(net.session('chma_vva').entries.at(-1)?.output).toContain(success);
      // Completion stops at tec_la even with its initial output still connected.
      expect(net.session('fnt_primdal').count).toBe(0);
    },
  );

  it('accepts lowercase while preserving accents and internal spaces', () => {
    const net = network();
    net.submit('chma_vva', entry.toLowerCase());
    expect(net.session('tec_la').entries.at(-1)?.output).toBe(
      answer.toLowerCase() + '\n' + success,
    );
  });

  it.each([
    'TODO FIO ENCONTRA O MESMO NO',
    'todo fio encontra o mesmo no',
    'ToDo FiO EnCoNtRa O MeSmO Nó',
    'todo fio encontra o mesmo no\u0301',
  ])('accepts and unlocks the normalized answer %s through the full route', (result) => {
    TestBed.configureTestingModule({});
    const net = TestBed.inject(TerminalNetwork);
    net.submit('chma_vva', 'dormindo');
    net.submit('tec_la', 'dormindo');
    expect(net.session('tec_la').connectionsUnlocked).toBe(false);
    const payload = unweaveText(result);
    net.submit('chma_vva', encodeCaesar(payload, -3));
    expect(net.session('tec_la').entries.at(-1)).toMatchObject({
      text: payload,
      output: result + '\n' + success,
      source: 'chma_vva',
    });
    expect(net.session('tec_la').connectionsUnlocked).toBe(true);
    expect(net.session('fnt_primdal').count).toBe(0);
  });

  it.each([null, 'tec_la', 'fnt_primdal'])(
    'stops on its key regardless of output connection or selected destination %s',
    (destination) => {
      TestBed.configureTestingModule({});
      const net = TestBed.inject(TerminalNetwork);
      for (const id of ['chma_vva', 'tec_la', 'fnt_primdal']) net.submit(id, 'dormindo');
      if (destination) net.submit(destination, 'contexto');
      const result = 'todo fio encontra o mesmo no';
      const payload = unweaveText(result);
      net.submit('tec_la', payload);
      expect(net.session('tec_la').entries.at(-1)?.output).toBe(result + '\n' + describeRoute(web));
      expect(net.session('tec_la').connectionsUnlocked).toBe(false);
      expect(net.session('tec_la').outputTo).toBe('fnt_primdal');
      expect(net.session('fnt_primdal').count).toBe(0);
      net.submit('chma_vva', encodeCaesar(payload, -3));
      expect(net.session('tec_la').entries.at(-1)?.output).toBe(result + '\n' + success);
      expect(net.session('chma_vva').entries.at(-1)?.output).toContain(success);
      expect(net.session('tec_la').connectionsUnlocked).toBe(true);
      expect(net.session('fnt_primdal').count).toBe(0);
    },
  );

  it('shows the route without unlocking when the key arrives from the wrong origin', () => {
    TestBed.configureTestingModule({});
    const net = TestBed.inject(TerminalNetwork);
    unlockConnections(net, ['fnt_primdal']);
    net.submit('tec_la', 'dormindo');
    net.submit('fnt_primdal', 'cncta_sda tec_la');
    net.submit('fnt_primdal', 'dormindo');
    net.submit('fnt_primdal', entry);
    expect(net.session('tec_la').entries.at(-1)?.output).toBe(answer + '\n' + describeRoute(web));
    expect(net.session('fnt_primdal').entries.at(-1)?.output).toContain(describeRoute(web));
    expect(net.session('tec_la').connectionsUnlocked).toBe(false);
    expect(net.session('fnt_primdal').count).toBe(1);
    expect(net.session('tec_la').entries.at(-1)?.output).not.toContain(success);
  });

  it('does not award an incorrect phrase on the correct route', () => {
    const net = network();
    net.submit('tec_la', 'lbr_sda');
    net.submit('chma_vva', 'contexto');
    net.submit('chma_vva', 'PORTA');
    expect(net.session('chma_vva').entries.at(-1)?.output).toBe(
      'TRANSMISSÃO INTERROMPIDA: resposta inválida.',
    );
  });

  it('permutes local messages without substituting letters or awarding the route ending', () => {
    const net = network(false);
    net.submit('tec_la', 'cncta_sda nenhum');
    for (const [input, output] of [
      ['PORTA', 'PRATO'],
      ['SOOHN', 'SONHO'],
      [inscription, answer + '\n' + describeRoute(web)],
    ]) {
      net.submit('tec_la', input);
      expect(net.session('tec_la').entries.at(-1)?.output).toBe(output);
    }
  });

  it('keeps awake replies and interrupts incoming transmissions while awake', () => {
    const net = network();
    net.submit('tec_la', 'acordado');
    net.submit('chma_vva', entry);
    expect(web.awakePhrases).toContain(net.session('tec_la').entries.at(-1)?.output);
    expect(net.session('chma_vva').entries.at(-1)?.output).toBe(
      'TRANSMISSÃO INTERROMPIDA: tec_la está acordado.',
    );
  });
});
