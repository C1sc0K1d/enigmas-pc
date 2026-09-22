// Compara a resposta inteira, nunca uma palavra contida em uma frase.
// Normaliza apenas a comparação; as cifras e o histórico preservam o texto original.
export function matchesAnswer(actual: string, expected: string): boolean {
  const normalize = (text: string) =>
    text.normalize('NFD').replace(/\p{M}/gu, '').trim().toUpperCase();
  return normalize(actual) === normalize(expected);
}
