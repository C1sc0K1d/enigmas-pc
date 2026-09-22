export type TerminalMode = 'acordado' | 'dormindo';
export interface TerminalEntry {
  id: number;
  text: string;
  output: string;
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
}
export interface NetworkState {
  serverSessionId: string | null;
  connectionsVersion: number;
  computers: Record<string, ComputerSession>;
  destination: string | null;
}
