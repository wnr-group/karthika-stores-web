import type { Metadata } from "next";
import { Suspense } from "react";

import { AuthForm } from "@/components/auth/auth-form";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your Karthika account.",
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
