/**
 * Lightweight SMTP email sender using Node.js built-in `node:tls` + `node:net`.
 * Implements STARTTLS + AUTH LOGIN for Gmail (smtp.gmail.com:587).
 * No external dependencies required.
 */

import * as net from "node:net";
import * as tls from "node:tls";
import type { CFP } from "./types";

const SMTP_HOST = process.env.SMTP_HOST ?? "smtp.gmail.com";
const SMTP_PORT = parseInt(process.env.SMTP_PORT ?? "587", 10);
const SMTP_USER = process.env.SMTP_USER ?? "";
const SMTP_PASSWORD = process.env.SMTP_PASSWORD ?? "";
const SMTP_FROM = process.env.SMTP_FROM ?? SMTP_USER;

// ─── SMTP protocol helper ─────────────────────────────────────────────────────

function b64(s: string) {
  return Buffer.from(s).toString("base64");
}

function waitFor(
  socket: net.Socket | tls.TLSSocket,
  code: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    let buf = "";
    const onData = (d: Buffer) => {
      buf += d.toString();
      if (buf.includes(`\n`)) {
        if (buf.startsWith(code)) {
          socket.off("data", onData);
          socket.off("error", onErr);
          resolve(buf.trim());
        } else {
          socket.off("data", onData);
          socket.off("error", onErr);
          reject(new Error(`SMTP unexpected response: ${buf.trim()}`));
        }
      }
    };
    const onErr = (e: Error) => {
      socket.off("data", onData);
      reject(e);
    };
    socket.on("data", onData);
    socket.once("error", onErr);
  });
}

function send(socket: net.Socket | tls.TLSSocket, cmd: string): void {
  socket.write(cmd + "\r\n");
}

// ─── Core send function ───────────────────────────────────────────────────────

