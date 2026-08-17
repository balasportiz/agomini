/**
 * /api/events — Server-Sent Events stream.
 *
 * On the VPS monolith this is served locally (in-process EventEmitter).
 * On Vercel this proxies to the VPS SSE endpoint, so browser clients
 * always connect to /api/events on the current origin (Vercel), and the
 * real event bus on the VPS streams content-change events through.
 */

export const dynamic = "force-dynamic";

const HEARTBEAT_MS = 25_000;

function getApiBase(): string {
  const raw = process.env.NEXT_PUBLIC_API_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? "";
  return raw.replace(/\/$/, "");
}

function isVercel(): boolean {
  return Boolean(process.env.VERCEL);
}

export async function GET() {
  // On Vercel: proxy through to the VPS SSE endpoint.
  if (isVercel()) {
    const base = getApiBase();
    if (!base) {
      return new Response("NEXT_PUBLIC_API_URL is not configured", { status: 503 });
    }
    try {
      const upstream = await fetch(`${base}/api/events`, {
        headers: { Accept: "text/event-stream" },
        // @ts-expect-error — Next.js fetch supports duplex
        duplex: "half",
      });
      if (!upstream.ok || !upstream.body) {
        return new Response("Upstream SSE unavailable", { status: 502 });
      }
      return new Response(upstream.body, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache, no-transform",
          Connection: "keep-alive",
          "X-Accel-Buffering": "no",
        },
      });
    } catch {
      return new Response("Upstream SSE unreachable", { status: 502 });
    }
  }

  // On the VPS monolith: use the in-process EventEmitter bus.
  const { subscribeToContentChanges } = await import("@/lib/realtime");
  const encoder = new TextEncoder();
  let unsubscribe: (() => void) | undefined;
  let heartbeat: ReturnType<typeof setInterval> | undefined;

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`),
        );
      };
      send("ready", { at: Date.now() });
      unsubscribe = subscribeToContentChanges((event) => send("content-changed", event));
      heartbeat = setInterval(() => {
        controller.enqueue(encoder.encode(": heartbeat\n\n"));
      }, HEARTBEAT_MS);
    },
    cancel() {
      unsubscribe?.();
      if (heartbeat) clearInterval(heartbeat);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
