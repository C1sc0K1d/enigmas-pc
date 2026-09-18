import { TestBed } from '@angular/core/testing';
import { unlockConnections } from '../testing/unlocked-network';
import { COMPUTERS } from '../data/computers';
import { SULTAO_ROUTE } from '../config/puzzle-routes';
import { describeRoute } from '../functions/describe-route';
import { describeContext } from '../functions/describe-context';
import { TerminalNetwork } from './terminal-network.service';

beforeEach(() => sessionStorage.removeItem('presos-terminal-network-v1'));

describe('Enigma de sultao_d', () => {
  const sultao = COMPUTERS.find((computer) => computer.id === 'sultao_d')!;
  const success =
    'A primeira mentira foi aceita.\nAquilo que não existe agora conhece teu nome.\nNão desperte ainda.';

  function connectedNetwork(route: readonly string[] = SULTAO_ROUTE, context = true) {
    TestBed.configureTestingModule({});
    const net = TestBed.inject(TerminalNetwork);
    unlockConnections(net);
    route.forEach((id, index) => {
      net.submit(id, 'cncta_sda ' + (route[index + 1] ?? 'nenhum'));
      net.submit(id, 'dormindo');
    });
    if (context) net.submit('sultao_d', 'contexto');
    return net;
  }

  it('uses every PC once, keeps the required endpoints and conceals the solution', () => {
    expect(sultao.context.route).toEqual(SULTAO_ROUTE);
    expect(SULTAO_ROUTE.slice(0, 2)).toEqual(['chma_vva', 'tec_la']);
    expect(SULTAO_ROUTE.at(-1)).toBe('sultao_d');
    expect([...SULTAO_ROUTE].sort()).toEqual(COMPUTERS.map((computer) => computer.id).sort());
    const context = describeContext(sultao);
    expect(context).toContain('Sou um lugar que nunca existiu,\nmas nele já caminhastes.');
    expect(context).toContain('10 computadores');
    expect(context).toContain(SULTAO_ROUTE.map((id, index) => `${index + 1}. ${id}`).join('\n'));
    expect(context).not.toMatch(/sonho|primeira mentira|pulso|sacrifício/i);
  });

  it.each([true, false])('finishes the full route with SONHO (context selected: %s)', (context) => {
    const net = connectedNetwork(SULTAO_ROUTE, context);
    // Caesar, Web, four Caesar steps, Mask and two Caesar steps yield TRRSIRR.
    net.submit('chma_vva', 'XXZVVXXVVOXMWY');
    expect(net.session('sultao_d').entries.at(-1)).toMatchObject({
      text: 'TRRSIRR',
      output: 'SONHO\n' + success,
      source: 'caosra_st',
    });
    expect(net.session('chma_vva').entries.at(-1)?.output).toContain(success);
    for (const id of SULTAO_ROUTE) expect(net.session(id).count).toBe(1);
  });

  it('accepts the answer without case sensitivity', () => {
    const net = connectedNetwork();
    net.submit('chma_vva', 'xxzvvxxvvoxmwy');
    expect(net.session('sultao_d').entries.at(-1)?.output).toBe('sonho\n' + success);
  });

  it('does not award completion for a different decoded word', () => {
    const net = connectedNetwork();
    net.submit('chma_vva', 'JCLAUCWAUJWHCJEHWY');
    expect(net.session('sultao_d').entries.at(-1)?.output).toBe('ENTRAR');
    expect(net.session('chma_vva').entries.at(-1)?.output).toBe(
      'TRANSMISSÃO INTERROMPIDA: resposta inválida.',
    );
  });

  it('rejects a reordered route even when its length, endpoints and answer match', () => {
    const route: string[] = [...SULTAO_ROUTE];
    [route[3], route[4]] = [route[4], route[3]];
    const net = connectedNetwork(route);
    net.submit('chma_vva', 'XXZVVXXVVOXMWY');
    expect(net.session('sultao_d').entries.at(-1)?.output).toBe('SONHO\n' + describeRoute(sultao));
    expect(net.session('chma_vva').entries.at(-1)?.output).toContain(describeRoute(sultao));
  });

  it('does not award completion when the first PC is skipped', () => {
    const net = connectedNetwork(SULTAO_ROUTE.slice(1));
    net.submit('tec_la', 'AACYYAAYYRAPZB');
    expect(net.session('sultao_d').entries.at(-1)?.output).toBe('SONHO\n' + describeRoute(sultao));
    expect(net.session('tec_la').entries.at(-1)?.output).toContain(describeRoute(sultao));
  });

  it('allows local cipher experiments without awarding the full-route ending', () => {
    const net = connectedNetwork(['sultao_d'], false);
    net.submit('sultao_d', 'TRRSIRR');
    expect(net.session('sultao_d').entries.at(-1)?.output).toBe('SONHO\n' + describeRoute(sultao));
  });

  it.each(['acordado', 'dormindo'])(
    'handles a local answer while %s without forwarding or completing',
    (mode) => {
      const net = connectedNetwork();
      net.submit('sultao_d', 'cncta_sda inno_m1nvl');
      net.submit('sultao_d', mode);
      const receiverCount = net.session('inno_m1nvl').count;
      for (const word of ['sonho', '  SoNhO  ', '  SÔnHÓ  ']) {
        net.submit('sultao_d', word);
        const entry = net.session('sultao_d').entries.at(-1)!;
        expect(entry.text).toBe(word);
        if (mode === 'dormindo') {
          expect(entry.output).toBe(
            'INÍCIO: chma_vva\nPERCURSO: 10 computadores.\n' +
              SULTAO_ROUTE.map((id, index) => `${index + 1}. ${id}`).join('\n') +
              '\nDESTINO: sultao_d',
          );
        } else {
          expect(sultao.awakePhrases).toContain(entry.output);
          expect(entry.output).not.toContain('PERCURSO:');
        }
        expect(entry.output).not.toContain(success);
        expect(net.session('sultao_d').mode).toBe(mode);
        expect(net.session('inno_m1nvl').count).toBe(receiverCount);
      }
    },
  );

  it('does not turn the local answer into a global command on other PCs', () => {
    const net = connectedNetwork(['grd_s0nhadr'], false);
    net.submit('grd_s0nhadr', 'sonho');
    expect(net.session('grd_s0nhadr').entries.at(-1)?.output).toBe('vrqkr');
  });

  it('treats the same word arriving from another PC as cipher data', () => {
    const net = connectedNetwork(['caosra_st', 'sultao_d'], false);
    net.submit('caosra_st', 'plkel'); // +3 => sonho.
    expect(net.session('sultao_d').entries.at(-1)).toMatchObject({
      text: 'sonho',
      output: 'rlcn',
      source: 'caosra_st',
    });
  });

  it('stops at the sleeping requirement without revealing the ending', () => {
    const net = connectedNetwork();
    net.submit('sultao_d', 'acordado');
    net.submit('chma_vva', 'XXZVVXXVVOXMWY');
    expect(net.session('chma_vva').entries.at(-1)?.output).toBe(
      'TRANSMISSÃO INTERROMPIDA: sultao_d está acordado.',
    );
    expect(sultao.awakePhrases).toContain(net.session('sultao_d').entries.at(-1)?.output);
  });
});
