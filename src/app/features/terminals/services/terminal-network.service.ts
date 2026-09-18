import { afterNextRender, DestroyRef, inject, Injectable, signal } from '@angular/core';
import { ServerSession } from './server-session.service';
import { COMPUTERS } from '../data/computers';
import { CONNECTIONS_VERSION, SECRETS, STORAGE_KEY } from '../config/network.config';
import { describeContext } from '../functions/describe-context';
import { describeRoute } from '../functions/describe-route';
import { createNetworkState, restoreNetworkState } from '../functions/network-state';
import { getOutputChain } from '../functions/output-chain';
import { matchesAnswer } from '../functions/matches-answer';
import { matchesPuzzleRoute } from '../functions/puzzle-route';
import { ComputerSession, NetworkState } from '../models/network.model';

@Injectable({ providedIn: 'root' })
export class TerminalNetwork {
  readonly state = signal<NetworkState>(createNetworkState(COMPUTERS, CONNECTIONS_VERSION));
  private storage: Storage | null = null;

  constructor() {
    const serverSession = inject(ServerSession);
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      try {
        this.storage = window.sessionStorage;
        const saved = this.storage.getItem(STORAGE_KEY);
        if (saved) this.restore(JSON.parse(saved));
      } catch {
        // O jogo continua em memória quando o navegador não permite armazenamento.
        this.storage = null;
      }
      destroyRef.onDestroy(
        serverSession.watch((serverSessionId) => {
          if (this.state().serverSessionId === serverSessionId) return;
          this.state.set({
            ...createNetworkState(COMPUTERS, CONNECTIONS_VERSION),
            serverSessionId,
          });
          this.save();
        }),
      );
    });
  }

  session(id: string): ComputerSession {
    return this.state().computers[id];
  }

  private update(id: string, changes: Partial<ComputerSession>): void {
    this.state.update((state) => ({
      ...state,
      computers: { ...state.computers, [id]: { ...state.computers[id], ...changes } },
    }));
  }

  private save(): void {
    try {
      this.storage?.setItem(STORAGE_KEY, JSON.stringify(this.state()));
    } catch {
      /* Cota cheia: preserva o estado em memória. */
    }
  }

  private restore(saved: unknown): void {
    const restored = restoreNetworkState(saved, COMPUTERS, CONNECTIONS_VERSION);
    if (!restored) return;
    this.state.set(restored.state);
    if (restored.connectionsMigrated) this.save();
  }

  private append(id: string, text: string, output: string, system = false, source?: string): void {
    const entries = this.session(id).entries;
    this.update(id, {
      entries: [...entries, { id: (entries.at(-1)?.id ?? -1) + 1, text, output, system, source }],
    });
  }

  clear(id: string): void {
    this.update(id, { entries: [], commands: [] });
    this.save();
  }

  private showSecrets(id: string, text: string): void {
    this.append(id, text, SECRETS, true);
    this.save();
  }

  private phrase(id: string): string {
    const phrases = COMPUTERS.find((computer) => computer.id === id)!.awakePhrases;
    const choices = phrases
      .map((_, index) => index)
      .filter((index) => index !== this.session(id).lastPhrase);
    const index = choices.length ? choices[Math.floor(Math.random() * choices.length)] : 0;
    this.update(id, { lastPhrase: index });
    return phrases[index];
  }

  private connection(id: string, input: boolean): string {
    return `${input ? 'ENTRADA' : 'SAÍDA CONECTADA'}: ${
      (input ? this.session(id).inputFrom : this.session(id).outputTo) ?? 'nenhum'
    }`;
  }

  private connect(id: string, input: boolean, target: string): string {
    if (!this.session(id).connectionsUnlocked) {
      return 'Chave não encontrada ou não digitada nos ultimos 30 dias.';
    }
    if (target !== 'nenhum' && !Object.hasOwn(this.state().computers, target)) {
      return `CONEXÃO RECUSADA: PC desconhecido.`;
    }
    if (target === id) return 'CONEXÃO RECUSADA.';
    const sourceId = input ? (target === 'nenhum' ? null : target) : id;
    const destinationId = input ? id : target === 'nenhum' ? null : target;
    // Uma entrada e uma saída por PC. Desfaz os pares antigos dos dois lados.
    if (sourceId) {
      const previous = this.session(sourceId).outputTo;
      if (previous) this.update(previous, { inputFrom: null });
      this.update(sourceId, { outputTo: null });
    }
    if (destinationId) {
      const previous = this.session(destinationId).inputFrom;
      if (previous) this.update(previous, { outputTo: null });
      this.update(destinationId, { inputFrom: null });
    }
    if (sourceId && destinationId) {
      this.update(sourceId, { outputTo: destinationId });
      this.update(destinationId, { inputFrom: sourceId });
    }
    return this.connection(id, input);
  }

  private sendNetworkCommand(origin: string, text: string, command: 'dormindo' | 'contexto'): void {
    const { route, cycleAt } = getOutputChain(origin, (id) => this.session(id).outputTo);
    if (command === 'dormindo') {
      route.forEach((id, index) => {
        this.update(id, { mode: 'dormindo' });
        if (id !== origin) this.append(id, text, 'MODO DORMINDO.', true, route[index - 1]);
      });
      this.append(
        origin,
        text,
        cycleAt ? `TRANSMISSÃO INTERROMPIDA: ciclo detectado em ${cycleAt}.` : 'MODO DORMINDO.',
        true,
      );
      return;
    }
    if (cycleAt) {
      this.append(origin, text, `TRANSMISSÃO INTERROMPIDA: ciclo detectado em ${cycleAt}.`, true);
      return;
    }
    const destination = route.at(-1)!;
    const computer = COMPUTERS.find((computer) => computer.id === destination)!;
    const output = describeContext(computer);
    this.state.update((state) => ({ ...state, destination }));
    if (destination !== origin) {
      this.append(destination, text, output, true, route.at(-2));
    }
    this.append(origin, text, output, true);
  }

  submit(id: string, text: string): void {
    if (!text.trim()) return;
    const command = text.trim().toLowerCase();
    const computer = COMPUTERS.find((computer) => computer.id === id)!;
    if (command === 'limpa' || command === '/limpar') {
      this.clear(id);
      return;
    }
    this.update(id, { commands: [...this.session(id).commands, text] });
    const parts = command.split(/\s+/);
    if (parts.length > 1 && (parts[0] === 'cncta_ent' || parts[0] === 'cncta_sda')) {
      const output =
        parts.length > 2
          ? 'COMANDO INVÁLIDO.'
          : this.connect(id, parts[0] === 'cncta_ent', parts[1]);
      this.append(id, text, output, true);
      this.save();
      return;
    }
    switch (command) {
      case '/segredos':
        this.showSecrets(id, text);
        break;
      case 'contexto':
      case 'dormindo':
        this.sendNetworkCommand(id, text, command);
        break;
      case 'entd':
        this.append(id, text, this.connection(id, true), true);
        break;
      case 'sda':
        this.append(id, text, this.connection(id, false), true);
        break;
      case 'lbr_ent':
      case 'lbr_sda':
        this.append(id, text, this.connect(id, command === 'lbr_ent', 'nenhum'), true);
        break;
      case 'acordado':
        this.update(id, { mode: 'acordado' });
        this.append(id, text, 'MODO ACORDADO.', true);
        break;
      default:
        if (
          this.session(id).mode === 'dormindo' &&
          computer.context.revealRouteOnLocalAnswer &&
          matchesAnswer(text, computer.context.answer)
        ) {
          this.append(id, text, describeRoute(computer), true);
          this.update(id, { count: this.session(id).count + 1 });
        } else if (this.session(id).mode === 'acordado') {
          this.append(id, text, this.phrase(id));
          this.update(id, { count: this.session(id).count + 1 });
        } else this.transmit(id, text);
    }
    this.save();
  }

  private transmit(origin: string, text: string): void {
    const visited = new Set<string>();
    const trace: string[] = [];
    const destination = this.state().destination;
    let current: string | null = origin;
    let source: string | undefined;
    let payload = text;
    let notice = '';
    while (current) {
      if (visited.has(current)) {
        notice = `TRANSMISSÃO INTERROMPIDA: ciclo detectado em ${current}.`;
        break;
      }
      visited.add(current);
      const computer = COMPUTERS.find((computer) => computer.id === current)!;
      const session = this.session(current);
      const awake = session.mode === 'acordado';
      // Conteúdo recebido é sempre dado: nunca executa comandos de controle.
      const output = awake ? this.phrase(current) : computer.encode(payload);
      trace.push(`${current}: ${output}`);
      this.update(current, { count: session.count + 1 });
      const context = computer.context;
      const correctRoute = matchesPuzzleRoute([...visited], context.route);
      const keyRecognized = !awake && matchesAnswer(output, context.answer);
      const solved = keyRecognized && correctRoute;
      const keyResponse = keyRecognized
        ? solved
          ? (context.successMessage ?? `DESTINO ALCANÇADO: ${current}.`)
          : describeRoute(computer)
        : '';
      if (solved) this.update(current, { connectionsUnlocked: true });
      if (current !== origin) {
        this.append(
          current,
          payload,
          keyResponse ? output + '\n' + keyResponse : output,
          false,
          source,
        );
      }
      if (awake) {
        notice = `TRANSMISSÃO INTERROMPIDA: ${current} está acordado.`;
        break;
      }
      if (keyRecognized) {
        notice = keyResponse;
        break;
      }
      if (current === destination) {
        notice = `DESTINO ALCANÇADO: ${current}.`;
        if (!correctRoute) {
          notice = 'TRANSMISSÃO INTERROMPIDA: percurso inválido.';
        } else if (context.successMessage) {
          notice = 'TRANSMISSÃO INTERROMPIDA: resposta inválida.';
        }
        break;
      }
      source = current;
      current = session.outputTo;
      payload = output;
      if (!current && destination) notice = `TRANSMISSÃO INTERROMPIDA: ${source} está sem saída.`;
    }
    // Mostra todo o percurso no emissor; cada receptor mantém sua própria entrada e saída.
    const output = trace.length === 1 ? trace[0].slice(origin.length + 2) : trace.join('\n');
    this.append(
      origin,
      text,
      notice.startsWith('TRANSMISSÃO INTERROMPIDA:')
        ? notice
        : [output, notice].filter(Boolean).join('\n'),
    );
  }
}
