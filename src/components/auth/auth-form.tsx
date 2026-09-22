"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { useAuth } from "@/components/providers/auth-provider";
import { Field } from "@/components/ui/primitives";
import { authErrorMessage } from "@/lib/firebase/client";

/**
 * Sign in, register and password reset, in one component.
 *
 * The three share a layout, an error treatment and a Google button, and
 * splitting them into three files would mean maintaining that three times.
 */

type Mode = "login" | "register" | "reset";

const COPY: Record<Mode, { title: string; intro: string; submit: string }> = {
  login: {
    title: "Sign in",
    intro: "For your order history, saved addresses and wishlist.",
    submit: "Sign in",
  },
  register: {
    title: "Create an account",
    intro: "It takes a moment, and it keeps your wishlist wherever you are.",
    submit: "Create account",
  },
  reset: {
    title: "Reset your password",
    intro: "We will email you a link to set a new one.",
    submit: "Send the link",
  },
};

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, configured, signInWithEmail, registerWithEmail, signInWithGoogle, resetPassword } =
    useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  const redirect = searchParams.get("redirect") ?? "/account";

  // Someone who is already signed in has no business on this page.
  useEffect(() => {
    if (user) router.replace(redirect);
  }, [user, redirect, router]);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setBusy(true);

    try {
      if (mode === "login") {
        await signInWithEmail(email, password);
        router.push(redirect);
      } else if (mode === "register") {
        await registerWithEmail(name, email, password);
        router.push(redirect);
      } else {
        await resetPassword(email);
        setSent(true);
      }
    } catch (caught) {
      setError(
        caught instanceof Error && caught.message.includes("not configured")
          ? caught.message
          : authErrorMessage(caught),
      );
    } finally {
      setBusy(false);
    }
  }

  async function onGoogle() {
    setError(null);
    setBusy(true);
    try {
      await signInWithGoogle();
      router.push(redirect);
    } catch (caught) {
      setError(
        caught instanceof Error && caught.message.includes("not configured")
          ? caught.message
          : authErrorMessage(caught),
      );
    } finally {
      setBusy(false);
    }
  }

  const copy = COPY[mode];

  return (
    <div className="mx-auto w-full max-w-sm">
      <h1 className="display-md">{copy.title}</h1>
      <p className="mt-3 text-[0.875rem] text-taupe">{copy.intro}</p>

      {!configured ? (
        <p className="mt-8 border border-stone bg-shell/60 px-4 py-3 text-[0.8125rem] leading-relaxed text-graphite">
          Sign-in is not switched on for this environment yet. Add the{" "}
          <code className="text-[0.75rem]">NEXT_PUBLIC_FIREBASE_*</code> values to{" "}
          <code className="text-[0.75rem]">.env.local</code> to enable it. You can still browse
          and check out as a guest.
        </p>
      ) : null}

      {sent ? (
        <p className="mt-8 border border-stone bg-shell/60 px-4 py-3 text-[0.8125rem] text-graphite">
          If there is an account for {email}, the link is on its way. Check the spam folder if it
          has not arrived in a few minutes.
        </p>
      ) : (
        <form onSubmit={onSubmit} className="mt-10 space-y-6" noValidate>
          {mode === "register" ? (
            <Field label="Name" htmlFor="name">
              <input
                id="name"
                autoComplete="name"
                required
                className="field"
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </Field>
          ) : null}

          <Field label="Email" htmlFor="email">
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              className="field"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </Field>

          {mode !== "reset" ? (
            <Field
              label="Password"
              htmlFor="password"
              hint={mode === "register" ? "At least six characters" : undefined}
            >
              <input
                id="password"
                type="password"
                autoComplete={mode === "register" ? "new-password" : "current-password"}
                required
                minLength={6}
                className="field"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </Field>
          ) : null}

          {error ? (
            <p role="alert" className="text-[0.8125rem] text-danger">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={busy}
            className="h-12 w-full bg-ink text-[0.6875rem] uppercase tracking-[0.16em] text-paper transition-colors hover:bg-terracotta-deep disabled:opacity-50"
          >
            {busy ? "One moment..." : copy.submit}
          </button>
        </form>
      )}

      {mode !== "reset" ? (
        <>
          <div className="my-8 flex items-center gap-4">
            <span className="h-px flex-1 bg-stone" />
            <span className="text-[0.625rem] uppercase tracking-[0.18em] text-taupe">or</span>
            <span className="h-px flex-1 bg-stone" />
          </div>

          <button
            type="button"
            onClick={onGoogle}
            disabled={busy}
            className="flex h-12 w-full items-center justify-center gap-3 border border-stone text-[0.6875rem] uppercase tracking-[0.16em] text-ink transition-colors hover:border-ink disabled:opacity-50"
          >
            <GoogleMark />
            Continue with Google
          </button>
        </>
      ) : null}

      <div className="mt-10 space-y-2 border-t border-stone pt-6 text-[0.8125rem] text-taupe">
        {mode === "login" ? (
          <>
            <p>
              New here?{" "}
              <Link href="/register" className="link-rule text-ink">
                Create an account
              </Link>
            </p>
            <p>
              <Link href="/forgot-password" className="link-rule text-ink">
                Forgotten your password?
              </Link>
            </p>
          </>
        ) : null}

        {mode === "register" ? (
          <p>
            Already have an account?{" "}
            <Link href="/login" className="link-rule text-ink">
              Sign in
            </Link>
          </p>
        ) : null}

        {mode === "reset" ? (
          <p>
            <Link href="/login" className="link-rule text-ink">
              Back to sign in
            </Link>
          </p>
        ) : null}

        <p className="pt-2">
          You can also{" "}
          <Link href="/checkout" className="link-rule text-ink">
            check out as a guest
          </Link>
          .
        </p>
      </div>
    </div>
  );
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 18 18" className="h-4 w-4" aria-hidden>
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.49h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.63Z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.83.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18Z"
      />
      <path
        fill="#FBBC05"
        d="M3.97 10.72a5.4 5.4 0 0 1 0-3.44V4.95H.96a9 9 0 0 0 0 8.1l3-2.33Z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.59C13.46.9 11.43 0 9 0A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58Z"
      />
    </svg>
  );
}
