import nodemailer from "nodemailer";

function getTransporter() {
  const smtpHost = process.env.SMTP_HOST;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  if (smtpHost && smtpUser && smtpPass) {
    return nodemailer.createTransport({
      host: smtpHost,
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: process.env.SMTP_SECURE === "true",
      auth: { user: smtpUser, pass: smtpPass },
    });
  }

  return null;
}

export interface BookingEmailData {
  bookingId: number;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  rentalName: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  guestCount: number;
  nightlyTotal: number;
  cleaningFee: number;
  taxAmount: number;
  totalPrice: number;
  specialRequests?: string | null;
  paymentMode: string;
  status: string;
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}

function formatDate(d: string) {
  return new Date(d + "T12:00:00Z").toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });
}

function paymentLabel(mode: string) {
  if (mode === "deposit") return "Deposit Paid (balance due at check-in)";
  if (mode === "request") return "Request Only – Awaiting Owner Confirmation";
  return "Paid in Full";
}

export async function sendGuestConfirmationEmail(data: BookingEmailData): Promise<void> {
  const transporter = getTransporter();
  if (!transporter) {
    console.log("[email] No SMTP configured – skipping guest confirmation email");
    return;
  }

  const fromEmail = process.env.FROM_EMAIL ?? "noreply@walkercreekfarms.com";
  const subject =
    data.status === "pending"
      ? `Your Booking Request – ${data.rentalName}`
      : `Booking Confirmed – ${data.rentalName} | Walker Creek Farms & Cabins`;

  const html = `
    <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; color: #2C1A0E;">
      <div style="background: #2C4A2E; padding: 32px; text-align: center;">
        <h1 style="color: #F5F0E8; margin: 0; font-size: 28px;">Walker Creek Farms &amp; Cabins</h1>
        <p style="color: #A8C5A0; margin: 8px 0 0;">Nebo, West Virginia</p>
      </div>
      <div style="padding: 32px; background: #FAF7F2;">
        <h2 style="color: #2C4A2E;">${data.status === "pending" ? "Booking Request Received" : "Your Stay is Confirmed!"}</h2>
        <p>Dear ${data.guestName},</p>
        <p>${data.status === "pending"
          ? "Thank you for your booking request! We'll review it and get back to you within 24 hours."
          : "Thank you for booking with us! We can't wait to welcome you to Walker Creek Farms & Cabins."
        }</p>

        <div style="background: #fff; border: 1px solid #E5DDD5; border-radius: 8px; padding: 24px; margin: 24px 0;">
          <h3 style="margin-top: 0; color: #2C4A2E; border-bottom: 1px solid #E5DDD5; padding-bottom: 12px;">Booking Details</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 8px 0; color: #7A6355;">Booking #</td><td style="padding: 8px 0; font-weight: bold;">${data.bookingId}</td></tr>
            <tr><td style="padding: 8px 0; color: #7A6355;">Property</td><td style="padding: 8px 0;">${data.rentalName}</td></tr>
            <tr><td style="padding: 8px 0; color: #7A6355;">Check-In</td><td style="padding: 8px 0;">${formatDate(data.checkIn)}</td></tr>
            <tr><td style="padding: 8px 0; color: #7A6355;">Check-Out</td><td style="padding: 8px 0;">${formatDate(data.checkOut)}</td></tr>
            <tr><td style="padding: 8px 0; color: #7A6355;">Guests</td><td style="padding: 8px 0;">${data.guestCount}</td></tr>
          </table>
        </div>

        <div style="background: #fff; border: 1px solid #E5DDD5; border-radius: 8px; padding: 24px; margin: 24px 0;">
          <h3 style="margin-top: 0; color: #2C4A2E; border-bottom: 1px solid #E5DDD5; padding-bottom: 12px;">Price Breakdown</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 6px 0; color: #7A6355;">${data.nights} night${data.nights !== 1 ? "s" : ""}</td><td style="padding: 6px 0; text-align: right;">${formatCurrency(data.nightlyTotal)}</td></tr>
            <tr><td style="padding: 6px 0; color: #7A6355;">Cleaning fee</td><td style="padding: 6px 0; text-align: right;">${formatCurrency(data.cleaningFee)}</td></tr>
            <tr><td style="padding: 6px 0; color: #7A6355;">Taxes</td><td style="padding: 6px 0; text-align: right;">${formatCurrency(data.taxAmount)}</td></tr>
            <tr style="border-top: 2px solid #E5DDD5;"><td style="padding: 12px 0 0; font-weight: bold;">Total</td><td style="padding: 12px 0 0; text-align: right; font-weight: bold; color: #2C4A2E;">${formatCurrency(data.totalPrice)}</td></tr>
          </table>
          <p style="color: #7A6355; font-size: 13px; margin-top: 12px;">${paymentLabel(data.paymentMode)}</p>
        </div>

        ${data.specialRequests ? `<p><strong>Special Requests:</strong> ${data.specialRequests}</p>` : ""}

        <div style="background: #2C4A2E; border-radius: 8px; padding: 20px; margin: 24px 0; color: #F5F0E8;">
          <h4 style="margin: 0 0 8px; color: #A8C5A0;">Need help?</h4>
          <p style="margin: 0; font-size: 14px;">Contact us at <a href="mailto:info@walkercreekfarms.com" style="color: #A8C5A0;">info@walkercreekfarms.com</a><br>or find us at 230 Nebo Walker Road, Clay County, WV</p>
        </div>
      </div>
    </div>
  `;

  await transporter.sendMail({ from: fromEmail, to: data.guestEmail, subject, html });
}

