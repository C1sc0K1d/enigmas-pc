// Cada mensagem reinicia os dois pulsos. O ruído conta caracteres Unicode,
// enquanto o deslocamento avança apenas para letras A–Z/a–z preservadas.
export function decodeChaoticCore(text: string): string {
  const noisePulse = [2, 3, 1];
  const letterPulse = [1, 3, 5];
  const characters = Array.from(text);
  const core: string[] = [];
  let position = 0;
  let group = 0;
  while (position < characters.length) {
    const size = noisePulse[group % noisePulse.length];
    core.push(...characters.slice(position, position + size));
    position += size + 1;
    group++;
  }
  let letter = 0;
  return core.join('').replace(/[a-z]/gi, (character) => {
    const base = character >= 'a' && character <= 'z' ? 97 : 65;
    const shift = letterPulse[letter++ % letterPulse.length];
    return String.fromCharCode(((character.charCodeAt(0) - base - shift + 26) % 26) + base);
  });
}
