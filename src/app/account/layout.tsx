import { redirect } from "next/navigation";

import { AccountNav } from "@/components/account/account-nav";
import { getCurrentUser } from "@/lib/auth/session";

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?redirect=/account");

  return (
    <div className="shell pb-24 pt-8 md:pt-10">
      <h1 className="display-lg border-b border-stone pb-10">Your account</h1>

      <div className="mt-10 grid gap-10 lg:grid-cols-[14rem_1fr] lg:gap-14">
        <AccountNav email={user.email} />
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