export async function sendMail(opts: {
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<void> {
  if (!SMTP_USER || !SMTP_PASSWORD) {
    console.warn("[email] SMTP credentials not configured — skipping send.");
    return;
  }

  return new Promise((resolve, reject) => {
    const plain: net.Socket = net.createConnection(SMTP_PORT, SMTP_HOST);

    plain.once("error", reject);

    plain.once("connect", async () => {
      try {
        await waitFor(plain, "220");

        // EHLO to negotiate capabilities
        send(plain, `EHLO cfp-tracker`);
        await waitFor(plain, "250");

        // Upgrade to TLS via STARTTLS
        send(plain, "STARTTLS");
        await waitFor(plain, "220");

        // Wrap the plain socket in TLS
        const secured: tls.TLSSocket = tls.connect({
          socket: plain,
          host: SMTP_HOST,
          rejectUnauthorized: false,
        });

        await new Promise<void>((res, rej) => {
          secured.once("secureConnect", res);
          secured.once("error", rej);
        });

        // Re-EHLO over TLS
        send(secured, `EHLO cfp-tracker`);
        await waitFor(secured, "250");

        // AUTH LOGIN
        send(secured, "AUTH LOGIN");
        await waitFor(secured, "334");
        send(secured, b64(SMTP_USER));
        await waitFor(secured, "334");
        send(secured, b64(SMTP_PASSWORD));
        await waitFor(secured, "235");

        // Envelope
        send(secured, `MAIL FROM:<${SMTP_FROM}>`);
        await waitFor(secured, "250");
        send(secured, `RCPT TO:<${opts.to}>`);
        await waitFor(secured, "250");
        send(secured, "DATA");
        await waitFor(secured, "354");

        // Message headers + body
        const boundary = `--cfp${Date.now()}`;
        const msg = [
          `From: CFP Tracker <${SMTP_FROM}>`,
          `To: ${opts.to}`,
          `Subject: ${opts.subject}`,
          `MIME-Version: 1.0`,
          `Content-Type: multipart/alternative; boundary="${boundary}"`,
          ``,
          `--${boundary}`,
          `Content-Type: text/plain; charset=UTF-8`,
          ``,
          opts.text,
          ``,
          `--${boundary}`,
          `Content-Type: text/html; charset=UTF-8`,
          ``,
          opts.html,
          ``,
          `--${boundary}--`,
          `.`,
        ].join("\r\n");

        send(secured, msg);
        await waitFor(secured, "250");

        send(secured, "QUIT");
        secured.destroy();
        plain.destroy();
        resolve();
      } catch (err) {
        plain.destroy();
        reject(err);
      }
    });
  });
}

// ─── Deadline reminder email ──────────────────────────────────────────────────

export async function sendDeadlineReminderEmail(
  to: string,
  cfp: CFP,
  daysLeft: number
): Promise<void> {
  const label =
    daysLeft === 0
      ? "today"
      : daysLeft === 1
      ? "tomorrow"
      : `in ${daysLeft} days`;

  const deadline = new Date(cfp.deadline).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const cfpUrl = cfp.url ?? `${process.env.NEXT_PUBLIC_APP_URL}/cfp/${cfp.id}`;

  const subject = `⏰ CFP Reminder: "${cfp.title}" deadline is ${label}`;

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f8fafc; margin: 0; padding: 32px;">
  <div style="max-width: 560px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
    <div style="background: linear-gradient(135deg, #3b82f6, #60a5fa); padding: 32px 32px 24px;">
      <h1 style="margin: 0; color: white; font-size: 22px; font-weight: 700;">⏰ CFP Deadline Reminder</h1>
      <p style="margin: 8px 0 0; color: rgba(255,255,255,0.85); font-size: 15px;">
        The deadline for <strong>${cfp.title}</strong> is <strong>${label}</strong>.
      </p>
    </div>
    <div style="padding: 28px 32px;">
      <h2 style="margin: 0 0 4px; font-size: 18px; color: #1e293b;">${cfp.title}</h2>
      <p style="margin: 0 0 20px; color: #64748b; font-size: 14px;">${cfp.conference_name}</p>

      <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
        <tr>
          <td style="padding: 8px 0; color: #94a3b8; font-size: 13px; width: 40%;">📅 Deadline</td>
          <td style="padding: 8px 0; color: #1e293b; font-size: 13px; font-weight: 500;">${deadline}</td>
        </tr>
        ${cfp.location ? `<tr><td style="padding: 8px 0; color: #94a3b8; font-size: 13px;">📍 Location</td><td style="padding: 8px 0; color: #1e293b; font-size: 13px;">${cfp.location}</td></tr>` : ""}
        <tr>
          <td style="padding: 8px 0; color: #94a3b8; font-size: 13px;">🏷️ Category</td>
          <td style="padding: 8px 0; color: #1e293b; font-size: 13px;">${cfp.category}</td>
        </tr>
      </table>

      ${cfp.description ? `<p style="color: #475569; font-size: 14px; line-height: 1.6; margin-bottom: 24px;">${cfp.description}</p>` : ""}

      <a href="${cfpUrl}" style="display: inline-block; background: #3b82f6; color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 14px;">
        🚀 View &amp; Submit CFP →
      </a>
    </div>
    <div style="background: #f8fafc; padding: 16px 32px; border-top: 1px solid #e2e8f0;">
      <p style="margin: 0; color: #94a3b8; font-size: 12px;">
        You're receiving this because you subscribed to deadline reminders on CFP Tracker.
        <br>To manage your notifications, visit the CFP page and click the Subscribe button.
      </p>
    </div>
  </div>
</body>
</html>`;

  const text = `CFP Deadline Reminder

"${cfp.title}" (${cfp.conference_name}) deadline is ${label}.

Deadline: ${deadline}
${cfp.location ? `Location: ${cfp.location}\n` : ""}Category: ${cfp.category}
${cfp.description ? `\n${cfp.description}\n` : ""}
View and submit: ${cfpUrl}

---
You're receiving this because you subscribed to deadline reminders on CFP Tracker.`;

  await sendMail({ to, subject, html, text });
}
