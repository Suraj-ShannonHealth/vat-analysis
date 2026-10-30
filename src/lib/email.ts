import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import type SMTPTransport from "nodemailer/lib/smtp-transport";

/**
 * VAT Approval Form — centralized email service (nodemailer).
 *
 * Env:
 *   EMAIL_ENABLED                 - "true" to send (default: false)
 *   SMTP_HOST                     - relay hostname
 *   SMTP_PORT                     - default 25
 *   SMTP_FROM                     - from address
 *   SMTP_SECURE                   - "true" for port 465 implicit TLS
 *   SMTP_REQUIRE_TLS              - "true" for STARTTLS
 *   SMTP_TLS_REJECT_UNAUTHORIZED  - "false" to allow self-signed (default true)
 *   SMTP_USER / SMTP_PASS         - optional authenticated relay
 *   ADMIN_NOTIFY_EMAIL            - comma-separated admin recipients for new submissions
 *   APP_BASE_URL                  - e.g. http://172.16.11.138:3010 (links in email)
 */

interface EmailConfig {
  enabled: boolean;
  host: string;
  port: number;
  from: string;
  secure: boolean;
  requireTls: boolean;
  tlsRejectUnauthorized: boolean;
  user?: string;
  pass?: string;
  notifyTo: string[];
  appBaseUrl: string;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface NewSubmissionNotifyData {
  submissionId: string;
  requestNumber?: string | null;
  productServiceName: string;
  typeOfRequest: string;
  requestedByNameTitle: string;
  requesterEmail: string;
  requesterPhone?: string | null;
  requestingDepartment: string;
  vendorManufacturer?: string | null;
  catalogNumber?: string | null;
}

class EmailService {
  private transporter: Transporter<SMTPTransport.SentMessageInfo> | null = null;
  private config: EmailConfig;

  constructor() {
    this.config = this.loadConfig();
    this.setupTransporter();
  }

  private loadConfig(): EmailConfig {
    const notifyRaw = process.env.ADMIN_NOTIFY_EMAIL || "";
    return {
      enabled: process.env.EMAIL_ENABLED?.toLowerCase() === "true",
      host: process.env.SMTP_HOST || "",
      port: parseInt(process.env.SMTP_PORT || "25", 10),
      from: process.env.SMTP_FROM || "automation-hub@shannonhealth.org",
      secure: process.env.SMTP_SECURE?.toLowerCase() === "true",
      requireTls: process.env.SMTP_REQUIRE_TLS?.toLowerCase() === "true",
      tlsRejectUnauthorized:
        process.env.SMTP_TLS_REJECT_UNAUTHORIZED?.toLowerCase() !== "false",
      user: process.env.SMTP_USER || undefined,
      pass: process.env.SMTP_PASS || undefined,
      notifyTo: notifyRaw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      appBaseUrl: (
        process.env.APP_BASE_URL || "http://172.16.11.138:3010"
      ).replace(/\/$/, ""),
    };
  }

  private setupTransporter(): void {
    if (!this.config.enabled) {
      console.info("[EmailService] Disabled (EMAIL_ENABLED != true)");
      return;
    }
    if (!this.config.host) {
      console.warn("[EmailService] SMTP_HOST not set — email disabled");
      return;
    }

    const options: SMTPTransport.Options = {
      host: this.config.host,
      port: this.config.port,
      secure: this.config.secure,
      requireTLS: this.config.requireTls,
      tls: { rejectUnauthorized: this.config.tlsRejectUnauthorized },
    };

    if (this.config.user && this.config.pass) {
      options.auth = { user: this.config.user, pass: this.config.pass };
    }

    this.transporter = nodemailer.createTransport(options);
    console.info("[EmailService] SMTP ready", {
      host: this.config.host,
      port: this.config.port,
      from: this.config.from,
      authenticated: !!(this.config.user && this.config.pass),
      notifyCount: this.config.notifyTo.length,
    });
  }

  isEnabled(): boolean {
    return this.config.enabled && this.transporter !== null;
  }

  getConfigStatus(): Record<string, unknown> {
    return {
      enabled: this.config.enabled,
      configured: this.transporter !== null,
      host: this.config.host || "(not set)",
      port: this.config.port,
      from: this.config.from,
      notifyTo: this.config.notifyTo,
      appBaseUrl: this.config.appBaseUrl,
      authenticated: !!(this.config.user && this.config.pass),
    };
  }

  async sendEmail(options: {
    to: string | string[];
    subject: string;
    html: string;
    text?: string;
  }): Promise<EmailResult> {
    if (!this.isEnabled()) {
      console.info("[EmailService] Skipped (disabled)", {
        to: options.to,
        subject: options.subject,
      });
      return { success: false, error: "Email delivery is disabled" };
    }

    try {
      const result = await this.transporter!.sendMail({
        from: this.config.from,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      });
      console.info("[EmailService] Sent", {
        messageId: result.messageId,
        to: options.to,
        subject: options.subject,
      });
      return { success: true, messageId: result.messageId };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error("[EmailService] Send failed", {
        error: errorMessage,
        to: options.to,
        subject: options.subject,
      });
      return { success: false, error: errorMessage };
    }
  }

