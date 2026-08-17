// TikTok OAuth + publishing helpers shared by the dashboard and API routes.
// The client key is public (it appears in the OAuth URL); the client secret
// lives ONLY in server env (TIKTOK_CLIENT_SECRET on Vercel), never in code.

export const TIKTOK_SCOPES = "user.info.basic,video.upload,video.publish";

export const tiktokClientKey = () =>
  process.env.NEXT_PUBLIC_TIKTOK_CLIENT_KEY ?? "";

export function tiktokRedirectUri() {
  if (typeof window === "undefined") return "";
  return `${window.location.origin}/auth/tiktok/callback`;
}

// PKCE: TikTok web OAuth requires code_verifier/code_challenge (plain S256).
async function sha256hex(text: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function buildAuthUrl(): Promise<string> {
  const verifier = Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map((b) => "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"[b % 62])
    .join("");
  const state = Array.from(crypto.getRandomValues(new Uint8Array(16)))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  sessionStorage.setItem("tt_verifier", verifier);
  sessionStorage.setItem("tt_state", state);
  const challenge = await sha256hex(verifier);
  const params = new URLSearchParams({
    client_key: tiktokClientKey(),
    scope: TIKTOK_SCOPES,
    response_type: "code",
    redirect_uri: tiktokRedirectUri(),
    state,
    code_challenge: challenge,
    code_challenge_method: "S256",
  });
  return `https://www.tiktok.com/v2/auth/authorize/?${params}`;
}

// The TikTok connection stored on the user's Firestore doc.
export type TikTokConnection = {
  openId: string;
  displayName: string;
  avatarUrl?: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // epoch ms
  scope: string;
};

export const PRIVACY_LEVELS: Record<string, string> = {
  PUBLIC_TO_EVERYONE: "Public",
  MUTUAL_FOLLOW_FRIENDS: "Friends",
  FOLLOWER_OF_CREATOR: "Followers",
  SELF_ONLY: "Only me",
};
