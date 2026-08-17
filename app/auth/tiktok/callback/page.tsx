"use client";
// TikTok OAuth landing: verifies state, exchanges the code server-side (the
// client secret never touches the browser), stores the connection on the
// user's doc, and returns to the dashboard.
import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth";
import { tiktokRedirectUri } from "@/lib/tiktok";

function CallbackInner() {
  const params = useSearchParams();
  const router = useRouter();
  const { user, loading } = useAuth();
  const [status, setStatus] = useState("Finishing the TikTok connection…");
  const ran = useRef(false);

  useEffect(() => {
    if (loading || ran.current) return;
    ran.current = true;
    (async () => {
      const code = params.get("code");
      const state = params.get("state");
      const err = params.get("error");
      if (err) {
        setStatus(`TikTok returned an error: ${err}. You can close this page.`);
        return;
      }
      if (!code || state !== sessionStorage.getItem("tt_state")) {
        setStatus("Invalid or expired sign-in attempt. Please try again.");
        return;
      }
      if (!user) {
        setStatus("Sign in to Opaque Studio first, then reconnect TikTok.");
        return;
      }
      const res = await fetch("/api/tiktok/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          codeVerifier: sessionStorage.getItem("tt_verifier"),
          redirectUri: tiktokRedirectUri(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus(data.error ?? "Token exchange failed. Please try again.");
        return;
      }
      await updateDoc(doc(db, "users", user.uid), { tiktok: data.connection });
      router.replace("/dashboard");
    })();
  }, [loading, user, params, router]);

  return (
    <div className="flex min-h-screen items-center justify-center px-6 text-center text-muted">
      {status}
    </div>
  );
}

export default function TikTokCallback() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-muted">
          …
        </div>
      }
    >
      <CallbackInner />
    </Suspense>
  );
}
