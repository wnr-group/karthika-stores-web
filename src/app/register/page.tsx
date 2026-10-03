import type { Metadata } from "next";
import { Suspense } from "react";

import { AuthForm } from "@/components/auth/auth-form";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Create an account",
  description: `Create a ${site.name} account to save addresses, track orders and keep a wishlist.`,
  robots: { index: false, follow: false },
};

export default function RegisterPage() {
  return (
    <div className="shell flex min-h-[70vh] items-center justify-center py-16 md:py-24">
      <Suspense fallback={null}>
        <AuthForm mode="register" />
      </Suspense>
    </div>
  );
}
