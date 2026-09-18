// Monta um percurso circular que termina no destino, incluindo as duas pontas.
export function createPuzzleRoute(
  order: readonly string[],
  destination: string,
  steps: number,
): string[] {
  const index = order.indexOf(destination);
  if (
    index < 0 ||
    !Number.isInteger(steps) ||
    steps < 1 ||
    steps > order.length ||
    new Set(order).size !== order.length
  ) {
    throw new Error('Percurso inválido para ' + destination + ': ' + steps);
  }
  return Array.from(
    { length: steps },
    (_, step) => order[(index + step - steps + 1 + order.length) % order.length],
  );
}

export function matchesPuzzleRoute(
  actual: readonly string[],
  expected: readonly string[],
): boolean {
  return actual.length === expected.length && actual.every((id, index) => id === expected[index]);
}

// Inclui a máquina obrigatória sem repetir PCs nem alterar o destino.
// Em percursos com uma única máquina, insere antes do destino.
export function includeRequiredComputer(
  route: readonly string[],
  requiredComputerId: string | null,
): string[] {
  if (!route.length) throw new Error('O percurso precisa ter um destino.');
  const result = [...route];
  if (requiredComputerId && !result.includes(requiredComputerId)) {
    result.splice(Math.min(1, result.length - 1), 0, requiredComputerId);
  }
  return result;
}
