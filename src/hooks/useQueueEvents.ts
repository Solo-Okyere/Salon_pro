"use client";

import { useEffect, useRef } from "react";

export interface QueueEvent {
  type: "queue:join" | "queue:update";
  entry?: Record<string, unknown>;
}

interface Options {
  onJoin?: (event: QueueEvent) => void;
  onUpdate?: (event: QueueEvent) => void;
  enabled?: boolean; // pass false to skip (e.g. while shopId is not yet known)
}

/**
 * Opens an EventSource to /api/queue/events/{shopId}.
 * Auto-reconnects on error. Closes on unmount or when shopId changes.
 */
export function useQueueEvents(shopId: string | null | undefined, options: Options = {}) {
  const { onJoin, onUpdate, enabled = true } = options;
  const onJoinRef = useRef(onJoin);
  const onUpdateRef = useRef(onUpdate);
  onJoinRef.current = onJoin;
  onUpdateRef.current = onUpdate;

  useEffect(() => {
    if (!shopId || !enabled) return;

    let es: EventSource | null = null;
    let retryTimeout: ReturnType<typeof setTimeout> | null = null;
    let alive = true;

    function connect() {
      if (!alive) return;
      es = new EventSource(`/api/queue/events/${shopId}`);

      es.onmessage = (e) => {
        try {
          const evt: QueueEvent = JSON.parse(e.data);
          if (evt.type === "queue:join") onJoinRef.current?.(evt);
          if (evt.type === "queue:update") onUpdateRef.current?.(evt);
        } catch {
          // malformed message — ignore
        }
      };

      es.onerror = () => {
        es?.close();
        es = null;
        if (alive) {
          // Back-off 3s then reconnect
          retryTimeout = setTimeout(connect, 3000);
        }
      };
    }

    connect();

    return () => {
      alive = false;
      if (retryTimeout) clearTimeout(retryTimeout);
      es?.close();
    };
  }, [shopId, enabled]);
}
