/**
 * Shared HTML email template generator for Zynveo transactional emails.
 * Produces responsive, branded HTML emails.
 */

const BRAND_COLOR = "#4F2EE5";
const ACCENT_COLOR = "#F97316";

export function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function baseTemplate(body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:'Inter',system-ui,-apple-system,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 16px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
  <!-- Header -->
  <tr><td style="background:linear-gradient(135deg,${BRAND_COLOR},#4338ca);padding:32px 40px;text-align:center;">
    <h1 style="margin:0;font-size:28px;font-weight:900;color:#ffffff;letter-spacing:-0.5px;">Zynveo</h1>
    <p style="margin:4px 0 0;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:3px;color:rgba(255,255,255,0.7);">Cloud OS</p>
  </td></tr>
  <!-- Body -->
  <tr><td style="padding:40px;">
    ${body}
  </td></tr>
  <!-- Footer -->
  <tr><td style="background:#f1f5f9;padding:24px 40px;text-align:center;border-top:1px solid #e2e8f0;">
    <p style="margin:0;font-size:12px;color:#94a3b8;font-weight:500;">
      © 2026 Zynveo Technologies (Pvt) Ltd &bull; Galle, Sri Lanka<br/>
      <a href="https://zynveo.com" style="color:${BRAND_COLOR};text-decoration:none;font-weight:700;">zynveo.com</a> &bull;
      <a href="mailto:hello@zynveo.com" style="color:${BRAND_COLOR};text-decoration:none;">hello@zynveo.com</a>
    </p>
  </td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

// ─── Contact ────────────────────────────────────────────────────

export function contactUserEmail(name: string): string {
  const safeName = escapeHtml(name);
  return baseTemplate(`
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#0f172a;">Hi ${safeName}, we got your message! 👋</h2>
    <p style="margin:0 0 24px;font-size:15px;color:#64748b;line-height:1.7;">
      Thank you for reaching out to Zynveo. One of our enterprise solutions engineers will review your inquiry and respond within <strong style="color:#0f172a;">2 hours</strong> during business hours.
    </p>
    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:20px;margin-bottom:24px;">
      <p style="margin:0;font-size:13px;color:#64748b;">While you wait, explore our <strong>100% free utility suite</strong>:</p>
      <p style="margin:8px 0 0;">
        <a href="https://zynveo.com/mrp-calculator" style="color:${BRAND_COLOR};font-weight:700;font-size:13px;text-decoration:none;">MRP Calculator</a> &bull;
        <a href="https://zynveo.com/invoice-generator" style="color:${BRAND_COLOR};font-weight:700;font-size:13px;text-decoration:none;">Invoice Generator</a> &bull;
        <a href="https://zynveo.com/barcode-generator" style="color:${BRAND_COLOR};font-weight:700;font-size:13px;text-decoration:none;">Barcode Maker</a>
      </p>
    </div>
    <p style="margin:0;font-size:13px;color:#94a3b8;">This is an automated confirmation. Please do not reply to this email.</p>
  `);
}

export function contactAdminEmail(data: { name: string; email: string; phone: string; company: string; subject: string; message: string }): string {
  const safeName = escapeHtml(data.name);
  const safeEmail = escapeHtml(data.email);
  const safePhone = escapeHtml(data.phone);
  const safeCompany = data.company ? escapeHtml(data.company) : "—";
  const safeSubject = escapeHtml(data.subject);
  const safeMessage = escapeHtml(data.message);
  return baseTemplate(`
    <h2 style="margin:0 0 16px;font-size:22px;font-weight:800;color:#0f172a;">📩 New Contact Inquiry</h2>
    <table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;color:#334155;">
      <tr><td style="padding:10px 0;border-bottom:1px solid #f1f5f9;font-weight:700;width:140px;color:#64748b;">Name</td><td style="padding:10px 0;border-bottom:1px solid #f1f5f9;font-weight:600;">${safeName}</td></tr>
      <tr><td style="padding:10px 0;border-bottom:1px solid #f1f5f9;font-weight:700;color:#64748b;">Email</td><td style="padding:10px 0;border-bottom:1px solid #f1f5f9;"><a href="mailto:${safeEmail}" style="color:${BRAND_COLOR};font-weight:600;">${safeEmail}</a></td></tr>
      <tr><td style="padding:10px 0;border-bottom:1px solid #f1f5f9;font-weight:700;color:#64748b;">Phone</td><td style="padding:10px 0;border-bottom:1px solid #f1f5f9;font-weight:600;">${safePhone}</td></tr>
      <tr><td style="padding:10px 0;border-bottom:1px solid #f1f5f9;font-weight:700;color:#64748b;">Company</td><td style="padding:10px 0;border-bottom:1px solid #f1f5f9;font-weight:600;">${safeCompany}</td></tr>
      <tr><td style="padding:10px 0;border-bottom:1px solid #f1f5f9;font-weight:700;color:#64748b;">Subject</td><td style="padding:10px 0;border-bottom:1px solid #f1f5f9;font-weight:600;">${safeSubject}</td></tr>
    </table>
    <div style="margin-top:20px;padding:20px;background:#f8fafc;border-radius:12px;border:1px solid #e2e8f0;">
      <p style="margin:0 0 8px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#94a3b8;">Message</p>
      <p style="margin:0;font-size:14px;color:#334155;line-height:1.7;white-space:pre-wrap;">${safeMessage}</p>
    </div>
  `);
}

// ─── Wishlist ───────────────────────────────────────────────────

export function wishlistUserEmail(name: string): string {
  const safeName = escapeHtml(name);
  return baseTemplate(`
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#0f172a;">Welcome to the VIP Launch List, ${safeName}! 🎉</h2>
    <p style="margin:0 0 24px;font-size:15px;color:#64748b;line-height:1.7;">
      You're now on the exclusive Zynveo Cloud OS early-access waitlist. As a VIP member, you'll receive:
    </p>
    <div style="background:linear-gradient(135deg,${BRAND_COLOR}08,${ACCENT_COLOR}08);border:2px solid ${ACCENT_COLOR};border-radius:16px;padding:24px;text-align:center;margin-bottom:24px;">
      <p style="margin:0 0 4px;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:${ACCENT_COLOR};">Your Exclusive Discount</p>
      <p style="margin:0;font-size:48px;font-weight:900;color:${ACCENT_COLOR};line-height:1;">30% OFF</p>
      <p style="margin:8px 0 0;font-size:14px;color:#64748b;font-weight:600;">On all premium plans at launch</p>
    </div>
    <ul style="margin:0 0 24px;padding-left:20px;font-size:14px;color:#334155;line-height:2;">
      <li><strong>Early access</strong> to the Cloud OS beta</li>
      <li><strong>30% lifetime discount</strong> on premium tiers</li>
      <li><strong>Priority onboarding</strong> from our engineering team</li>
    </ul>
    <p style="margin:0;font-size:13px;color:#94a3b8;">We'll notify you the moment Zynveo launches. Stay tuned!</p>
  `);
}

export function wishlistAdminEmail(data: { name: string; email: string; phone: string }): string {
  const safeName = escapeHtml(data.name);
  const safeEmail = escapeHtml(data.email);
  const safePhone = escapeHtml(data.phone);
  return baseTemplate(`
    <h2 style="margin:0 0 16px;font-size:22px;font-weight:800;color:#0f172a;">New Waitlist Registration</h2>
    <table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;color:#334155;">
      <tr><td style="padding:10px 0;border-bottom:1px solid #f1f5f9;font-weight:700;width:120px;color:#64748b;">Name</td><td style="padding:10px 0;border-bottom:1px solid #f1f5f9;font-weight:600;">${safeName}</td></tr>
      <tr><td style="padding:10px 0;border-bottom:1px solid #f1f5f9;font-weight:700;color:#64748b;">Email</td><td style="padding:10px 0;border-bottom:1px solid #f1f5f9;"><a href="mailto:${safeEmail}" style="color:${BRAND_COLOR};font-weight:600;">${safeEmail}</a></td></tr>
      <tr><td style="padding:10px 0;border-bottom:1px solid #f1f5f9;font-weight:700;color:#64748b;">Phone</td><td style="padding:10px 0;border-bottom:1px solid #f1f5f9;font-weight:600;">${safePhone}</td></tr>
    </table>
  `);
}

// ─── Newsletter ─────────────────────────────────────────────────

export function newsletterUserEmail(): string {
  return baseTemplate(`
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#0f172a;">You're subscribed! 📬</h2>
    <p style="margin:0 0 24px;font-size:15px;color:#64748b;line-height:1.7;">
      Welcome to the Zynveo newsletter. You'll receive updates on:
    </p>
    <ul style="margin:0 0 24px;padding-left:20px;font-size:14px;color:#334155;line-height:2;">
      <li>New free utility tool launches</li>
      <li>Cloud OS ERP development milestones</li>
      <li>Retail math insights & industry tips</li>
      <li>Exclusive early-access invitations</li>
    </ul>
    <p style="margin:0;font-size:13px;color:#94a3b8;">You can unsubscribe at any time by replying to any newsletter email.</p>
  `);
}

export function newsletterAdminEmail(email: string): string {
  const safeEmail = escapeHtml(email);
  return baseTemplate(`
    <h2 style="margin:0 0 16px;font-size:22px;font-weight:800;color:#0f172a;">📰 New Newsletter Subscriber</h2>
    <p style="margin:0;font-size:15px;color:#334155;">
      <strong>Email:</strong> <a href="mailto:${safeEmail}" style="color:${BRAND_COLOR};font-weight:600;">${safeEmail}</a>
    </p>
  `);
}

// ─── Feedback ───────────────────────────────────────────────────

const typeLabels: Record<string, string> = {
  feedback: "💬 General Feedback",
  idea: "💡 Feature Idea",
  issue: "🐛 Bug / Issue Report",
  other: "📋 Other",
};

export function feedbackUserEmail(name: string): string {
  const safeName = name ? escapeHtml(name) : "";
  return baseTemplate(`
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#0f172a;">Thanks for your feedback${safeName ? `, ${safeName}` : ""}! 🙏</h2>
    <p style="margin:0 0 24px;font-size:15px;color:#64748b;line-height:1.7;">
      We've received your submission and our product team will carefully review it. Your input directly shapes the future of Zynveo Cloud OS.
    </p>
    <p style="margin:0;font-size:13px;color:#94a3b8;">If your feedback requires a response, one of our team members will reach out to you shortly.</p>
  `);
}

export function feedbackAdminEmail(data: { name: string; email: string; type: string; message: string }): string {
  const safeName = data.name ? escapeHtml(data.name) : "Anonymous";
  const safeEmail = escapeHtml(data.email);
  const safeType = escapeHtml(typeLabels[data.type] || data.type);
  const safeMessage = escapeHtml(data.message);
  return baseTemplate(`
    <h2 style="margin:0 0 16px;font-size:22px;font-weight:800;color:#0f172a;">${escapeHtml(typeLabels[data.type] || typeLabels.other)}</h2>
    <table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;color:#334155;">
      <tr><td style="padding:10px 0;border-bottom:1px solid #f1f5f9;font-weight:700;width:120px;color:#64748b;">Name</td><td style="padding:10px 0;border-bottom:1px solid #f1f5f9;font-weight:600;">${safeName}</td></tr>
      <tr><td style="padding:10px 0;border-bottom:1px solid #f1f5f9;font-weight:700;color:#64748b;">Email</td><td style="padding:10px 0;border-bottom:1px solid #f1f5f9;"><a href="mailto:${safeEmail}" style="color:${BRAND_COLOR};font-weight:600;">${safeEmail}</a></td></tr>
      <tr><td style="padding:10px 0;border-bottom:1px solid #f1f5f9;font-weight:700;color:#64748b;">Type</td><td style="padding:10px 0;border-bottom:1px solid #f1f5f9;font-weight:600;">${safeType}</td></tr>
    </table>
    <div style="margin-top:20px;padding:20px;background:#f8fafc;border-radius:12px;border:1px solid #e2e8f0;">
      <p style="margin:0 0 8px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#94a3b8;">Message</p>
      <p style="margin:0;font-size:14px;color:#334155;line-height:1.7;white-space:pre-wrap;">${safeMessage}</p>
    </div>
  `);
}
