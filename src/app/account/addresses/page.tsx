import type { Metadata } from "next";

import { AddressBook } from "@/components/account/address-book";
import { getCurrentUser } from "@/lib/auth/session";
import { getRepository } from "@/lib/data/repository";

export const metadata: Metadata = {
  title: "Addresses",
  robots: { index: false, follow: false },
};

export default async function AccountAddressesPage() {
  const user = await getCurrentUser();
  const repository = await getRepository();
  const addresses = user ? await repository.listAddresses(user.uid) : [];

  return <AddressBook initial={addresses} />;
}
