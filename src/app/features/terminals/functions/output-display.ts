import { TerminalEntry } from '../models/network.model';

export interface OutputDisplayPart {
  text: string;
  space: boolean;
}

// Split only cipher spaces for decoration. The text stays intact for copying and screen readers.
export function outputDisplayParts(entry: TerminalEntry): OutputDisplayPart[] {
  const parts = entry.outputParts ?? [{ text: entry.output }];
  return parts.flatMap((part) =>
    part.cipher
      ? part.text
          .split(/( )/)
          .filter(Boolean)
          .map((text) => ({ text, space: text === ' ' }))
      : [{ text: part.text, space: false }],
  );
}
