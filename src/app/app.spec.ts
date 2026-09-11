import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';
import { COMPUTERS } from './computers';
import { Terminal } from './terminal/terminal';

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
    return { fixture, element, input, send };
  }
  it('preserves submissions and displays encoded output in order', async () => {
    const { element, input, send } = await setup();
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
  it('uses a different computer configuration without changing the front end', async () => {
    const { element, send } = await setup(1);
    await send('porta');
    expect(element.querySelector('h1')?.textContent).toBe('sultao_d');
    expect(element.querySelector('.result')?.textContent).toContain('atrop');
  });
  it('shows help and clears visible history without clearing the session count', async () => {
    const { element, send } = await setup();
    await send('abc');
    await send('/ajuda');
    expect(element.querySelectorAll('.entry').length).toBe(2);
    expect(element.querySelector('.history')?.textContent).toContain('recarregar');
    await send('/limpar');
    expect(element.querySelectorAll('.entry').length).toBe(0);
    expect(element.querySelector('.statusbar')?.textContent).toContain('001 MENSAGENS');
  });
  it('renders player input as text', async () => {
    const { element, send } = await setup();
    await send('<img src=x onerror=alert(1)>');
    expect(element.querySelector('.history img')).toBeNull();
    expect(element.querySelector('.sent')?.textContent).toContain('<img');
  });
});

describe('App', () => {
  it('creates the application shell', async () => {
    await TestBed.configureTestingModule({ imports: [App], providers: [provideRouter([])] }).compileComponents();
    expect(TestBed.createComponent(App).componentInstance).toBeTruthy();
  });
});
