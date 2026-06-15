import { NextRequest, NextResponse } from "next/server";
import { subscribe, unsubscribe } from "@/lib/realtime";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ shopId: string }> }
) {
  const { shopId } = await params;

  const stream = new ReadableStream({
    start(ctrl) {
      subscribe(shopId, ctrl);

      // Send initial connected comment
      ctrl.enqueue(new TextEncoder().encode(": connected\n\n"));

      // Heartbeat every 25s to prevent proxy / browser timeouts
      const hb = setInterval(() => {
        try {
          ctrl.enqueue(new TextEncoder().encode(": heartbeat\n\n"));
        } catch {
          clearInterval(hb);
        }
      }, 25_000);

      // Clean up when client disconnects
      req.signal.addEventListener("abort", () => {
        clearInterval(hb);
        unsubscribe(shopId, ctrl);
        try { ctrl.close(); } catch { /* already closed */ }
      });
    },
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no", // prevent nginx buffering
    },
  });
}
