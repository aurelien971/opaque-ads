// Exchanges a TikTok OAuth code for tokens, then fetches the creator's basic
// profile. Requires env: TIKTOK_CLIENT_KEY (or NEXT_PUBLIC_TIKTOK_CLIENT_KEY)
// and TIKTOK_CLIENT_SECRET — set on Vercel, never committed.
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const clientKey =
    process.env.TIKTOK_CLIENT_KEY ?? process.env.NEXT_PUBLIC_TIKTOK_CLIENT_KEY;
  const clientSecret = process.env.TIKTOK_CLIENT_SECRET;
  if (!clientKey || !clientSecret) {
    return NextResponse.json(
      {
        error:
          "TikTok publishing is pending platform approval. It activates as soon as TikTok issues our production credentials.",
      },
      { status: 503 },
    );
  }

  const { code, codeVerifier, redirectUri } = await req.json();
  if (!code || !redirectUri) {
    return NextResponse.json({ error: "Missing code." }, { status: 400 });
  }

  const tokenRes = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_key: clientKey,
      client_secret: clientSecret,
      code,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
      ...(codeVerifier ? { code_verifier: codeVerifier } : {}),
    }),
  });
  const token = await tokenRes.json();
  if (!tokenRes.ok || token.error) {
    return NextResponse.json(
      { error: token.error_description ?? "TikTok rejected the code." },
      { status: 400 },
    );
  }

  // Basic profile for the "publishing as @…" identity requirement.
  const meRes = await fetch(
    "https://open.tiktokapis.com/v2/user/info/?fields=open_id,display_name,avatar_url",
    { headers: { Authorization: `Bearer ${token.access_token}` } },
  );
  const me = await meRes.json();
  const u = me.data?.user ?? {};

  return NextResponse.json({
    connection: {
      openId: token.open_id ?? u.open_id ?? "",
      displayName: u.display_name ?? "TikTok account",
      avatarUrl: u.avatar_url ?? "",
      accessToken: token.access_token,
      refreshToken: token.refresh_token,
      expiresAt: Date.now() + (token.expires_in ?? 86400) * 1000,
      scope: token.scope ?? "",
    },
  });
}
