import { Resend } from "resend";
import nodemailer from "nodemailer";

// ─── Primary: Resend ────────────────────────────────────────────
const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

// ─── Fallback: Nodemailer SMTP ──────────────────────────────────
function getNodemailerTransport() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) return null;

  return nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: { user, pass },
  });
}

// ─── Unified email sender ───────────────────────────────────────
export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

/**
 * Send an email via Resend (primary). If Resend fails due to rate
 * limiting or is unconfigured, automatically fall back to Nodemailer SMTP.
 */
export async function sendEmail(payload: EmailPayload): Promise<{ success: boolean; provider: string; error?: string }> {
  // Uses verified custom domain sender address (e.g. hello@zynveo.com)
  const fromAddr = payload.from || process.env.RESEND_FROM || "Zynveo <hello@zynveo.com>";

  // ── Try Resend first ──────────────────────────────────────────
  if (resend) {
    try {
      const { error } = await resend.emails.send({
        from: fromAddr,
        to: payload.to,
        subject: payload.subject,
        html: payload.html,
      });

      if (error) {
        // If rate limited (429) or domain error, fall through to Nodemailer
        const errMsg = typeof error === "object" && "message" in error ? (error as { message: string }).message : String(error);
        console.warn("[Email] Resend delivery notice:", errMsg);
        if (!errMsg.toLowerCase().includes("rate") && !errMsg.toLowerCase().includes("limit") && !errMsg.toLowerCase().includes("quota") && !errMsg.toLowerCase().includes("verify")) {
          console.error("[Email] Resend error details:", errMsg);
        }
      } else {
        return { success: true, provider: "resend" };
      }
    } catch (err) {
      console.error("[Email] Resend exception:", err);
    }
  }

  // ── Fallback: Nodemailer SMTP ─────────────────────────────────
  const transport = getNodemailerTransport();
  if (transport) {
    try {
      await transport.sendMail({
        from: process.env.SMTP_FROM || "hello@zynveo.com",
        to: payload.to,
        subject: payload.subject,
        html: payload.html,
      });
      return { success: true, provider: "nodemailer" };
    } catch (err) {
      console.error("[Email] Nodemailer error:", err);
      return { success: false, provider: "nodemailer", error: String(err) };
    }
  }

  // ── Both unavailable ─────────────────────────────────────────
  console.error("[Email] No email provider available (Resend + SMTP both failed or unconfigured)");
  return { success: false, provider: "none", error: "No email provider configured" };
}

/**
 * Send dual emails: one to the user (confirmation) and one to the business (notification).
 * Awaited during form processing to ensure completion in serverless environments.
 */
export async function sendDualEmail(opts: {
  userEmail: string;
  userSubject: string;
  userHtml: string;
  adminSubject: string;
  adminHtml: string;
}) {
  const configuredAdmin = process.env.ADMIN_EMAIL;
  const adminEmail = (!configuredAdmin || configuredAdmin === "hello@zynveo.com")
    ? (process.env.SMTP_USER || "daniru.desilva1019@gmail.com")
    : configuredAdmin;

  const results = await Promise.allSettled([
    sendEmail({ to: opts.userEmail, subject: opts.userSubject, html: opts.userHtml }),
    sendEmail({ to: adminEmail, subject: opts.adminSubject, html: opts.adminHtml }),
  ]);

  return {
    userEmail: results[0].status === "fulfilled" ? results[0].value : { success: false, provider: "error" },
    adminEmail: results[1].status === "fulfilled" ? results[1].value : { success: false, provider: "error" },
  };
}
