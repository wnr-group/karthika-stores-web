"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { MobileNav } from "@/components/layout/mobile-nav";
import { SearchOverlay } from "@/components/layout/search-overlay";
import { useAuth } from "@/components/providers/auth-provider";
import { useCart } from "@/components/providers/cart-provider";
import { useWishlist } from "@/components/providers/wishlist-provider";
import { Media, ratio } from "@/components/ui/media";
import {
  BagIcon,
  HeartIcon,
  MenuIcon,
  SearchIcon,
  UserIcon,
} from "@/components/ui/icons";
import { primaryNav, site, type NavGroup } from "@/lib/site";
import type { Tone } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * The header.
 *
 * Wordmark left, navigation centred, actions right. On scroll it loses about
 * a third of its height and gains a hairline; nothing else moves. Panels open
 * on hover and on focus, and close on Escape or on route change.
 */
export function Header() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [openPanel, setOpenPanel] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { count: bagCount, openBag } = useCart();
  const { count: wishCount } = useWishlist();
  const { user } = useAuth();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Any navigation closes everything.
  useEffect(() => {
    setOpenPanel(null);
    setMenuOpen(false);
    setSearchOpen(false);
  }, [pathname]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpenPanel(null);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // A short grace period, so crossing the gap between the trigger and the
  // panel does not snap it shut.
  function scheduleClose() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpenPanel(null), 120);
  }

  function cancelClose() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  }

  const active = primaryNav.find((group) => group.label === openPanel);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b transition-[background-color,border-color] duration-[300ms] ease-[cubic-bezier(0.22,0.61,0.36,1)]",
        scrolled || openPanel
          ? "border-stone bg-paper/95 backdrop-blur-[2px]"
          : "border-transparent bg-ivory",
      )}
      onMouseLeave={scheduleClose}
    >
      <div
        className={cn(
          "shell flex items-center justify-between transition-[height] duration-[300ms] ease-[cubic-bezier(0.22,0.61,0.36,1)]",
          scrolled ? "h-14 md:h-16" : "h-16 md:h-24",
        )}
      >
        {/* Left: menu on mobile, wordmark on desktop */}
        <div className="flex flex-1 items-center gap-1">
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
            className="-ml-2 p-2 text-ink lg:hidden"
          >
            <MenuIcon className="h-5 w-5" />
          </button>

          <Link
            href="/"
            className="hidden lg:block"
            aria-label={`${site.name}, home`}
          >
            <Wordmark compact={scrolled} />
          </Link>
        </div>

        {/* Centre: wordmark on mobile, navigation on desktop */}
        <Link href="/" className="lg:hidden" aria-label={`${site.name}, home`}>
          <Wordmark compact />
        </Link>

        <nav aria-label="Primary" className="hidden lg:block">
          <ul className="flex items-center gap-9">
            {primaryNav.map((group) => (
              <li
                key={group.label}
                onMouseEnter={() => {
                  cancelClose();
                  setOpenPanel(group.columns ? group.label : null);
                }}
              >
                <Link
                  href={group.href}
                  onFocus={() => setOpenPanel(group.columns ? group.label : null)}
                  aria-expanded={group.columns ? openPanel === group.label : undefined}
                  className={cn(
                    "relative block py-2 text-[0.6875rem] uppercase tracking-[0.18em] transition-colors duration-[240ms]",
                    openPanel === group.label ? "text-ink" : "text-graphite hover:text-ink",
                  )}
                >
                  {group.label}
                  <span
                    aria-hidden
                    className={cn(
                      "absolute -bottom-0.5 left-0 h-px w-full origin-left bg-ink transition-transform duration-[240ms] ease-[cubic-bezier(0.22,0.61,0.36,1)]",
                      openPanel === group.label ? "scale-x-100" : "scale-x-0",
                    )}
                  />
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Right: actions */}
        <div className="flex flex-1 items-center justify-end gap-1 md:gap-2">
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            aria-label="Search"
            className="p-2 text-ink transition-colors hover:text-terracotta"
          >
            <SearchIcon className="h-[1.15rem] w-[1.15rem]" />
          </button>

          <Link
            href={user ? "/account" : "/login"}
            aria-label={user ? "Your account" : "Sign in"}
            className="hidden p-2 text-ink transition-colors hover:text-terracotta md:block"
          >
            <UserIcon className="h-[1.15rem] w-[1.15rem]" />
          </Link>

          <Link
            href="/wishlist"
            aria-label={`Wishlist, ${wishCount} saved`}
            className="relative p-2 text-ink transition-colors hover:text-terracotta"
          >
            <HeartIcon className="h-[1.15rem] w-[1.15rem]" />
            <Badge count={wishCount} />
          </Link>

          <button
            type="button"
            onClick={openBag}
            aria-label={`Bag, ${bagCount} ${bagCount === 1 ? "item" : "items"}`}
            className="relative p-2 text-ink transition-colors hover:text-terracotta"
          >
            <BagIcon className="h-[1.15rem] w-[1.15rem]" />
            <Badge count={bagCount} />
          </button>
        </div>
      </div>

      {/* Navigation panel */}
      <div
        onMouseEnter={cancelClose}
        onMouseLeave={scheduleClose}
        className={cn(
          "absolute inset-x-0 top-full hidden overflow-hidden border-stone bg-paper transition-[max-height,opacity] duration-[300ms] ease-[cubic-bezier(0.22,0.61,0.36,1)] lg:block",
          active ? "max-h-[28rem] border-b opacity-100" : "max-h-0 opacity-0",
        )}
      >
        {active ? <NavPanel group={active} /> : null}
      </div>

      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
      <MobileNav open={menuOpen} onClose={() => setMenuOpen(false)} />
    </header>
  );
}

