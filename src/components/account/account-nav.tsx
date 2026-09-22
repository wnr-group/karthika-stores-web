"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { useAuth } from "@/components/providers/auth-provider";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/account", label: "Overview" },
  { href: "/account/orders", label: "Orders" },
  { href: "/account/wishlist", label: "Wishlist" },
  { href: "/account/addresses", label: "Addresses" },
];

export function AccountNav({ email }: { email: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut } = useAuth();

  async function onSignOut() {
    await signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <nav aria-label="Account" className="lg:sticky lg:top-28 lg:self-start">
      <ul className="flex gap-6 overflow-x-auto border-b border-stone pb-4 lg:flex-col lg:gap-0 lg:border-b-0 lg:pb-0">
        {LINKS.map((link) => {
          const active =
            link.href === "/account"
              ? pathname === "/account"
              : pathname.startsWith(link.href);

          return (
            <li key={link.href} className="lg:border-b lg:border-stone-soft">
              <Link
                href={link.href}
                className={cn(
                  "block whitespace-nowrap text-[0.6875rem] uppercase tracking-[0.16em] transition-colors lg:py-3.5",
                  active ? "text-ink" : "text-taupe hover:text-ink",
                )}
              >
                {link.label}
              </Link>
            </li>
          );
        })}
      </ul>

      <div className="mt-8 hidden lg:block">
        <p className="text-[0.6875rem] text-taupe">Signed in as</p>
        <p className="mt-1 break-all text-[0.8125rem] text-ink">{email}</p>
      </div>

      <button
        type="button"
        onClick={onSignOut}
        className="mt-6 text-[0.6875rem] uppercase tracking-[0.16em] text-taupe underline-offset-4 transition-colors hover:text-ink hover:underline"
      >
        Sign out
      </button>
    </nav>
  );
}
