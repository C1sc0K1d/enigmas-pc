import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';
import { COMPUTERS, describeContext, PUZZLE_ORDER } from './computers';
import { Terminal } from './terminal/terminal';
import { TerminalNetwork } from './terminal-network';

beforeEach(() => sessionStorage.removeItem('presos-terminal-network-v1'));

describe('Terminal', () => {
  async function setup(index = 0) {
    await TestBed.configureTestingModule({ imports: [Terminal] }).compileComponents();
    const fixture = TestBed.createComponent(Terminal);
    fixture.componentRef.setInput('computer', COMPUTERS[index]);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    const input = element.querySelector('input')!;
    async function send(text: string) {
      input.value = text;
      input.dispatchEvent(new Event('input'));
      await fixture.whenStable();
      element.querySelector('form')!.dispatchEvent(new Event('submit', { cancelable: true }));
      await fixture.whenStable();
    }
    async function sleep() {
      await send('cncta_sda nenhum');
      await send('dormindo');
      await send('limpa');
    }
    const lastOutput = () =>
      element.querySelector('.entry:last-child .result > span:last-child')?.textContent;
    return { fixture, element, input, send, sleep, lastOutput };
  }

  it('preserves submissions and displays encoded output in order while asleep', async () => {
    const { element, input, send, sleep } = await setup();
    await sleep();
    await send('abc XYZ!');
    await send('porta');
    const entries = element.querySelectorAll('.entry');
    expect(entries.length).toBe(2);
    expect(entries[0].textContent).toContain('abc XYZ!');
    expect(entries[0].textContent).toContain('def ABC!');
    expect(entries[1].textContent).toContain('sruwd');
    expect(input.value).toBe('');
  });

  it('ignores whitespace and restores the draft after browsing history', async () => {
    const { fixture, element, input, send } = await setup();
    await send('   ');
    expect(element.querySelectorAll('.entry').length).toBe(0);
    await send('primeira');
    input.value = 'rascunho';
    input.dispatchEvent(new Event('input'));
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }));
    await fixture.whenStable();
    expect(input.value).toBe('primeira');
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    await fixture.whenStable();
    expect(input.value).toBe('rascunho');
  });

  it('uses the configured cipher on another computer', async () => {
    const { element, send, sleep, lastOutput } = await setup(1);
    await sleep();
    await send('porta');
    expect(element.querySelector('h1')?.textContent).toBe('sultao_d');
    expect(element.querySelector('select')?.value).toBe('sultao_d');
    expect(lastOutput()).toBe('atrop');
  });

  it('starts awake and alternates narrative replies without applying the cipher', async () => {
    const { element, send, lastOutput } = await setup();
    expect(element.querySelector('.statusbar')?.textContent).toContain('ACORDADO');
    await send('abc');
    const first = lastOutput();
    expect(COMPUTERS[0].awakePhrases).toContain(first);
    await send('abc');
    expect(COMPUTERS[0].awakePhrases).toContain(lastOutput());
    expect(lastOutput()).not.toBe(first);
    await send('cncta_sda nenhum');
    await send('dormindo');
    await send('abc');
    expect(lastOutput()).toBe('def');
    await send('  ACORDADO  ');
    await send('abc');
    expect(COMPUTERS[0].awakePhrases).toContain(lastOutput());
  });

  it('shows context and connections in both modes without revealing the answer', async () => {
    const { send, lastOutput } = await setup(7);
    for (const mode of ['acordado', 'dormindo']) {
      await send(mode);
      expect(lastOutput()).toBe(mode === 'acordado' ? 'MODO ACORDADO.' : 'MODO DORMINDO.');
      await send(' CONTEXTO ');
      expect(lastOutput()).toContain(COMPUTERS[7].context.riddle);
      expect(lastOutput()).toContain('INÍCIO: inno_m1nvl');
      expect(lastOutput()).toContain('3 computadores');
      expect(lastOutput()).toContain('DESTINO: caosra_st');
      expect(lastOutput()).not.toContain('loucura');
      await send('entd');
      expect(lastOutput()).toBe('ENTRADA: nenhum');
      await send('sda');
      expect(lastOutput()).toBe('SAÍDA CONECTADA: nenhum');
    }
  });

  it('clears the conversation and keyboard recall without changing the mode', async () => {
    const { fixture, element, input, send, sleep, lastOutput } = await setup();
    await sleep();
    await send('segredo');
    await send('/segredos');
    expect(lastOutput()).toBe(
      'limpa\ncontexto\nentd\nsda\ncncta_ent\ncncta_sda\nacordado\ndormindo\n/segredos',
    );
    await send(' LiMpA ');
    expect(element.querySelectorAll('.entry').length).toBe(0);
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }));
    await fixture.whenStable();
    expect(input.value).toBe('');
    expect(element.querySelector('.statusbar')?.textContent).toContain('DORMINDO');
    await send('abc');
    expect(lastOutput()).toBe('def');
    await send('/limpar');
    expect(element.querySelectorAll('.entry').length).toBe(0);
    await send('abc');
    element.querySelector<HTMLButtonElement>('.toolbar button')!.click();
    await fixture.whenStable();
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }));
    await fixture.whenStable();
    expect(input.value).toBe('');
    expect(element.querySelectorAll('.entry').length).toBe(0);
  });

  it('keeps independent mode and history when switching between computers', async () => {
    const { fixture, element, send, sleep } = await setup();
    await sleep();
    await send('segredo');
    fixture.componentRef.setInput('computer', COMPUTERS[1]);
    await fixture.whenStable();
    expect(element.querySelector('.statusbar')?.textContent).toContain('ACORDADO');
    expect(element.querySelectorAll('.entry').length).toBe(0);
    fixture.componentRef.setInput('computer', COMPUTERS[0]);
    await fixture.whenStable();
    expect(element.querySelector('.statusbar')?.textContent).toContain('DORMINDO');
    expect(element.querySelector('.history')?.textContent).toContain('segredo');
  });

  it('renders player input as text', async () => {
    const { element, send } = await setup();
    await send('<img src=x onerror=alert(1)>');
    expect(element.querySelector('.history img')).toBeNull();
    expect(element.querySelector('.sent')?.textContent).toContain('<img');
  });
});

