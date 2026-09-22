"use client";

import { useState } from "react";

import { ArrowRightIcon } from "@/components/ui/icons";

/**
 * The letter sign-up. Posts to /api/newsletter, which validates the address
 * and is the seam for whichever list provider gets wired in.
 */
export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (state === "sending") return;

    setState("sending");
    try {
      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = (await response.json()) as { message?: string };

      if (response.ok) {
        setState("done");
        setMessage(data.message ?? "You are on the list.");
        setEmail("");
      } else {
        setState("error");
        setMessage(data.message ?? "That did not work. Try again?");
      }
    } catch {
      setState("error");
      setMessage("We could not reach the server. Try again in a moment.");
    }
  }

  if (state === "done") {
    return (
      <p className="border-b border-stone pb-2.5 text-[0.8125rem] text-success" role="status">
        {message}
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      <div className="flex items-center gap-3 border-b border-stone focus-within:border-ink">
        <label htmlFor="newsletter-email" className="sr-only">
          Email address
        </label>
        <input
          id="newsletter-email"
          type="email"
          required
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            if (state === "error") setState("idle");
          }}
          placeholder="your@email.com"
          className="w-full bg-transparent py-2.5 text-[0.8125rem] outline-none"
        />
        <button
          type="submit"
          disabled={state === "sending"}
          aria-label="Subscribe"
          className="p-1 text-taupe transition-colors hover:text-ink disabled:opacity-40"
        >
          <ArrowRightIcon className="h-4 w-4" />
        </button>
      </div>

      {state === "error" ? (
        <p className="mt-2 text-[0.6875rem] text-danger" role="alert">
          {message}
        </p>
      ) : null}
    </form>
  );
}
