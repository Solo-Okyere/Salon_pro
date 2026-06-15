/**
 * Process-wide SSE pub/sub for queue events.
 * Stored on `globalThis` so hot-module replacement in dev doesn't drop subscribers.
 */

type Ctrl = ReadableStreamDefaultController;

declare global {
  // eslint-disable-next-line no-var
  var __queueSubscribers: Map<string, Set<Ctrl>> | undefined;
}

function getMap(): Map<string, Set<Ctrl>> {
  if (!globalThis.__queueSubscribers) {
    globalThis.__queueSubscribers = new Map();
  }
  return globalThis.__queueSubscribers;
}

export function subscribe(shopId: string, ctrl: Ctrl): void {
  const map = getMap();
  if (!map.has(shopId)) map.set(shopId, new Set());
  map.get(shopId)!.add(ctrl);
}

export function unsubscribe(shopId: string, ctrl: Ctrl): void {
  const map = getMap();
  map.get(shopId)?.delete(ctrl);
}

export function publish(shopId: string, event: Record<string, unknown>): void {
  const map = getMap();
  const subs = map.get(shopId);
  if (!subs || subs.size === 0) return;

  const chunk = new TextEncoder().encode(`data: ${JSON.stringify(event)}\n\n`);

  for (const ctrl of [...subs]) {
    try {
      ctrl.enqueue(chunk);
    } catch {
      // Controller is closed — remove it
      subs.delete(ctrl);
    }
  }
}
