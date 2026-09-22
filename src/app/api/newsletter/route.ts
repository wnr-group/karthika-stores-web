import { NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({ email: z.string().trim().toLowerCase().email() });

/**
 * The letter sign-up. There is no subscriber list in this database yet, so
 * this validates the address and returns success; wiring it to a real list
 * is a one-line change here once there is somewhere to send it.
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ message: "Enter a valid email address" }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