describe('Rede de enigmas', () => {
  it('keeps initial links reciprocal and riddle routes valid independently of the connections', () => {
    const byId = new Map(COMPUTERS.map((computer) => [computer.id, computer]));
    for (const computer of COMPUTERS) {
      if (computer.outputTo) expect(byId.get(computer.outputTo)?.inputFrom).toBe(computer.id);
      if (computer.inputFrom) expect(byId.get(computer.inputFrom)?.outputTo).toBe(computer.id);
      const route = computer.context.route;
      expect(route.at(-1)).toBe(computer.id);
      expect(new Set(route).size).toBe(route.length);
      route.forEach((id) => expect(byId.has(id)).toBe(true));
      expect(describeContext(computer)).not.toContain(computer.context.answer);
    }
  });

  it('returns loucura only after applying all three ciphers in the example route', () => {
    const computer = COMPUTERS.find((computer) => computer.id === 'caosra_st')!;
    expect(computer.context.route).toEqual(['inno_m1nvl', 'grd_s0nhadr', 'caosra_st']);
    let output = 'cfltlir';
    for (const id of computer.context.route) {
      expect(output).not.toBe('loucura');
      output = COMPUTERS.find((computer) => computer.id === id)!.encode(output);
    }
    expect(output).toBe(computer.context.answer);
  });
});

describe('App', () => {
  it('creates the application shell', async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter([])],
    }).compileComponents();
    expect(TestBed.createComponent(App).componentInstance).toBeTruthy();
  });
});

// Exercita a transmissão real, sem simular manualmente a aplicação das cifras.
describe('Transmissão automática', () => {
  function network() {
    TestBed.configureTestingModule({});
    return TestBed.inject(TerminalNetwork);
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
      output: 'ghi',
      source: 'chma_vva',
    });
    expect(net.session('fnt_primdal').entries.at(-1)).toMatchObject({
      text: 'ghi',
      output: 'jkl',
      source: 'tec_la',
    });
    expect(net.session('inno_m1nvl').count).toBe(0);
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
  it('forwards through all three PCs and stops at the selected destination', () => {
    const net = network();
    net.submit('caosra_st', 'contexto');
    for (const id of ['inno_m1nvl', 'grd_s0nhadr', 'caosra_st']) net.submit(id, 'dormindo');
    net.submit('inno_m1nvl', 'cncta_sda grd_s0nhadr');
    net.submit('grd_s0nhadr', 'cncta_sda caosra_st');
    net.submit('inno_m1nvl', 'cfltlir');
    expect(net.session('inno_m1nvl').entries.at(-1)?.output).toContain('caosra_st: loucura');
    expect(net.session('grd_s0nhadr').entries.at(-1)).toMatchObject({
      text: 'fiowolu',
      output: 'ilrzrox',
      source: 'inno_m1nvl',
    });
    expect(net.session('caosra_st').entries.at(-1)).toMatchObject({
      text: 'ilrzrox',
      output: 'loucura',
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
      ['cncta_ent', 'fqfwd_hqw'],
      ['cncta_sda ', 'fqfwd_vgd '],
      ['  CNCTA_ENT\t', '  FQFWD_HQW\t'],
      ['cncta_sda\t \n', 'fqfwd_vgd\t \n'],
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
    net.submit('inno_m1nvl', 'ifjmx'); // +3 => limpa; must be encrypted, not executed remotely.
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