  /** Notify admin(s) that a new VAT product request was submitted. Non-blocking errors. */
  async notifyAdminNewSubmission(data: NewSubmissionNotifyData): Promise<EmailResult> {
    if (this.config.notifyTo.length === 0) {
      console.warn(
        "[EmailService] ADMIN_NOTIFY_EMAIL not set — skipping new-submission notice"
      );
      return { success: false, error: "ADMIN_NOTIFY_EMAIL not configured" };
    }

    const detailUrl = `${this.config.appBaseUrl}/admin/submissions/${data.submissionId}`;
    const subject = `New VAT request: ${data.productServiceName}`;
    const text = [
      "A new VAT product request was submitted.",
      "",
      data.requestNumber ? `Request #: ${data.requestNumber}` : null,
      `Product: ${data.productServiceName}`,
      `Type: ${data.typeOfRequest}`,
      `Submitted by: ${data.requestedByNameTitle}`,
      `Email: ${data.requesterEmail}`,
      data.requesterPhone ? `Phone: ${data.requesterPhone}` : null,
      `Department: ${data.requestingDepartment}`,
      data.vendorManufacturer ? `Vendor: ${data.vendorManufacturer}` : null,
      data.catalogNumber ? `Catalog #: ${data.catalogNumber}` : null,
      "",
      `Open in admin: ${detailUrl}`,
    ]
      .filter(Boolean)
      .join("\n");

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>New VAT Request</title></head>
<body style="margin:0;padding:0;background:#f7faf9;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;color:#141414;">
  <div style="max-width:600px;margin:24px auto;background:#ffffff;border-radius:8px;overflow:hidden;border:1px solid #d0ddd6;">
    <div style="background:#0B6E4F;color:#ffffff;padding:20px 24px;">
      <p style="margin:0;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;opacity:0.9;">VAT Approval System</p>
      <h1 style="margin:6px 0 0;font-size:22px;font-weight:700;">New product request</h1>
    </div>
    <div style="padding:24px;">
      <p style="margin:0 0 16px;font-size:15px;line-height:1.5;">
        A new request was submitted and is waiting for review.
      </p>
      <table style="width:100%;border-collapse:collapse;font-size:15px;line-height:1.45;">
        ${
          data.requestNumber
            ? `<tr><td style="padding:8px 0;font-weight:700;width:140px;vertical-align:top;">Request #</td><td style="padding:8px 0;">${escapeHtml(data.requestNumber)}</td></tr>`
            : ""
        }
        <tr>
          <td style="padding:8px 0;font-weight:700;width:140px;vertical-align:top;">Product</td>
          <td style="padding:8px 0;">${escapeHtml(data.productServiceName)}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;font-weight:700;vertical-align:top;">Type</td>
          <td style="padding:8px 0;">${escapeHtml(data.typeOfRequest)}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;font-weight:700;vertical-align:top;">Submitted by</td>
          <td style="padding:8px 0;">${escapeHtml(data.requestedByNameTitle)}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;font-weight:700;vertical-align:top;">Email</td>
          <td style="padding:8px 0;"><a href="mailto:${escapeHtml(data.requesterEmail)}" style="color:#0B6E4F;">${escapeHtml(data.requesterEmail)}</a></td>
        </tr>
        ${
          data.requesterPhone
            ? `<tr><td style="padding:8px 0;font-weight:700;vertical-align:top;">Phone</td><td style="padding:8px 0;">${escapeHtml(data.requesterPhone)}</td></tr>`
            : ""
        }
        <tr>
          <td style="padding:8px 0;font-weight:700;vertical-align:top;">Department</td>
          <td style="padding:8px 0;">${escapeHtml(data.requestingDepartment)}</td>
        </tr>
        ${
          data.vendorManufacturer
            ? `<tr><td style="padding:8px 0;font-weight:700;vertical-align:top;">Vendor</td><td style="padding:8px 0;">${escapeHtml(data.vendorManufacturer)}</td></tr>`
            : ""
        }
        ${
          data.catalogNumber
            ? `<tr><td style="padding:8px 0;font-weight:700;vertical-align:top;">Catalog #</td><td style="padding:8px 0;">${escapeHtml(data.catalogNumber)}</td></tr>`
            : ""
        }
      </table>
      <p style="margin:28px 0 0;">
        <a href="${escapeHtml(detailUrl)}"
           style="display:inline-block;background:#0B6E4F;color:#ffffff;text-decoration:none;padding:12px 18px;border-radius:6px;font-weight:700;font-size:15px;">
          Open request in admin
        </a>
      </p>
    </div>
    <div style="padding:16px 24px;background:#f0f5f2;font-size:13px;color:#333;">
      Shannon Health VAT Approval System · Automated notification · Do not reply
    </div>
  </div>
</body>
</html>`;

    return this.sendEmail({
      to: this.config.notifyTo,
      subject,
      html,
      text,
    });
  }

  async testConnection(): Promise<{ success: boolean; error?: string }> {
    if (!this.config.enabled) {
      return { success: false, error: "EMAIL_ENABLED is not true" };
    }
    if (!this.transporter) {
      return { success: false, error: "SMTP transporter not configured" };
    }
    try {
      await this.transporter.verify();
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Singleton — safe to import from API routes */
export const emailService = new EmailService();
