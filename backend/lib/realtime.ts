import { EventEmitter } from "node:events";

/**
 * In-process publish/subscribe bus that lets Payload collection/global hooks
 * notify open browser tabs (via the SSE route at /api/events) that public
 * content changed, so pages can refresh without a manual reload.
 *
 * This assumes a single Node.js process, which matches this project's
 * deployment (one `app` service in docker-compose.yml, no clustering/PM2).
 * If this app is ever scaled to multiple instances behind a load balancer,
 * this would need to move to a shared pub/sub (e.g. Postgres LISTEN/NOTIFY,
 * since Postgres is already a dependency) so every instance's SSE clients
 * hear about changes made on other instances.
 */

export type ContentChangedEvent = {
  collection: string;
  at: number;
};

const EVENT_NAME = "content-changed";
const DEBOUNCE_MS = 250;

// Cached on globalThis so Next.js dev-mode module reloading (HMR) doesn't
// create a second emitter that nobody is subscribed to.
const globalForRealtime = globalThis as unknown as { __agomoniRealtimeBus?: EventEmitter };

function getBus(): EventEmitter {
  if (!globalForRealtime.__agomoniRealtimeBus) {
    const bus = new EventEmitter();
    bus.setMaxListeners(0);
    globalForRealtime.__agomoniRealtimeBus = bus;
  }
  return globalForRealtime.__agomoniRealtimeBus;
}

let pendingCollections = new Set<string>();
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Call from a collection/global hook whenever a document changes in a way
 * the public site cares about. Batches rapid-fire calls (e.g. bulk edits or
 * a Drive import of many photos) into a single broadcast.
 */
export function notifyContentChanged(collectionOrGlobalSlug: string): void {
  pendingCollections.add(collectionOrGlobalSlug);
  if (debounceTimer) return;
  debounceTimer = setTimeout(() => {
    const collections = Array.from(pendingCollections);
    pendingCollections = new Set();
    debounceTimer = null;
    const event: ContentChangedEvent = { collection: collections.join(","), at: Date.now() };
    getBus().emit(EVENT_NAME, event);
  }, DEBOUNCE_MS);
}

/** Subscribes to content-changed events. Returns an unsubscribe function. */
export function subscribeToContentChanges(listener: (event: ContentChangedEvent) => void): () => void {
  const bus = getBus();
  bus.on(EVENT_NAME, listener);
  return () => bus.off(EVENT_NAME, listener);
}

/**
 * Convenience hook pair for a collection: notifies subscribers after any
 * create/update (afterChange) or delete (afterDelete). Spread the result
 * into a collection's `hooks` property.
 *
 * Example:
 *   hooks: { ...notifyOnChangeHooks("faqs") }
 */
export function notifyOnChangeHooks(slug: string) {
  return {
    afterChange: [
      () => {
        notifyContentChanged(slug);
      },
    ],
    afterDelete: [
      () => {
        notifyContentChanged(slug);
      },
    ],
  };
}
