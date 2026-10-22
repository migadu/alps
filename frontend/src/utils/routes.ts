/**
 * Does `hash` name this tab's route?
 *
 * The match is on a segment boundary, not a bare prefix. `#/tasks`,
 * `#/tasks/all` and `#/tasks?q=x` are the Tasks tab; `#/tasksomething` is not,
 * because a bare `startsWith` lets any tab claim the route of a tab whose id
 * merely begins with its own.
 */
export function matchesTabRoute(hash: string, id: string): boolean {
  const route = `#/${id}`;
  if (!hash.startsWith(route)) return false;
  const rest = hash.slice(route.length);
  return rest === '' || rest.startsWith('/') || rest.startsWith('?');
}
