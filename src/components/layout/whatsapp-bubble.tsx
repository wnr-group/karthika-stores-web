"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { WhatsAppIcon } from "@/components/ui/icons";
import { site } from "@/lib/site";
import { cn } from "@/lib/utils";

/**
 * The WhatsApp button, bottom right.
 *
 * Appears after a short scroll rather than immediately, so it does not sit on
 * top of the hero. Hidden during checkout, where nothing should compete with
 * finishing the order.
 */
export function WhatsAppBubble() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 500);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (pathname.startsWith("/checkout") || pathname.startsWith("/admin")) return null;

  const message = encodeURIComponent(
    "Hello Karthika, I have a question about a saree on your website.",
  );

  return (
    <a
      href={`https://wa.me/${site.contact.whatsapp}?text=${message}`}
      target="_blank"
      rel="noreferrer"
      aria-label="Message us on WhatsApp"
      className={cn(
        "fixed bottom-6 right-4 z-[55] flex h-12 w-12 items-center justify-center rounded-full bg-ink text-paper shadow-[0_2px_16px_rgba(31,28,25,0.18)] transition-all duration-[300ms] ease-[cubic-bezier(0.22,0.61,0.36,1)] hover:bg-olive md:right-8",
        visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0",
      )}
    >
      <WhatsAppIcon className="h-5 w-5" />
    </a>
  );
}
