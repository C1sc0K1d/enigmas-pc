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
import { TerminalOutput } from '../terminal-output/terminal-output';
import { ComputerSummary } from '../../models/computer-summary.model';
import { TerminalNetwork } from '../../services/terminal-network.service';

@Component({
  selector: 'app-terminal',
  imports: [TerminalOutput],
  templateUrl: './terminal.html',
  styleUrl: './terminal.scss',
  host: {
    class: 'terminal',
    '[style.--viewport-height]': 'viewportHeight() ? viewportHeight() + "px" : null',
    '[class.terminal--compact]': 'viewportHeight() > 0 && viewportHeight() < 500',
  },
})
export class Terminal {
  readonly routeComputer = input.required<ComputerSummary>({ alias: 'computer' });
  readonly computer = computed(
    () =>
      this.network.catalog().find((c) => c.id === this.routeComputer().id) ?? this.routeComputer(),
  );
  protected readonly network = inject(TerminalNetwork);
  private readonly activeComputerId = computed(() => this.computer().id);
  private readonly serverSessionId = computed(() => this.network.state().serverSessionId);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly computers = this.network.catalog;
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
    // A new terminal or server session should not inherit an unfinished message.
    effect(() => {
      this.activeComputerId();
      this.serverSessionId();
      this.draft.set('');
      this.savedDraft = '';
      this.cursor.set(-1);
    });
    afterNextRender(() => {
      const viewport = window.visualViewport;
      const resize = () => {
        // Resize for the keyboard, but leave the layout alone while the player is zooming.
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

  // Avoid opening a phone keyboard just because the player opened or cleared a terminal.
  private focusOnDesktop(): void {
    if (window.matchMedia?.('(pointer: fine)').matches) this.focus();
  }

  protected focus(): void {
    this.field()?.nativeElement.focus({ preventScroll: true });
  }

  protected switchComputer(id: string): void {
    if (this.computers().some((computer) => computer.id === id))
      void this.router.navigate(['/', id]);
  }

  protected async submit(event: Event): Promise<void> {
    event.preventDefault();
    const text = this.draft();
    if (!text.trim()) return;
    const id = this.computer().id;
    if (!(await this.network.submit(id, text))) return;
    if (this.computer().id !== id || this.draft() !== text) return;
    this.draft.set('');
    const field = this.field()?.nativeElement;
    if (field) field.value = '';
    this.savedDraft = '';
    this.cursor.set(-1);
    this.focus();
  }

  protected async clear(): Promise<void> {
    const id = this.computer().id;
    if (!(await this.network.clear(id)) || this.computer().id !== id) return;
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
