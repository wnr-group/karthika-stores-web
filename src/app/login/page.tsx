import type { Metadata } from "next";
import { Suspense } from "react";

import { AuthForm } from "@/components/auth/auth-form";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Sign in",
  description: `Sign in to your ${site.name} account.`,
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return (
    <div className="shell flex min-h-[70vh] items-center justify-center py-16 md:py-24">
      <Suspense fallback={null}>
        <AuthForm mode="login" />
      </Suspense>
    </div>
  );
}
