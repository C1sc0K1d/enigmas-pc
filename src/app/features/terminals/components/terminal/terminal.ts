import {
  afterNextRender,
  afterRenderEffect,
  Component,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import { COMPUTERS } from '../../data/computers';
import { ComputerConfig } from '../../models/computer.model';
import { TerminalNetwork } from '../../services/terminal-network.service';

@Component({
  selector: 'app-terminal',
  templateUrl: './terminal.html',
  styleUrl: './terminal.scss',
  host: {
    class: 'terminal',
    '[style.--viewport-height]': 'viewportHeight() ? viewportHeight() + "px" : null',
    '[class.terminal--compact]': 'viewportHeight() > 0 && viewportHeight() < 500',
  },
})
export class Terminal {
  readonly computer = input.required<ComputerConfig>();
  private readonly network = inject(TerminalNetwork);
  private readonly serverSessionId = computed(() => this.network.state().serverSessionId);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly computers = COMPUTERS;
  protected readonly entries = computed(() => this.network.session(this.computer().id).entries);
  protected readonly count = computed(() => this.network.session(this.computer().id).count);
  protected readonly mode = computed(() => this.network.session(this.computer().id).mode);
  private readonly commands = computed(() => this.network.session(this.computer().id).commands);
  protected readonly draft = signal('');
  protected readonly viewportHeight = signal(0);
  private readonly screen = viewChild<ElementRef<HTMLElement>>('screen');
  private readonly field = viewChild<ElementRef<HTMLInputElement>>('field');
  private readonly cursor = signal(-1);
  protected readonly canRecallPrevious = computed(
    () => this.commands().length > 0 && this.cursor() !== 0,
  );
  protected readonly canRecallNext = computed(
    () => this.cursor() >= 0 && this.cursor() < this.commands().length,
  );
  private savedDraft = '';

  constructor() {
    effect(() => {
      this.computer();
      this.serverSessionId();
      this.draft.set('');
      this.savedDraft = '';
      this.cursor.set(-1);
    });
    afterNextRender(() => {
      const viewport = window.visualViewport;
      const resize = () => {
        // Mantém o zoom acessível: não comprime o layout enquanto o usuário amplia a página.
        if (!viewport || viewport.scale === 1)
          this.viewportHeight.set(viewport?.height ?? window.innerHeight);
      };
      resize();
      viewport?.addEventListener('resize', resize);
      window.addEventListener('resize', resize);
      this.destroyRef.onDestroy(() => {
        viewport?.removeEventListener('resize', resize);
        window.removeEventListener('resize', resize);
      });
      this.focusOnDesktop();
    });
    afterRenderEffect(() => {
      this.entries();
      const screen = this.screen()?.nativeElement;
      if (screen) screen.scrollTop = screen.scrollHeight;
    });
  }

  private focusOnDesktop(): void {
    if (window.matchMedia?.('(pointer: fine)').matches) this.focus();
  }

  protected focus(): void {
    this.field()?.nativeElement.focus({ preventScroll: true });
  }

  protected switchComputer(id: string): void {
    if (this.computers.some((computer) => computer.id === id)) void this.router.navigate(['/', id]);
  }

  protected submit(event: Event): void {
    event.preventDefault();
    const text = this.draft();
    if (!text.trim()) return;
    this.network.submit(this.computer().id, text);
    this.draft.set('');
    const field = this.field()?.nativeElement;
    if (field) field.value = '';
    this.savedDraft = '';
    this.cursor.set(-1);
    this.focus();
  }

  protected clear(): void {
    this.network.clear(this.computer().id);
    this.draft.set('');
    this.savedDraft = '';
    this.cursor.set(-1);
    this.focusOnDesktop();
  }

  protected recall(direction: -1 | 1): void {
    const commands = this.commands();
    let cursor = this.cursor() < 0 ? commands.length : this.cursor();
    if (cursor === commands.length) this.savedDraft = this.draft();
    cursor = Math.max(0, Math.min(commands.length, cursor + direction));
    this.cursor.set(cursor);
    this.draft.set(cursor === commands.length ? this.savedDraft : commands[cursor]);
  }

  protected navigate(event: KeyboardEvent): void {
    if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return;
    event.preventDefault();
    this.recall(event.key === 'ArrowUp' ? -1 : 1);
  }
}
