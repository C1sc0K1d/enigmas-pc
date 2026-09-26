/** Public API metadata. Answers, routes and ciphers belong exclusively to the server. */
export interface ComputerSummary {
  id: string;
  name: string;
  location: string;
  serial: string;
  welcome: string;
}
