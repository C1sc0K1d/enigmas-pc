import { afterNextRender, DestroyRef, inject, Injectable, signal } from '@angular/core';

import { PUBLIC_COMPUTERS } from '../data/public-computers';
import { ComputerSession, NetworkState } from '../models/network.model';
import { TerminalApi, GameResponse } from './terminal-api.service';
import { GameEvents } from './game-events.service';
import { HttpErrorResponse } from '@angular/common/http';

const emptySession = (): ComputerSession => ({
  connectionsUnlocked: false,
  mode: 'acordado',
  inputFrom: null,
  outputTo: null,
  entries: [],
  commands: [],
  count: 0,
  lastPhrase: -1,
});

@Injectable({ providedIn: 'root' })
export class TerminalNetwork {
  readonly catalog = signal(PUBLIC_COMPUTERS);
  readonly state = signal<NetworkState>({
    serverSessionId: null,
    connectionsVersion: 3,
    destination: null,
    computers: Object.fromEntries(PUBLIC_COMPUTERS.map((c) => [c.id, emptySession()])),
  });
  readonly ready = signal(false);
  readonly busy = signal(false);
  readonly error = signal<string | null>(null);
  private readonly api = inject(TerminalApi);
  private gameId: string | null = null;
  private revision = 0;
  private generation = 0;
  private refreshing = false;
  private refreshQueued = false;
  private destroyed = false;
  private initializing: Promise<void> | null = null;

  constructor() {
    const events = inject(GameEvents);
    const destroy = inject(DestroyRef);
    afterNextRender(() => {
      void this.initialize();
      const refresh = () => {
        void this.refresh();
      };
      const stopEvents = events.watch(refresh);
      window.addEventListener('focus', refresh);
      window.addEventListener('online', refresh);
      destroy.onDestroy(() => {
        this.generation++;
        this.destroyed = true;
        stopEvents();
        window.removeEventListener('focus', refresh);
        window.removeEventListener('online', refresh);
      });
    });
  }

  initialize(): Promise<void> {
    if (this.initializing) return this.initializing;
    this.initializing = this.connect().finally(() => (this.initializing = null));
    return this.initializing;
  }

  async reconnect(): Promise<void> {
    if (this.busy()) return;
    await this.initialize();
  }

  private async connect(): Promise<void> {
    this.generation++;
    this.busy.set(true);
    this.error.set(null);
    try {
      this.catalog.set(await this.api.catalog());
      this.apply(await this.api.create());
      this.ready.set(true);
    } catch {
      this.ready.set(false);
      this.error.set('Não foi possível conectar ao servidor. Tente reconectar.');
    } finally {
      this.busy.set(false);
      this.drainRefresh();
    }
  }

  session(id: string): ComputerSession {
    return this.state().computers[id] ?? emptySession();
  }
  clear(id: string): Promise<boolean> {
    return this.submit(id, 'limpa');
  }

  async submit(id: string, text: string): Promise<boolean> {
    if (!text.trim() || !this.ready() || this.busy() || !this.gameId) return false;
    this.generation++;
    this.busy.set(true);
    this.error.set(null);
    try {
      const response = await this.api.submit(this.gameId, {
        computerId: id,
        text,
        requestId: this.requestId(),
        revision: this.revision,
        serverSessionId: this.state().serverSessionId!,
      });
      this.apply(response);
      return true;
    } catch (error) {
      // A lost response may have committed. Read the authoritative snapshot; never replay automatically.
      try {
        this.apply(await this.api.load(this.gameId));
      } catch {
        this.ready.set(false);
      }
      this.error.set(
        error instanceof HttpErrorResponse && error.status === 409
          ? 'A partida mudou. Seu comando não foi aplicado. Confira o estado atualizado e envie novamente.'
          : 'Não foi possível confirmar o envio. Confira o histórico antes de tentar novamente.',
      );
      return false;
    } finally {
      this.busy.set(false);
      this.drainRefresh();
    }
  }

  private apply(response: GameResponse): void {
    this.gameId = response.gameId;
    this.revision = response.revision;
    this.state.set(response.state);
  }

  /** Read shared progress without blocking typing or allowing an old poll to undo a command. */
  async refresh(): Promise<void> {
    if (this.destroyed) return;
    if (this.busy() || this.refreshing) {
      this.refreshQueued = true;
      return;
    }
    if (!this.ready() || !this.gameId) {
      await this.initialize();
      return;
    }
    const generation = this.generation;
    this.refreshing = true;
    try {
      const response = await this.api.load(this.gameId);
      if (generation !== this.generation) return;
      if (
        response.state.serverSessionId !== this.state().serverSessionId ||
        response.revision > this.revision
      )
        this.apply(response);
    } catch {
      if (generation === this.generation) {
        this.ready.set(false);
        this.error.set('Conexão perdida. Tentando reconectar à partida compartilhada.');
      }
    } finally {
      this.refreshing = false;
      this.drainRefresh();
    }
  }
  private drainRefresh(): void {
    if (this.refreshQueued && !this.destroyed) {
      this.refreshQueued = false;
      queueMicrotask(() => {
        void this.refresh();
      });
    }
  }

  private requestId(): string {
    // crypto.randomUUID is unavailable over plain HTTP on a phone connected via LAN.
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    bytes[6] = (bytes[6] & 15) | 64;
    bytes[8] = (bytes[8] & 63) | 128;
    const hex = Array.from(bytes, (value) => value.toString(16).padStart(2, '0')).join('');
    return (
      hex.slice(0, 8) +
      '-' +
      hex.slice(8, 12) +
      '-' +
      hex.slice(12, 16) +
      '-' +
      hex.slice(16, 20) +
      '-' +
      hex.slice(20)
    );
  }
}
