"use client";
// Shared email/password form for /login and /signup.
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
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
      <form onSubmit={submit} className="mt-6 space-y-4">
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
