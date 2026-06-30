import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { sendDualEmail } from "@/lib/email";
import { newsletterUserEmail, newsletterAdminEmail } from "@/lib/email-templates";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = body;

    // ── Validation ──────────────────────────────────────────────
    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: "A valid email address is required." },
        { status: 400 }
      );
    }

    // ── Insert into Supabase (handle duplicate subscriptions cleanly) ──
    const { error: dbError } = await supabase
      .from("newsletter_subscribers")
      .insert({ email });

    // Ignore duplicate key error (23505 means email is already subscribed)
    if (dbError && dbError.code !== "23505") {
      console.error("[Newsletter API] Supabase error:", dbError);
      return NextResponse.json(
        { error: "Failed to subscribe. Please try again." },
        { status: 500 }
      );
    }

    // ── Send dual emails ────────────────────────────────────────
    await sendDualEmail({
      userEmail: email,
      userSubject: "Welcome to Zynveo Updates! 📬",
      userHtml: newsletterUserEmail(),
      adminSubject: `📰 New Newsletter Subscriber: ${email}`,
      adminHtml: newsletterAdminEmail(email),
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
