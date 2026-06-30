import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { sendDualEmail } from "@/lib/email";
import { feedbackUserEmail, feedbackAdminEmail } from "@/lib/email-templates";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, type, message } = body;

    // ── Validation ──────────────────────────────────────────────
    if (!email || !type || !message) {
      return NextResponse.json(
        { error: "Email, type, and message are required." },
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

    // ── Insert into Supabase ────────────────────────────────────
    const { error: dbError } = await supabase
      .from("feedback_submissions")
      .insert({
        name: name || null,
        email,
        type,
        message,
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
      userEmail: email,
      userSubject: "Thanks for your feedback! 🙏 — Zynveo",
      userHtml: feedbackUserEmail(name || ""),
      adminSubject: `${type === "issue" ? "🐛" : type === "idea" ? "💡" : "💬"} New ${type} from ${name || email}`,
      adminHtml: feedbackAdminEmail({ name: name || "", email, type, message }),
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
