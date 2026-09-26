export type TerminalMode = 'acordado' | 'dormindo' | 'transe';
export interface TerminalOutputPart {
  text: string;
  cipher?: boolean;
}
export interface TerminalEntry {
  id: number;
  text: string;
  output: string;
  outputParts?: TerminalOutputPart[];
  system: boolean;
  source?: string;
}
export interface ComputerSession {
  connectionsUnlocked: boolean;
  mode: TerminalMode;
  inputFrom: string | null;
  outputTo: string | null;
  entries: TerminalEntry[];
  commands: string[];
  count: number;
  lastPhrase: number;
  trance?: { nextIndex: number; nextAt: number };
}
export interface NetworkState {
  serverSessionId: string | null;
  connectionsVersion: number;
  computers: Record<string, ComputerSession>;
  destination: string | null;
}
