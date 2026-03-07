import { db } from "@/db";
import { signups } from "@/db/schema";
import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, name, fromCity, toCity, nationality, interests, message } = body;

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json({ error: "Valid email required" }, { status: 400 });
    }

    // Upsert — if email exists, update their info
    const existing = await db
      .select()
      .from(signups)
      .where(eq(signups.email, email.toLowerCase().trim()))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json({ ok: true, message: "already_signed_up" });
    }

    await db.insert(signups).values({
      email: email.toLowerCase().trim(),
      name: name || null,
      fromCity: fromCity || null,
      toCity: toCity || null,
      nationality: nationality || null,
      interests: interests || [],
      message: message || null,
    });

    return NextResponse.json({ ok: true, message: "signed_up" });
  } catch (err) {
    console.error("Signup error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
