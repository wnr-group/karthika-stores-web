import { NextResponse } from "next/server";

import { requireUser, UnauthorizedError } from "@/lib/auth/session";
import { addressSchema, fieldErrors } from "@/lib/checkout/schema";
import { getRepository } from "@/lib/data/repository";

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;

    const draft = addressSchema.safeParse(body);
    if (!draft.success) {
      return NextResponse.json(
        { message: "Please check the address for errors.", errors: fieldErrors(draft.error) },
        { status: 400 },
      );
    }

    const label = typeof body?.label === "string" ? body.label : "Home";
    const isDefault = Boolean(body?.isDefault);

    const repository = await getRepository();
    const address = await repository.createAddress(user.uid, {
      ...draft.data,
      addressLine2: draft.data.addressLine2 || null,
      label,
      isDefault,
    });

    return NextResponse.json({ address });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ message: "Sign in to manage addresses" }, { status: 401 });
    }
    throw error;
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await requireUser();
    const body = (await request.json().catch(() => null)) as
      | (Record<string, unknown> & { id?: string })
      | null;

    if (!body?.id) {
      return NextResponse.json({ message: "Missing address id" }, { status: 400 });
    }

    const draft = addressSchema.safeParse(body);
    if (!draft.success) {
      return NextResponse.json(
        { message: "Please check the address for errors.", errors: fieldErrors(draft.error) },
        { status: 400 },
      );
    }

    const repository = await getRepository();
    const address = await repository.updateAddress(user.uid, body.id, {
      ...draft.data,
      addressLine2: draft.data.addressLine2 || null,
      label: typeof body.label === "string" ? body.label : "Home",
      isDefault: Boolean(body.isDefault),
    });

    if (!address) {
      return NextResponse.json({ message: "Address not found" }, { status: 404 });
    }

    return NextResponse.json({ address });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ message: "Sign in to manage addresses" }, { status: 401 });
    }
    throw error;
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await requireUser();
    const id = new URL(request.url).searchParams.get("id");
    if (!id) return NextResponse.json({ message: "Missing address id" }, { status: 400 });

    const repository = await getRepository();
    await repository.deleteAddress(user.uid, id);

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ message: "Sign in to manage addresses" }, { status: 401 });
    }
    throw error;
  }
}