/* -------------------------------------------------------------------------
   Wordmark
   ------------------------------------------------------------------------- */

function Wordmark({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex flex-col items-center lg:items-start">
      <span
        className={cn(
          "font-display leading-none tracking-[0.34em] text-ink transition-[font-size] duration-[300ms]",
          compact ? "text-[1.05rem]" : "text-[1.05rem] lg:text-[1.35rem]",
        )}
      >
        KARTHIKA
      </span>
      {!compact ? (
        <span className="mt-1 hidden text-[0.5rem] uppercase tracking-[0.3em] text-taupe lg:block">
          Saree Atelier
        </span>
      ) : null}
    </span>
  );
}

function Badge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="tnum absolute right-0.5 top-0.5 min-w-[1rem] rounded-full bg-ink px-1 text-center text-[0.5625rem] leading-4 text-paper">
      {count > 99 ? "99+" : count}
    </span>
  );
}

/* -------------------------------------------------------------------------
   Panel
   ------------------------------------------------------------------------- */

function NavPanel({ group }: { group: NavGroup }) {
  return (
    <div className="shell grid grid-cols-12 gap-10 py-10">
      <div className="col-span-8 grid grid-cols-3 gap-10">
        {group.columns?.map((column) => (
          <div key={column.heading}>
            <p className="eyebrow mb-5">{column.heading}</p>
            <ul className="space-y-3">
              {column.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="link-quiet text-[0.875rem] text-graphite hover:text-ink"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {group.feature ? (
        <Link href={group.feature.href} className="group col-span-4 flex gap-5">
          <div className={cn("relative w-32 shrink-0 overflow-hidden", ratio.portrait)}>
            <Media
              image={{
                id: `nav-${group.label}`,
                url: null,
                alt: group.feature.title,
                kind: "lifestyle",
                tone: group.feature.tone as Tone,
                displayOrder: 0,
              }}
              className="absolute inset-0 transition-transform duration-[600ms] ease-[cubic-bezier(0.22,0.61,0.36,1)] group-hover:scale-[1.03]"
              sizes="128px"
            />
          </div>
          <div className="self-end pb-2">
            <p className="eyebrow mb-2">{group.feature.eyebrow}</p>
            <p className="display-sm">{group.feature.title}</p>
            <span className="mt-3 inline-block text-[0.6875rem] uppercase tracking-[0.16em] text-taupe transition-colors group-hover:text-ink">
              View
            </span>
          </div>
        </Link>
      ) : null}
    </div>
  );
}
