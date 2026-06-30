import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { sendDualEmail } from "@/lib/email";
import { wishlistUserEmail, wishlistAdminEmail } from "@/lib/email-templates";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { fullName, email, phone } = body;

    // ── Validation ──────────────────────────────────────────────
    if (!fullName || !email || !phone) {
      return NextResponse.json(
        { error: "Name, email, and phone number are required." },
        { status: 400 }
      );
    }

    // ── Insert into Supabase (handle duplicate re-signups cleanly) ──
    const { error: dbError } = await supabase
      .from("wishlist_signups")
      .insert({ full_name: fullName, email, phone });

    // Ignore duplicate key error (23505 means email is already registered)
    if (dbError && dbError.code !== "23505") {
      console.error("[Wishlist API] Supabase error:", dbError);
      return NextResponse.json(
        { error: "Failed to join the waitlist. Please try again." },
        { status: 500 }
      );
    }

    // ── Send dual emails ────────────────────────────────────────
    await sendDualEmail({
      userEmail: email,
      userSubject: `You're on the VIP Launch List, ${fullName}! 🎉 — Zynveo`,
      userHtml: wishlistUserEmail(fullName),
      adminSubject: `New Waitlist Registration: ${fullName} (${email})`,
      adminHtml: wishlistAdminEmail({ name: fullName, email, phone }),
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[Wishlist API] Unexpected error:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
