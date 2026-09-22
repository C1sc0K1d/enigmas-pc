// Lê pares em cada trecho A–Z/a–z; outros caracteres separam os trechos
// e são preservados. Uma letra sozinha forma um par consigo mesma.
export function decodeMask(text: string): string {
  return text.replace(/[a-z]+/gi, (letters) => {
    let output = '';
    for (let index = 0; index < letters.length; index += 2) {
      const first = letters[index];
      const second = letters[index + 1] ?? first;
      const start = first.toUpperCase().charCodeAt(0) - 65;
      const end = second.toUpperCase().charCodeAt(0) - 65;
      const distance = (end - start + 26) % 26;
      if (distance === 1 || distance === 0) {
        output += ' ';
        continue;
      }
      const middle = (start + Math.floor(distance / 2)) % 26;
      const base = first >= 'a' && first <= 'z' ? 97 : 65;
      output += String.fromCharCode(base + middle);
    }
    return output;
  });
}
