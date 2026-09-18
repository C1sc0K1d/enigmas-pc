// As posições contam pontos de código Unicode, incluindo espaços e símbolos.
export function weaveText(text: string): string {
  const forward: string[] = [];
  const returning: string[] = [];
  Array.from(text).forEach((character, index) => {
    (index % 2 === 0 ? forward : returning).push(character);
  });
  return forward.concat(returning.reverse()).join('');
}

// Inversa para ferramentas do mestre e testes; não é um comando do terminal.
export function unweaveText(text: string): string {
  const characters = Array.from(text);
  const firstLength = Math.ceil(characters.length / 2);
  const output: string[] = [];
  for (let index = 0; index < firstLength; index++) {
    output.push(characters[index]);
    if (index < characters.length - firstLength) {
      output.push(characters[characters.length - 1 - index]);
    }
  }
  return output.join('');
}
