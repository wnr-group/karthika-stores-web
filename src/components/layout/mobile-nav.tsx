"use client";

import Link from "next/link";
import { useState } from "react";

import { useAuth } from "@/components/providers/auth-provider";
import { Drawer } from "@/components/ui/drawer";
import { ChevronDownIcon } from "@/components/ui/icons";
import { primaryNav, site } from "@/lib/site";
import { cn } from "@/lib/utils";

/**
 * The mobile menu.
 *
 * Not a stacked copy of the desktop nav: groups collapse, the type is larger
 * than it is on desktop because it is being read at arm's length, and the
 * account and contact rows sit at the bottom where a thumb reaches.
 */
export function MobileNav({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const { user } = useAuth();

  return (
    <Drawer open={open} onClose={onClose} side="left" title="Menu" hideTitle>
      <nav aria-label="Mobile" className="px-5 py-2">
        <ul>
          {primaryNav.map((group) => {
            const isOpen = expanded === group.label;

            return (
              <li key={group.label} className="border-b border-stone-soft">
                {group.columns ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setExpanded(isOpen ? null : group.label)}
                      aria-expanded={isOpen}
                      className="flex w-full items-center justify-between py-4 text-left"
                    >
                      <span className="font-display text-[1.5rem] leading-none text-ink">
                        {group.label}
                      </span>
                      <ChevronDownIcon
                        className={cn(
                          "h-4 w-4 text-taupe transition-transform duration-[240ms]",
                          isOpen && "rotate-180",
                        )}
                      />
                    </button>

                    <div
                      className={cn(
                        "grid transition-[grid-template-rows] duration-[300ms] ease-[cubic-bezier(0.22,0.61,0.36,1)]",
                        isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
                      )}
                    >
                      <div className="overflow-hidden">
                        <div className="space-y-6 pb-6 pl-1">
                          {group.columns.map((column) => (
                            <div key={column.heading}>
                              <p className="eyebrow mb-3">{column.heading}</p>
                              <ul className="space-y-2.5">
                                {column.links.map((link) => (
                                  <li key={link.href}>
                                    <Link
                                      href={link.href}
                                      onClick={onClose}
                                      className="text-[0.9375rem] text-graphite"
                                    >
                                      {link.label}
                                    </Link>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <Link
                    href={group.href}
                    onClick={onClose}
                    className="block py-4 font-display text-[1.5rem] leading-none text-ink"
                  >
                    {group.label}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>

        <div className="mt-8 space-y-3 pb-8">
          <Link
            href={user ? "/account" : "/login"}
            onClick={onClose}
            className="block text-[0.6875rem] uppercase tracking-[0.18em] text-graphite"
          >
            {user ? "Your account" : "Sign in"}
          </Link>
          <Link
            href="/wishlist"
            onClick={onClose}
            className="block text-[0.6875rem] uppercase tracking-[0.18em] text-graphite"
          >
            Wishlist
          </Link>
          <Link
            href="/contact"
            onClick={onClose}
            className="block text-[0.6875rem] uppercase tracking-[0.18em] text-graphite"
          >
            Visit the atelier
          </Link>

          <p className="pt-6 text-[0.6875rem] leading-relaxed text-taupe">
            {site.contact.address[0]}
            <br />
            {site.contact.address[1]}
            <br />
            <a href={`tel:${site.contact.phone.replace(/\s/g, "")}`} className="link-rule">
              {site.contact.phone}
            </a>
          </p>
        </div>
      </nav>
    </Drawer>
  );
}
