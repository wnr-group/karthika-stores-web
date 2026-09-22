"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // The digest is what correlates this screen with the server log.
    console.error("Unhandled error", error);
  }, [error]);

  return (
    <div className="shell flex min-h-[70vh] flex-col justify-center py-24">
      <div className="max-w-xl">
        <p className="eyebrow">Something broke</p>
        <h1 className="display-lg mt-5">That did not work.</h1>
        <p className="mt-6 text-[1.0625rem] leading-relaxed text-graphite">
          The fault is ours, not yours. Try again, and if it keeps happening tell us and we will
          look at it properly.
        </p>

        <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4">
          <button
            type="button"
            onClick={reset}
            className="border border-ink px-8 py-3.5 text-[0.6875rem] uppercase tracking-[0.16em] text-ink transition-colors hover:bg-ink hover:text-paper"
          >
            Try again
          </button>
          <Link href="/" className="link-quiet text-[0.6875rem] uppercase tracking-[0.16em]">
            Back to the homepage
          </Link>
        </div>

        {error.digest ? (
          <p className="tnum mt-12 border-t border-stone pt-6 text-[0.75rem] text-taupe">
            Reference {error.digest}
          </p>
        ) : null}
      </div>
    </div>
  );
}
