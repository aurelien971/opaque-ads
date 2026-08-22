"use client";
// Shared email/password form for /login and /signup.
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
} from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

export default function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [info, setInfo] = useState("");
  const router = useRouter();

  async function resetPassword() {
    setError("");
    setInfo("");
    if (!email) {
      setError("Enter your email above first, then tap Forgot password.");
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      setInfo(
        "If an account exists for that email, a reset link is on its way. Check spam too.",
      );
    } catch {
      setError("Couldn't send the reset email. Please try again.");
    }
  }

  async function google() {
    setError("");
    setBusy(true);
    try {
      const cred = await signInWithPopup(auth, new GoogleAuthProvider());
      await setDoc(
        doc(db, "users", cred.user.uid),
        { email: cred.user.email ?? "", createdAt: serverTimestamp(), plan: "free" },
        { merge: true },
      );
      router.push("/dashboard");
    } catch {
      setError("Google sign-in didn't complete. Try again or use email.");
    } finally {
      setBusy(false);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (mode === "signup") {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await setDoc(
          doc(db, "users", cred.user.uid),
          { email, createdAt: serverTimestamp(), plan: "free" },
          { merge: true },
        );
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      router.push("/dashboard");
    } catch (err: unknown) {
      const code = err instanceof Error ? err.message : String(err);
      setError(
        code.includes("invalid-credential") || code.includes("wrong-password")
          ? "Wrong email or password."
          : code.includes("email-already-in-use")
            ? "An account with this email already exists — sign in instead."
            : code.includes("weak-password")
              ? "Password must be at least 6 characters."
              : "Something went wrong. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto mt-16 w-full max-w-sm rounded-2xl border border-stroke bg-surface p-8">
      <h1 className="text-2xl font-bold">
        {mode === "signup" ? "Create your account" : "Welcome back"}
      </h1>
      <p className="mt-1 text-sm text-muted">
        {mode === "signup"
          ? "Free during beta. No credit card."
          : "Sign in to your studio."}
      </p>
      <button
        type="button"
        onClick={google}
        disabled={busy}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-full border border-stroke bg-surface py-2.5 font-semibold shadow-sm transition hover:border-accent disabled:opacity-50"
      >
        <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.5l6.7-6.7C35.6 2.5 30.2 0 24 0 14.6 0 6.5 5.4 2.6 13.3l7.8 6C12.3 13.6 17.7 9.5 24 9.5z"/><path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.2 5.5-4.7 7.2l7.4 5.7c4.3-4 7.1-9.9 7.1-17.4z"/><path fill="#FBBC05" d="M10.4 28.7A14.5 14.5 0 0 1 9.5 24c0-1.6.3-3.2.8-4.7l-7.8-6A24 24 0 0 0 0 24c0 3.9.9 7.5 2.6 10.7l7.8-6z"/><path fill="#34A853" d="M24 48c6.2 0 11.6-2 15.4-5.6l-7.4-5.7c-2.1 1.4-4.8 2.3-8 2.3-6.3 0-11.7-4.1-13.6-9.8l-7.8 6C6.5 42.6 14.6 48 24 48z"/></svg>
        Continue with Google
      </button>
      <div className="my-4 flex items-center gap-3 text-xs text-muted"><span className="h-px flex-1 bg-stroke" />or<span className="h-px flex-1 bg-stroke" /></div>
      <form onSubmit={submit} className="space-y-4">
        <input
          type="email"
          required
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg border border-stroke bg-ink px-4 py-2.5 text-sm outline-none focus:border-accent"
        />
        <input
          type="password"
          required
          minLength={6}
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-lg border border-stroke bg-ink px-4 py-2.5 text-sm outline-none focus:border-accent"
        />
        {error && <p className="text-sm text-red-400">{error}</p>}
        {info && <p className="text-sm text-accent">{info}</p>}
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-full bg-fg py-2.5 font-semibold text-white transition hover:bg-deep hover:text-white disabled:opacity-50"
        >
          {busy ? "…" : mode === "signup" ? "Create account" : "Sign in"}
        </button>
      </form>
      {mode === "login" && (
        <button
          type="button"
          onClick={resetPassword}
          className="mt-3 w-full text-center text-xs text-muted hover:text-accent"
        >
          Forgot password?
        </button>
      )}
      <p className="mt-5 text-center text-sm text-muted">
        {mode === "signup" ? (
          <>
            Already have an account?{" "}
            <Link href="/login" className="text-accent">
              Sign in
            </Link>
          </>
        ) : (
          <>
            New here?{" "}
            <Link href="/signup" className="text-accent">
              Create an account
            </Link>
          </>
        )}
      </p>
      {mode === "signup" && (
        <p className="mt-4 text-center text-xs text-muted">
          By signing up you agree to our{" "}
          <Link href="/terms" className="text-accent">
            Terms
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="text-accent">
            Privacy Policy
          </Link>
          .
        </p>
      )}
    </div>
  );
}
