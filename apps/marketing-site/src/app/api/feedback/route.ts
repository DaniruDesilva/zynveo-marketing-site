import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { sendDualEmail } from "@/lib/email";
import { feedbackUserEmail, feedbackAdminEmail } from "@/lib/email-templates";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, type, message } = body || {};
    // ── Normalization & Validation ──────────────────────────────
    const normalizedName = String(name || "").trim();
    const normalizedEmail = String(email || "").trim().toLowerCase();
    const normalizedMessage = String(message || "").trim();

    if (!normalizedEmail || !type || !normalizedMessage) {
      return NextResponse.json(
        { error: "Email, type, and message are required." },
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

    if (normalizedMessage.length < 5) {
      return NextResponse.json(
        { error: "Please provide a more detailed message (at least 5 characters)." },
        { status: 400 }
      );
    }

    const validTypes = ["feedback", "idea", "issue", "other"];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: "Invalid feedback type." },
        { status: 400 }
      );
    }

    // ── Insert into Supabase (Unlimited submissions allowed per email) ──
    const { error: dbError } = await supabase
      .from("feedback_submissions")
      .insert({
        name: normalizedName || null,
        email: normalizedEmail,
        type,
        message: normalizedMessage,
      });

    if (dbError) {
      console.error("[Feedback API] Supabase error:", dbError);
      return NextResponse.json(
        { error: "Failed to submit feedback. Please try again." },
        { status: 500 }
      );
    }

    // ── Send dual emails ────────────────────────────────────────
    await sendDualEmail({
      userEmail: normalizedEmail,
      userSubject: "Thanks for your feedback! 🙏 — Zynveo",
      userHtml: feedbackUserEmail(normalizedName || ""),
      adminSubject: `${type === "issue" ? "🐛" : type === "idea" ? "💡" : "💬"} New ${type} from ${normalizedName || normalizedEmail}`,
      adminHtml: feedbackAdminEmail({ name: normalizedName || "", email: normalizedEmail, type, message: normalizedMessage }),
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[Feedback API] Unexpected error:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
