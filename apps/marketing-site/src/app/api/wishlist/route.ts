import { NextRequest, NextResponse } from "next/server";
import { supabase, runSupabaseSafe } from "@/lib/supabase";
import { sendDualEmail } from "@/lib/email";
import { wishlistUserEmail, wishlistAdminEmail } from "@/lib/email-templates";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { fullName, email, phone } = body || {};
    // ── Normalization & Validation ──────────────────────────────
    const normalizedName = String(fullName || "").trim();
    const normalizedEmail = String(email || "").trim().toLowerCase();
    const normalizedPhone = String(phone || "").trim();

    if (!normalizedName || !normalizedEmail || !normalizedPhone) {
      return NextResponse.json(
        { error: "Name, email, and phone number are required." },
        { status: 400 }
      );
    }

    const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!EMAIL_REGEX.test(normalizedEmail)) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    if (normalizedName.length < 2) {
      return NextResponse.json(
        { error: "Please enter your full name (at least 2 characters)." },
        { status: 400 }
      );
    }

    // ── Insert into Supabase with resilience ────────────────────
    const { error: dbError, isUniqueViolation, isNetworkError } = await runSupabaseSafe(
      supabase.from("wishlist_signups").insert({ full_name: normalizedName, email: normalizedEmail, phone: normalizedPhone }),
      { timeoutMs: 1800, context: "Wishlist API" }
    );

    if (isUniqueViolation) {
      return NextResponse.json(
        { error: "This email address is already registered on the VIP wishlist!" },
        { status: 400 }
      );
    }

    if (dbError && !isNetworkError) {
      console.error("[Wishlist API] Supabase error:", dbError);
      return NextResponse.json(
        { error: "Failed to join the waitlist. Please try again." },
        { status: 500 }
      );
    }

    // ── Send dual emails only for new registrations ─────────────
    await sendDualEmail({
      userEmail: normalizedEmail,
      userSubject: `You're on the VIP Launch List, ${normalizedName}! 🎉 — Zynveo`,
      userHtml: wishlistUserEmail(normalizedName),
      adminSubject: `New Waitlist Registration: ${normalizedName} (${normalizedEmail})`,
      adminHtml: wishlistAdminEmail({ name: normalizedName, email: normalizedEmail, phone: normalizedPhone }),
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
