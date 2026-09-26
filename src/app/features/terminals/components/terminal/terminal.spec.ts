import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Terminal } from './terminal';
import { PUBLIC_COMPUTERS } from '../../data/public-computers';
import { TerminalNetwork } from '../../services/terminal-network.service';
import { createTerminalNetworkStub } from '../../testing/terminal-network.stub';
import { TerminalEntry } from '../../models/network.model';

describe('Terminal presentation', () => {
  async function setup() {
    const network = createTerminalNetworkStub();
    await TestBed.configureTestingModule({
      imports: [Terminal],
      providers: [provideRouter([]), { provide: TerminalNetwork, useValue: network }],
    }).compileComponents();
    const fixture = TestBed.createComponent(Terminal);
    fixture.componentRef.setInput('computer', PUBLIC_COMPUTERS[0]);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    const input = element.querySelector('input')!;
    async function type(text: string) {
      input.value = text;
      input.dispatchEvent(new Event('input'));
      await fixture.whenStable();
    }
    async function send(text: string) {
      await type(text);
      element.querySelector('form')!.dispatchEvent(new Event('submit', { cancelable: true }));
      await fixture.whenStable();
    }
    function entries(values: TerminalEntry[]) {
      network.state.update((state) => ({
        ...state,
        computers: {
          ...state.computers,
          inno_m1nvl: { ...state.computers['inno_m1nvl'], entries: values },
        },
      }));
    }
    return { fixture, element, input, network, type, send, entries };
  }

  it('submits exact text to the service and clears the input after success', async () => {
    const { send, input, network } = await setup();
    await send('  mensagem  ');
    expect(network.submit).toHaveBeenCalledWith('inno_m1nvl', '  mensagem  ');
    expect(input.value).toBe('');
  });

  it('ignores whitespace and preserves the draft when sending fails', async () => {
    const { send, input, network } = await setup();
    await send('   ');
    expect(network.submit).not.toHaveBeenCalled();
    network.submit.mockResolvedValue(false);
    await send('rascunho');
    expect(input.value).toBe('rascunho');
  });

  it('renders server output literally and marks only cipher spaces', async () => {
    const { entries, fixture, element } = await setup();
    entries([
      {
        id: 0,
        text: '<img src=x onerror=alert(1)>',
        output: '  S  B \nAviso normal',
        outputParts: [{ text: '  S  B ', cipher: true }, { text: '\nAviso normal' }],
        system: false,
      },
    ]);
    await fixture.whenStable();
    expect(element.querySelector('.terminal__history img')).toBeNull();
    expect(element.querySelector('.terminal__sent')?.textContent).toContain('<img');
    expect(element.querySelector('.terminal__result-content')?.textContent).toBe(
      '  S  B \nAviso normal',
    );
    expect(element.querySelectorAll('.terminal-output__space')).toHaveLength(5);
  });

  it('shows system responses without decorating normal spaces', async () => {
    const { entries, fixture, element } = await setup();
    entries([{ id: 0, text: 'contexto', output: 'Resposta do servidor', system: true }]);
    await fixture.whenStable();
    expect(element.querySelectorAll('.terminal-output__space')).toHaveLength(0);
    expect(element.querySelector('.terminal__result-label')?.textContent).toBe('SISTEMA');
  });

  it('recalls server command history and restores the unfinished draft', async () => {
    const { network, fixture, input, type } = await setup();
    network.state.update((state) => ({
      ...state,
      computers: {
        ...state.computers,
        inno_m1nvl: { ...state.computers['inno_m1nvl'], commands: ['primeira'] },
      },
    }));
    await type('rascunho');
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }));
    await fixture.whenStable();
    expect(input.value).toBe('primeira');
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    await fixture.whenStable();
    expect(input.value).toBe('rascunho');
  });

  it('delegates clearing to the service', async () => {
    const { network, fixture, element, input, type } = await setup();
    await type('rascunho');
    element.querySelector<HTMLButtonElement>('.terminal__button--clear')!.click();
    await fixture.whenStable();
    expect(network.clear).toHaveBeenCalledWith('inno_m1nvl');
    expect(input.value).toBe('');
  });

  it('switches between server snapshots without mixing histories or drafts', async () => {
    const { network, entries, fixture, element, input, type } = await setup();
    entries([{ id: 0, text: 'primeiro PC', output: 'resultado', system: false }]);
    network.state.update((state) => ({
      ...state,
      computers: {
        ...state.computers,
        inno_m1nvl: { ...state.computers['inno_m1nvl'], mode: 'dormindo' },
      },
    }));
    await type('rascunho');
    fixture.componentRef.setInput('computer', PUBLIC_COMPUTERS[1]);
    await fixture.whenStable();
    expect(element.querySelector('h1')?.textContent).toBe('sultao_d');
    expect(element.querySelector('.terminal__statusbar')?.textContent).toContain('ACORDADO');
    expect(element.querySelectorAll('.terminal__entry')).toHaveLength(0);
    expect(input.value).toBe('');
    fixture.componentRef.setInput('computer', PUBLIC_COMPUTERS[0]);
    await fixture.whenStable();
    expect(element.querySelector('.terminal__statusbar')?.textContent).toContain('DORMINDO');
    expect(element.querySelector('.terminal__history')?.textContent).toContain('primeiro PC');
  });

  it('shows trance dialogue without a fabricated player message and preserves a draft on updates', async () => {
    const { network, entries, fixture, element, input, type } = await setup();
    network.state.update((state) => ({
      ...state,
      computers: {
        ...state.computers,
        inno_m1nvl: {
          ...state.computers['inno_m1nvl'],
          mode: 'transe',
          trance: { nextIndex: 1, nextAt: 4000 },
        },
      },
    }));
    await type('rascunho');
    entries([
      {
        id: 0,
        text: '',
        output: 'Você fala como se essas palavras fossem realmente suas.',
        system: false,
      },
    ]);
    await fixture.whenStable();
    expect(element.querySelector('.terminal__statusbar')?.textContent).toContain('TRANSE');
    expect(element.querySelectorAll('.terminal__sent')).toHaveLength(0);
    expect(element.querySelector('.terminal__result-content')?.textContent).toContain(
      'realmente suas',
    );
    expect(input.value).toBe('rascunho');
  });
  it('clears the draft when the backend process identity changes', async () => {
    const { network, fixture, input, type } = await setup();
    await type('rascunho antigo');
    network.state.update((state) => ({ ...state, serverSessionId: 'new-server' }));
    await fixture.whenStable();
    expect(input.value).toBe('');
  });
});
