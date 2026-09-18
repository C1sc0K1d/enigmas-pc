export interface ComputerContext {
  revealRouteOnLocalAnswer?: boolean; // Dormindo, a resposta digitada localmente consulta apenas o percurso.
  successMessage?: string; // Revelada somente após resolver o percurso completo.
  riddle: string;
  answer: string; // Validada para liberar conexões; nunca exibida pelo comando contexto.
  route: readonly string[]; // Inclui o computador inicial e o destino.
}

export interface ComputerConfig {
  id: string;
  name: string;
  location: string;
  serial: string;
  welcome: string;
  encode: (text: string) => string;
  inputFrom: string | null;
  outputTo: string | null;
  context: ComputerContext;
  awakePhrases: readonly [string, ...string[]];
}

export interface ComputerDefinition {
  id: string;
  serial: number;
  riddle: string;
  answer: string;
  awakePhrases: ComputerConfig['awakePhrases'];
  name?: string;
  location?: string;
  welcome?: string;
  steps?: number;
  encode?: ComputerConfig['encode'];
  context?: Partial<ComputerContext>;
}
