import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { authOptions } from "./auth";

/** Returns a 401 response if the caller is not a signed-in admin, otherwise null. */
export async function guard() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return null;
}

export const bad = (message: string, status = 400) =>
  NextResponse.json({ error: message }, { status });

export function revalidateSite() {
  revalidateTag("site");
  revalidatePath("/", "layout");
}

export async function readJson(req: Request): Promise<Record<string, unknown> | null> {
  try {
    const body = await req.json();
    return body && typeof body === "object" ? (body as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}
