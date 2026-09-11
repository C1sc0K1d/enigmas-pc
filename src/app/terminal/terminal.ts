import { afterNextRender, afterRenderEffect, Component, ElementRef, input, signal, viewChild } from '@angular/core';
import { ComputerConfig } from '../computers';
interface Entry { id: number; text: string; output: string; system: boolean; }
@Component({ selector: 'app-terminal', templateUrl: './terminal.html', styleUrl: './terminal.scss' })
export class Terminal {
  readonly computer = input.required<ComputerConfig>();
  protected readonly entries = signal<Entry[]>([]);
  protected readonly draft = signal('');
  protected readonly count = signal(0);
  private readonly screen = viewChild<ElementRef<HTMLElement>>('screen');
  private readonly field = viewChild<ElementRef<HTMLInputElement>>('field');
  private commands: string[] = [];
  private cursor = 0;
  private savedDraft = '';
  private nextId = 0;
  constructor() {
    afterNextRender(() => this.focus());
    afterRenderEffect(() => {
      this.entries();
      const screen = this.screen()?.nativeElement;
      if (screen) screen.scrollTop = screen.scrollHeight;
    });
  }
  protected focus(): void { this.field()?.nativeElement.focus({ preventScroll: true }); }
  protected submit(event: Event): void {
    event.preventDefault();
    const text = this.draft();
    if (!text.trim()) return;
    this.commands.push(text);
    this.cursor = this.commands.length;
    this.savedDraft = '';
    this.draft.set('');
    if (text.trim().toLowerCase() === '/limpar') this.clear();
    else if (text.trim().toLowerCase() === '/ajuda') this.help();
    else {
      this.entries.update((entries) => [...entries, { id: this.nextId++, text, output: this.computer().encode(text), system: false }]);
      this.count.update((count) => count + 1);
    }
    this.focus();
  }
  protected help(): void {
    this.entries.update((entries) => [...entries, {
      id: this.nextId++, text: '/ajuda', system: true,
      output: 'Digite uma palavra ou frase e pressione ENTER para codificar.\n↑ e ↓ recuperam entradas anteriores.\n/limpar apaga o histórico visível. /ajuda mostra esta mensagem.\nO histórico existe apenas nesta sessão; recarregar a página reinicia o terminal.',
    }]);
    this.focus();
  }
  protected clear(): void { this.entries.set([]); this.focus(); }
  protected navigate(event: KeyboardEvent): void {
    if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return;
    event.preventDefault();
    if (this.cursor === this.commands.length) this.savedDraft = this.draft();
    this.cursor = Math.max(0, Math.min(this.commands.length, this.cursor + (event.key === 'ArrowUp' ? -1 : 1)));
    this.draft.set(this.cursor === this.commands.length ? this.savedDraft : this.commands[this.cursor]);
  }
}
