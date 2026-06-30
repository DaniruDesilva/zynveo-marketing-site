import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { sendDualEmail } from "@/lib/email";
import { contactUserEmail, contactAdminEmail } from "@/lib/email-templates";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { fullName, email, phone, company, subject, message } = body;

    // ── Validation ──────────────────────────────────────────────
    if (!fullName || !email || !phone || !subject || !message) {
      return NextResponse.json(
        { error: "All required fields must be provided." },
        { status: 400 }
      );
    }

    // ── Insert into Supabase ────────────────────────────────────
    const { error: dbError } = await supabase
      .from("contact_inquiries")
      .insert({
        full_name: fullName,
        email,
        phone,
        company: company || null,
        subject,
        message,
      });

    if (dbError) {
      console.error("[Contact API] Supabase error:", dbError);
      return NextResponse.json(
        { error: "Failed to save your inquiry. Please try again." },
        { status: 500 }
      );
    }

    // ── Send dual emails ────────────────────────────────────────
    await sendDualEmail({
      userEmail: email,
      userSubject: `We received your inquiry, ${fullName}! — Zynveo`,
      userHtml: contactUserEmail(fullName),
      adminSubject: `📩 New Contact Inquiry from ${fullName}`,
      adminHtml: contactAdminEmail({ name: fullName, email, phone, company, subject, message }),
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[Contact API] Unexpected error:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
