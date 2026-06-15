import { NextRequest, NextResponse } from "next/server";

const VERIFY_TOKEN = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN!;

// Webhook verification (GET)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: "Invalid token" }, { status: 403 });
}

// Incoming messages (POST)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const entry = body?.entry?.[0];
    const changes = entry?.changes?.[0];
    const messages = changes?.value?.messages;

    if (!messages?.length) return NextResponse.json({ status: "ok" });

    for (const msg of messages) {
      const phone = msg.from;
      const text = msg.text?.body?.toLowerCase().trim();

      // Handle simple commands
      if (text === "queue" || text === "status") {
        // TODO: Respond with queue status for the user's active shop
        console.log(`[WhatsApp] Status request from ${phone}`);
      } else if (text === "cancel") {
        // TODO: Cancel upcoming booking
        console.log(`[WhatsApp] Cancel request from ${phone}`);
      } else if (text === "reschedule") {
        // TODO: Reschedule flow
        console.log(`[WhatsApp] Reschedule request from ${phone}`);
      }
    }

    return NextResponse.json({ status: "ok" });
  } catch (err) {
    console.error("[WhatsApp webhook]", err);
    return NextResponse.json({ status: "error" }, { status: 500 });
  }
}