export async function sendOwnerNotificationEmail(data: BookingEmailData): Promise<void> {
  const transporter = getTransporter();
  if (!transporter) {
    console.log("[email] No SMTP configured – skipping owner notification email");
    return;
  }

  const ownerEmail = process.env.OWNER_EMAIL ?? process.env.SMTP_USER;
  if (!ownerEmail) return;

  const fromEmail = process.env.FROM_EMAIL ?? "noreply@walkercreekfarms.com";
  const subject = `New Booking #${data.bookingId} – ${data.rentalName} (${data.checkIn} to ${data.checkOut})`;

  const html = `
    <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; color: #2C1A0E;">
      <div style="background: #2C4A2E; padding: 24px;">
        <h2 style="color: #F5F0E8; margin: 0;">New Booking Received</h2>
      </div>
      <div style="padding: 24px; background: #FAF7F2;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 8px 0; color: #7A6355; width: 150px;">Booking #</td><td style="padding: 8px 0; font-weight: bold;">${data.bookingId}</td></tr>
          <tr><td style="padding: 8px 0; color: #7A6355;">Property</td><td style="padding: 8px 0;">${data.rentalName}</td></tr>
          <tr><td style="padding: 8px 0; color: #7A6355;">Guest Name</td><td style="padding: 8px 0;">${data.guestName}</td></tr>
          <tr><td style="padding: 8px 0; color: #7A6355;">Guest Email</td><td style="padding: 8px 0;"><a href="mailto:${data.guestEmail}">${data.guestEmail}</a></td></tr>
          <tr><td style="padding: 8px 0; color: #7A6355;">Guest Phone</td><td style="padding: 8px 0;">${data.guestPhone}</td></tr>
          <tr><td style="padding: 8px 0; color: #7A6355;">Check-In</td><td style="padding: 8px 0;">${formatDate(data.checkIn)}</td></tr>
          <tr><td style="padding: 8px 0; color: #7A6355;">Check-Out</td><td style="padding: 8px 0;">${formatDate(data.checkOut)}</td></tr>
          <tr><td style="padding: 8px 0; color: #7A6355;">Nights</td><td style="padding: 8px 0;">${data.nights}</td></tr>
          <tr><td style="padding: 8px 0; color: #7A6355;">Guests</td><td style="padding: 8px 0;">${data.guestCount}</td></tr>
          <tr><td style="padding: 8px 0; color: #7A6355;">Total</td><td style="padding: 8px 0; font-weight: bold;">${formatCurrency(data.totalPrice)}</td></tr>
          <tr><td style="padding: 8px 0; color: #7A6355;">Payment</td><td style="padding: 8px 0;">${paymentLabel(data.paymentMode)}</td></tr>
          <tr><td style="padding: 8px 0; color: #7A6355;">Status</td><td style="padding: 8px 0;">${data.status.toUpperCase()}</td></tr>
          ${data.specialRequests ? `<tr><td style="padding: 8px 0; color: #7A6355; vertical-align: top;">Special Requests</td><td style="padding: 8px 0;">${data.specialRequests}</td></tr>` : ""}
        </table>
      </div>
    </div>
  `;

  await transporter.sendMail({ from: fromEmail, to: ownerEmail, subject, html });
}
