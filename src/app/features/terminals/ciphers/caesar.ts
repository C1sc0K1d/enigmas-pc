// Deslocamento circular de A–Z/a–z; preserva acentos, números e pontuação.
export function encodeCaesar(text: string, shift = 3): string {
  return text.replace(/[a-z]/gi, (letter) => {
    const base = letter >= 'a' && letter <= 'z' ? 97 : 65;
    return String.fromCharCode(((((letter.charCodeAt(0) - base + shift) % 26) + 26) % 26) + base);
  });
}
