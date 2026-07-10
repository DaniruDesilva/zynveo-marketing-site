import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { sendDualEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, toolName, reportTitle, summaryData } = body || {};

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

    // ── Save Email to Supabase WITHOUT Duplicates (Upsert / Ignore) ──
    // We insert into newsletter_subscribers with onConflict ignore so duplicate emails are never inserted twice.
    const { error: dbError } = await supabase
      .from("newsletter_subscribers")
      .upsert({ email: normalizedEmail }, { onConflict: "email", ignoreDuplicates: true });

    if (dbError) {
      console.warn("[Tool Report API] Supabase upsert notice:", dbError);
    }

    // Also attempt to save to tool_inquiries / tool_leads if table exists (ignore if table not found)
    try {
      await supabase
        .from("tool_leads")
        .upsert(
          { email: normalizedEmail, tool_name: toolName || "Calculator", created_at: new Date().toISOString() },
          { onConflict: "email,tool_name", ignoreDuplicates: true }
        );
    } catch (e) {
      // Ignore if tool_leads table does not exist
    }

    // ── Build Email Content ─────────────────────────────────────
    const rowsHtml = Array.isArray(summaryData)
      ? summaryData
          .map(
            (item: { label: string; value: string }) => `
            <tr>
              <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; color: #475569; font-weight: 600; font-size: 14px;">
                ${item.label}
              </td>
              <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; color: #0f172a; font-weight: 800; font-size: 14px; text-align: right; font-family: monospace;">
                ${item.value}
              </td>
            </tr>
          `
          )
          .join("")
      : "";

    const userHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${reportTitle || "Zynveo Tool Report"}</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
        <div style="max-width: 600px; margin: 30px auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05);">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #6d28d9, #4f46e5); padding: 30px 24px; text-align: center; color: #ffffff;">
            <h1 style="margin: 0; font-size: 24px; font-weight: 900; letter-spacing: -0.5px;">Zynveo Intelligence</h1>
            <p style="margin: 6px 0 0 0; font-size: 14px; opacity: 0.9; font-weight: 600;">${reportTitle || toolName || "Your Calculation Summary"}</p>
          </div>

          <!-- Body -->
          <div style="padding: 30px 24px;">
            <p style="margin: 0 0 18px 0; color: #334155; font-size: 15px; line-height: 1.6;">
              Hello,<br><br>
              Thank you for using the <strong>${toolName || "Zynveo Calculator"}</strong>. Here is your calculation breakdown:
            </p>

            <table style="width: 100%; border-collapse: collapse; background: #f8fafc; border-radius: 12px; overflow: hidden; border: 1px solid #cbd5e1; margin-bottom: 24px;">
              <thead>
                <tr style="background: #f1f5f9; border-bottom: 2px solid #cbd5e1;">
                  <th style="padding: 12px 14px; text-align: left; font-size: 12px; font-weight: 800; color: #475569; text-transform: uppercase; letter-spacing: 0.5px;">Metric</th>
                  <th style="padding: 12px 14px; text-align: right; font-size: 12px; font-weight: 800; color: #475569; text-transform: uppercase; letter-spacing: 0.5px;">Value</th>
                </tr>
              </thead>
              <tbody>
                ${rowsHtml}
              </tbody>
            </table>

            <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
              <h4 style="margin: 0 0 6px 0; color: #1e3a8a; font-size: 14px; font-weight: 800;">💡 Automate This with Zynveo Cloud ERP</h4>
              <p style="margin: 0; color: #1e40af; font-size: 13px; line-height: 1.5;">
                Did you know? Zynveo's full Cloud ERP & POS operating system connects directly to your supplier purchases, inventory costs, and daily cash registers to calculate real-time margins automatically.
              </p>
            </div>

            <div style="text-align: center;">
              <a href="https://zynveo.com/contact" style="display: inline-block; background: #6d28d9; color: #ffffff; padding: 14px 28px; border-radius: 12px; font-weight: 800; font-size: 15px; text-decoration: none; box-shadow: 0 4px 12px rgba(109, 40, 217, 0.3);">
                Explore Enterprise ERP & POS →
              </a>
            </div>
          </div>

          <!-- Footer -->
          <div style="background: #f1f5f9; padding: 20px 24px; text-align: center; border-top: 1px solid #e2e8f0; color: #64748b; font-size: 12px;">
            <p style="margin: 0; font-weight: 600;">© ${new Date().getFullYear()} Zynveo Technologies (Pvt) Ltd. All rights reserved.</p>
            <p style="margin: 4px 0 0 0;"><a href="https://zynveo.com" style="color: #6d28d9; text-decoration: none; font-weight: 700;">zynveo.com</a></p>
          </div>
        </div>
      </body>
      </html>
    `;

    const adminHtml = `
      <div style="font-family: sans-serif; padding: 20px; color: #1e293b;">
        <h2 style="color: #6d28d9;">📊 New Lead from ${toolName || "Calculator"}</h2>
        <p><strong>Email:</strong> ${normalizedEmail}</p>
        <p><strong>Tool Used:</strong> ${toolName || "N/A"}</p>
        <p><strong>Timestamp:</strong> ${new Date().toUTCString()}</p>
        <hr style="border: none; border-top: 1px solid #cbd5e1; margin: 16px 0;" />
        <h3>Summary Data:</h3>
        <ul>
          ${Array.isArray(summaryData) ? summaryData.map((item: any) => `<li><strong>${item.label}:</strong> ${item.value}</li>`).join("") : "No details provided"}
        </ul>
      </div>
    `;

    await sendDualEmail({
      userEmail: normalizedEmail,
      userSubject: `${reportTitle || toolName || "Your Calculation Summary"} — Zynveo`,
      userHtml,
      adminSubject: `📈 Tool Lead (${toolName || "Calculator"}): ${normalizedEmail}`,
      adminHtml,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[Tool Report API] Unexpected error:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
