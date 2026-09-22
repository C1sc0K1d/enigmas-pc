// Segue apenas as saídas atuais, visitando cada PC no máximo uma vez.
export function getOutputChain(
  origin: string,
  next: (id: string) => string | null,
): {
  route: string[];
  cycleAt: string | null;
} {
  const route: string[] = [];
  const visited = new Set<string>();
  let current: string | null = origin;
  while (current !== null) {
    if (visited.has(current)) return { route, cycleAt: current };
    visited.add(current);
    route.push(current);
    current = next(current);
  }
  return { route, cycleAt: null };
}
