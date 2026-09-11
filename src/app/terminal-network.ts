import { afterNextRender, Injectable, signal } from '@angular/core';
import { COMPUTERS, describeContext } from './computers';

export type TerminalMode = 'acordado' | 'dormindo';
export interface TerminalEntry {
  id: number;
  text: string;
  output: string;
  system: boolean;
  source?: string;
}
interface ComputerSession {
  mode: TerminalMode;
  inputFrom: string | null;
  outputTo: string | null;
  entries: TerminalEntry[];
  commands: string[];
  count: number;
  lastPhrase: number;
}
interface NetworkState {
  connectionsVersion: number;
  computers: Record<string, ComputerSession>;
  destination: string | null;
}
const STORAGE_KEY = 'presos-terminal-network-v1';
const CONNECTIONS_VERSION = 3;
const SECRETS = [
  'limpa',
  'contexto',
  'entd',
  'sda',
  'cncta_ent',
  'cncta_sda',
  'acordado',
  'dormindo',
  '/segredos',
].join('\n');

function initialState(): NetworkState {
  return {
    connectionsVersion: CONNECTIONS_VERSION,
    destination: null,
    computers: Object.fromEntries(
      COMPUTERS.map((computer) => [
        computer.id,
        {
          mode: 'acordado',
          inputFrom: computer.inputFrom,
          outputTo: computer.outputTo,
          entries: [],
          commands: [],
          count: 0,
          lastPhrase: -1,
        },
      ]),
    ),
  };
}

@Injectable({ providedIn: 'root' })
export class TerminalNetwork {
  readonly state = signal<NetworkState>(initialState());
  private storage: Storage | null = null;

  constructor() {
    afterNextRender(() => {
      try {
        this.storage = window.sessionStorage;
        const saved = this.storage.getItem(STORAGE_KEY);
        if (saved) this.restore(JSON.parse(saved));
      } catch {
        // O jogo continua em memória quando o navegador não permite armazenamento.
        this.storage = null;
      }
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
    // Só restaura uma rede completa e coerente criada por esta versão do aplicativo.
    if (!saved || typeof saved !== 'object') return;
    const candidate = saved as NetworkState;
    const ids = new Set(COMPUTERS.map((computer) => computer.id));
    const isConnection = (id: unknown) => id === null || (typeof id === 'string' && ids.has(id));
    if (!candidate.computers || !isConnection(candidate.destination)) return;
    for (const id of ids) {
      const session = candidate.computers[id];
      if (
        !session ||
        !['acordado', 'dormindo'].includes(session.mode) ||
        !isConnection(session.inputFrom) ||
        !isConnection(session.outputTo) ||
        session.inputFrom === id ||
        session.outputTo === id ||
        !Number.isSafeInteger(session.count) ||
        session.count < 0 ||
        !Number.isInteger(session.lastPhrase) ||
        !Array.isArray(session.commands) ||
        !session.commands.every((text) => typeof text === 'string') ||
        !Array.isArray(session.entries) ||
        !session.entries.every(
          (entry) =>
            entry &&
            Number.isSafeInteger(entry.id) &&
            typeof entry.text === 'string' &&
            typeof entry.output === 'string' &&
            typeof entry.system === 'boolean' &&
            (entry.source === undefined || ids.has(entry.source)),
        )
      )
        return;
      if (session.outputTo && candidate.computers[session.outputTo]?.inputFrom !== id) return;
      if (session.inputFrom && candidate.computers[session.inputFrom]?.outputTo !== id) return;
    }
    const migrateConnections = candidate.connectionsVersion !== CONNECTIONS_VERSION;
    this.state.set({
      connectionsVersion: CONNECTIONS_VERSION,
      destination: candidate.destination,
      computers: Object.fromEntries(
        COMPUTERS.map((computer) => [
          computer.id,
          {
            ...candidate.computers[computer.id],
            ...(migrateConnections
              ? { inputFrom: computer.inputFrom, outputTo: computer.outputTo }
              : {}),
          },
        ]),
      ),
    });
    // Migra somente as ligações antigas, sem apagar conversas, modos ou progresso.
    if (migrateConnections) this.save();
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

  submit(id: string, text: string): void {
    if (!text.trim()) return;
    const command = text.trim().toLowerCase();
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
        this.state.update((state) => ({ ...state, destination: id }));
        this.append(
          id,
          text,
          describeContext(COMPUTERS.find((computer) => computer.id === id)!),
          true,
        );
        break;
      case 'entd':
        this.append(id, text, this.connection(id, true), true);
        break;
      case 'sda':
        this.append(id, text, this.connection(id, false), true);
        break;
      case 'acordado':
        this.update(id, { mode: 'acordado' });
        this.append(id, text, 'MODO ACORDADO.', true);
        break;
      case 'dormindo':
        this.update(id, { mode: 'dormindo' });
        this.append(id, text, 'MODO DORMINDO.', true);
        break;
      default:
        if (this.session(id).mode === 'acordado') {
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
      if (current !== origin) this.append(current, payload, output, false, source);
      if (awake) {
        notice = `TRANSMISSÃO INTERROMPIDA: ${current} está acordado.`;
        break;
      }
      if (current === destination) {
        const context = computer.context;
        const correctStart = [...visited][0] === context.route[0];
        notice = `DESTINO ALCANÇADO: ${current}.`;
        if (!correctStart || visited.size !== context.route.length) {
          notice = 'TRANSMISSÃO INTERROMPIDA: percurso inválido.';
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
