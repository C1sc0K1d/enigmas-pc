import { TestBed } from '@angular/core/testing';
import { Terminal } from './terminal';
import { COMPUTERS } from '../../data/computers';

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
      element.querySelector('.terminal__entry:last-child .terminal__result-content')?.textContent;
    return { fixture, element, input, send, sleep, lastOutput };
  }

  it('preserves submissions and displays encoded output in order while asleep', async () => {
    const { element, input, send, sleep } = await setup();
    await sleep();
    await send('abc XYZ!');
    await send('porta');
    const entries = element.querySelectorAll('.terminal__entry');
    expect(entries.length).toBe(2);
    expect(entries[0].textContent).toContain('abc XYZ!');
    expect(entries[0].textContent).toContain('     !');
    expect(entries[1].textContent).toContain('bs ');
    expect(input.value).toBe('');
  });

  it('ignores whitespace and restores the draft after browsing history', async () => {
    const { fixture, element, input, send } = await setup();
    await send('   ');
    expect(element.querySelectorAll('.terminal__entry').length).toBe(0);
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
    await send('FQQYSDDWW');
    expect(element.querySelector('h1')?.textContent).toBe('sultao_d');
    expect(element.querySelector('select')?.value).toBe('sultao_d');
    expect(lastOutput()).toBe('ENTRAR');
  });

  it('starts awake and alternates narrative replies without applying the cipher', async () => {
    const { element, send, lastOutput } = await setup();
    expect(element.querySelector('.terminal__statusbar')?.textContent).toContain('ACORDADO');
    await send('abc');
    const first = lastOutput();
    expect(COMPUTERS[0].awakePhrases).toContain(first);
    await send('abc');
    expect(COMPUTERS[0].awakePhrases).toContain(lastOutput());
    expect(lastOutput()).not.toBe(first);
    await send('cncta_sda nenhum');
    await send('dormindo');
    await send('abc');
    expect(lastOutput()).toBe('  ');
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
      expect(lastOutput()).toContain('4 computadores');
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
      'limpa\ncontexto\nentd\nsda\ncncta_ent\ncncta_sda\nlbr_ent\nlbr_sda\nacordado\ndormindo\n/segredos',
    );
    await send(' LiMpA ');
    expect(element.querySelectorAll('.terminal__entry').length).toBe(0);
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }));
    await fixture.whenStable();
    expect(input.value).toBe('');
    expect(element.querySelector('.terminal__statusbar')?.textContent).toContain('DORMINDO');
    await send('abc');
    expect(lastOutput()).toBe('  ');
    await send('/limpar');
    expect(element.querySelectorAll('.terminal__entry').length).toBe(0);
    await send('abc');
    element.querySelector<HTMLButtonElement>('.terminal__button--clear')!.click();
    await fixture.whenStable();
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }));
    await fixture.whenStable();
    expect(input.value).toBe('');
    expect(element.querySelectorAll('.terminal__entry').length).toBe(0);
  });

  it('keeps independent mode and history when switching between computers', async () => {
    const { fixture, element, send, sleep } = await setup();
    await sleep();
    await send('segredo');
    fixture.componentRef.setInput('computer', COMPUTERS[1]);
    await fixture.whenStable();
    expect(element.querySelector('.terminal__statusbar')?.textContent).toContain('ACORDADO');
    expect(element.querySelectorAll('.terminal__entry').length).toBe(0);
    fixture.componentRef.setInput('computer', COMPUTERS[0]);
    await fixture.whenStable();
    expect(element.querySelector('.terminal__statusbar')?.textContent).toContain('DORMINDO');
    expect(element.querySelector('.terminal__history')?.textContent).toContain('segredo');
  });

  it('renders player input as text', async () => {
    const { element, send } = await setup();
    await send('<img src=x onerror=alert(1)>');
    expect(element.querySelector('.terminal__history img')).toBeNull();
    expect(element.querySelector('.terminal__sent')?.textContent).toContain('<img');
  });
});
