import { NextRequest, NextResponse } from "next/server";
import { supabase, runSupabaseSafe } from "@/lib/supabase";
import { sendDualEmail } from "@/lib/email";
import { contactUserEmail, contactAdminEmail } from "@/lib/email-templates";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { fullName, email, phone, company, subject, message } = body || {};
    // ── Normalization & Validation ──────────────────────────────
    const normalizedName = String(fullName || "").trim();
    const normalizedEmail = String(email || "").trim().toLowerCase();
    const normalizedPhone = String(phone || "").trim();
    const normalizedCompany = String(company || "").trim();
    const normalizedSubject = String(subject || "").trim();
    const normalizedMessage = String(message || "").trim();

    if (!normalizedName || !normalizedEmail || !normalizedPhone || !normalizedSubject || !normalizedMessage) {
      return NextResponse.json(
        { error: "All required fields must be provided." },
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

    if (normalizedMessage.length < 5) {
      return NextResponse.json(
        { error: "Please provide a more detailed message (at least 5 characters)." },
        { status: 400 }
      );
    }

    // ── Insert into Supabase with resilience ────────────────────
    const { error: dbError, isNetworkError } = await runSupabaseSafe(
      supabase.from("contact_inquiries").insert({
        full_name: normalizedName,
        email: normalizedEmail,
        phone: normalizedPhone,
        company: normalizedCompany || null,
        subject: normalizedSubject,
        message: normalizedMessage,
      }),
      { timeoutMs: 1800, context: "Contact API" }
    );

    if (dbError && !isNetworkError) {
      console.error("[Contact API] Supabase error:", dbError);
      return NextResponse.json(
        { error: "Failed to save your inquiry. Please try again." },
        { status: 500 }
      );
    }

    // ── Send dual emails ────────────────────────────────────────
    await sendDualEmail({
      userEmail: normalizedEmail,
      userSubject: `We received your inquiry, ${normalizedName}! — Zynveo`,
      userHtml: contactUserEmail(normalizedName),
      adminSubject: `📩 New Contact Inquiry from ${normalizedName}`,
      adminHtml: contactAdminEmail({ name: normalizedName, email: normalizedEmail, phone: normalizedPhone, company: normalizedCompany, subject: normalizedSubject, message: normalizedMessage }),
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
