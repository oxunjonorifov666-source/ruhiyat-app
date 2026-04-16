/** Ichki stack/tab ichidagi eng chuqur faol ekran nomi */
export function getActiveRouteName(state: { index: number; routes: { name: string; state?: unknown }[] } | undefined): string | undefined {
  if (!state || typeof state.index !== 'number') return undefined;
  const route = state.routes[state.index];
  if (!route) return undefined;
  if (route.state && typeof route.state === 'object' && route.state !== null && 'index' in route.state && 'routes' in route.state) {
    return getActiveRouteName(route.state as { index: number; routes: { name: string; state?: unknown }[] }) ?? route.name;
  }
  return route.name;
}
