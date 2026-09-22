import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";

import { AnnouncementBar } from "@/components/layout/announcement-bar";
import { SiteChrome } from "@/components/layout/chrome";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { WhatsAppBubble } from "@/components/layout/whatsapp-bubble";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { Providers } from "@/components/providers";
import { site } from "@/lib/site";

import "./globals.css";

/* The editorial serif. Light weights only; 600 is for the rare small caps. */
const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-cormorant",
  display: "swap",
});

/* The UI face. Everything functional is set in this. */
const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} — Handwoven sarees from Kanchipuram and Banaras`,
    template: `%s — ${site.name}`,
  },
  description: site.description,
  applicationName: site.name,
  keywords: [
    "handwoven sarees",
    "Kanchipuram silk saree",
    "Banarasi saree",
    "organza saree",
    "linen saree",
    "saree boutique Chennai",
  ],
  authors: [{ name: site.legalName }],
  openGraph: {
    type: "website",
    locale: site.locale,
    url: site.url,
    siteName: site.name,
    title: `${site.name} — A saree atelier`,
    description: site.description,
  },
  twitter: {
    card: "summary_large_image",
    title: `${site.name} — A saree atelier`,
    description: site.description,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  alternates: { canonical: "/" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#f4efe6",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN" className={`${cormorant.variable} ${inter.variable}`}>
      <body className="flex min-h-screen flex-col">
        <Providers>
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:border focus:border-ink focus:bg-paper focus:px-4 focus:py-2 focus:text-sm"
          >
            Skip to content
          </a>

          <SiteChrome>
            <AnnouncementBar />
            <Header />
          </SiteChrome>

          <main id="main" className="flex-1">
            {children}
          </main>

          <SiteChrome>
            <Footer />
          </SiteChrome>

          <CartDrawer />
          <WhatsAppBubble />
        </Providers>
      </body>
    </html>
  );
}
