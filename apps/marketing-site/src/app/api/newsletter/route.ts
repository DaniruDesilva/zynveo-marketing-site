import { NextRequest, NextResponse } from "next/server";
import { supabase, runSupabaseSafe } from "@/lib/supabase";
import { sendDualEmail } from "@/lib/email";
import { newsletterUserEmail, newsletterAdminEmail } from "@/lib/email-templates";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = body || {};
    // ── Normalization & Validation ──────────────────────────────
    const normalizedEmail = String(email || "").trim().toLowerCase();

    if (!normalizedEmail) {
      return NextResponse.json(
        { error: "An email address is required." },
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

    // ── Insert into Supabase with resilience ────────────────────
    const { error: dbError, isUniqueViolation, isNetworkError } = await runSupabaseSafe(
      supabase.from("newsletter_subscribers").insert({ email: normalizedEmail }),
      { timeoutMs: 1800, context: "Newsletter API" }
    );

    if (isUniqueViolation) {
      return NextResponse.json(
        { error: "This email address is already subscribed to our newsletter!" },
        { status: 400 }
      );
    }

    if (dbError && !isNetworkError) {
      console.error("[Newsletter API] Supabase error:", dbError);
      return NextResponse.json(
        { error: "Failed to subscribe. Please try again." },
        { status: 500 }
      );
    }

    // ── Send dual emails only for new subscriptions ─────────────
    await sendDualEmail({
      userEmail: normalizedEmail,
      userSubject: "Welcome to Zynveo Updates! 📬",
      userHtml: newsletterUserEmail(),
      adminSubject: `📰 New Newsletter Subscriber: ${normalizedEmail}`,
      adminHtml: newsletterAdminEmail(normalizedEmail),
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[Newsletter API] Unexpected error:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
