import { AccessToken } from "livekit-server-sdk";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {

  console.log(
    "ENV CHECK",
    process.env.LIVEKIT_API_KEY,
    process.env.LIVEKIT_API_SECRET ? "SECRET_OK" : "SECRET_MISSING",
    process.env.LIVEKIT_URL
  );

  const room = req.nextUrl.searchParams.get("room");
  const username = req.nextUrl.searchParams.get("username");
  if (!room) {
    return NextResponse.json({ error: 'Missing "room" query parameter' }, { status: 400 });
  } else if (!username) {
    return NextResponse.json({ error: 'Missing "username" query parameter' }, { status: 400 });
  }

  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  const wsUrl = process.env.LIVEKIT_URL; // ✅ Fixed name

  if (!apiKey || !apiSecret || !wsUrl) {
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  const at = new AccessToken(apiKey, apiSecret, { identity: username });
  at.addGrant({
    room,
    roomJoin: true,
    canPublish: true,
    canSubscribe: true,
  });

  // ✅ Await the token generation
  const token = await at.toJwt();

  return NextResponse.json({ token });
}
