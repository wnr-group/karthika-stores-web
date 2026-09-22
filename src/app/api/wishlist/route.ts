import { NextResponse } from "next/server";

import { requireUser, UnauthorizedError } from "@/lib/auth/session";
import { getRepository } from "@/lib/data/repository";

interface WishlistBody {
  action?: "add" | "remove" | "merge";
  productId?: string;
  productIds?: string[];
}

/**
 * Syncs the signed-in customer's wishlist. Guests keep theirs in
 * localStorage only; see components/providers/wishlist-provider.tsx.
 */
export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = (await request.json().catch(() => null)) as WishlistBody | null;
    const repository = await getRepository();

    if (body?.action === "merge") {
      const incoming = Array.isArray(body.productIds) ? body.productIds : [];
      for (const productId of incoming) {
        await repository.addToWishlist(user.uid, productId);
      }
    } else if (body?.action === "add" && body.productId) {
      await repository.addToWishlist(user.uid, body.productId);
    } else if (body?.action === "remove" && body.productId) {
      await repository.removeFromWishlist(user.uid, body.productId);
    } else {
      return NextResponse.json({ message: "Missing or invalid action" }, { status: 400 });
    }

    const productIds = await repository.listWishlistProductIds(user.uid);
    return NextResponse.json({ productIds });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ message: "Sign in to save a wishlist" }, { status: 401 });
    }
    throw error;
  }
}
