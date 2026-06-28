import { Router, type RequestHandler } from "express";
import { eq } from "drizzle-orm";
import { db, bookingsTable, rentalsTable, siteSettingsTable } from "@workspace/db";
import { getStripeClient } from "../stripeClient";
import { sendGuestConfirmationEmail, sendOwnerNotificationEmail } from "../emailService";
import type { BookingEmailData } from "../emailService";

const router = Router();

function getSiteUrl(req: any): string {
  const domains = process.env.REPLIT_DOMAINS?.split(",")[0];
  if (domains) return `https://${domains}`;
  return `${req.protocol}://${req.get("host")}`;
}

export async function getPaymentMode(): Promise<string> {
  const [row] = await db
    .select()
    .from(siteSettingsTable)
    .where(eq(siteSettingsTable.key, "payment_mode"));
  return row?.value ?? "full";
}

function calcNights(checkIn: string, checkOut: string) {
  return Math.ceil(
    (new Date(checkOut + "T00:00:00Z").getTime() - new Date(checkIn + "T00:00:00Z").getTime()) /
      (1000 * 60 * 60 * 24)
  );
}

router.post("/stripe/create-checkout", async (req, res): Promise<void> => {
  const { bookingId } = req.body;
  if (!bookingId) {
    res.status(400).json({ error: "bookingId required" });
    return;
  }

  const [booking] = await db
    .select({
      id: bookingsTable.id,
      rentalId: bookingsTable.rentalId,
      rentalName: rentalsTable.name,
      guestName: bookingsTable.guestName,
      guestEmail: bookingsTable.guestEmail,
      checkIn: bookingsTable.checkIn,
      checkOut: bookingsTable.checkOut,
      totalPrice: bookingsTable.totalPrice,
      nightlyTotal: bookingsTable.nightlyTotal,
      cleaningFee: bookingsTable.cleaningFee,
      taxAmount: bookingsTable.taxAmount,
      status: bookingsTable.status,
    })
    .from(bookingsTable)
    .leftJoin(rentalsTable, eq(bookingsTable.rentalId, rentalsTable.id))
    .where(eq(bookingsTable.id, Number(bookingId)));

  if (!booking) {
    res.status(404).json({ error: "Booking not found" });
    return;
  }
  if (booking.status === "confirmed") {
    res.status(409).json({ error: "Booking already confirmed" });
    return;
  }

  const paymentMode = await getPaymentMode();
  const isDeposit = paymentMode === "deposit";
  const chargeAmount = isDeposit
    ? Math.round(booking.totalPrice * 0.5 * 100)
    : Math.round(booking.totalPrice * 100);

  const nights = calcNights(booking.checkIn, booking.checkOut);
  const siteUrl = getSiteUrl(req);
  const stripe = getStripeClient();

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",
    customer_email: booking.guestEmail,
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: `${booking.rentalName} – ${nights} night${nights !== 1 ? "s" : ""}`,
            description: `Check-in: ${booking.checkIn} · Check-out: ${booking.checkOut}${isDeposit ? " (50% deposit)" : ""}`,
          },
          unit_amount: chargeAmount,
        },
        quantity: 1,
      },
    ],
    metadata: {
      bookingId: String(booking.id),
      paymentMode,
    },
    success_url: `${siteUrl}/booking-success?session_id={CHECKOUT_SESSION_ID}&booking_id=${booking.id}`,
    cancel_url: `${siteUrl}/cabins/${booking.rentalId}`,
  });

  await db
    .update(bookingsTable)
    .set({ stripeCheckoutSessionId: session.id, paymentMode })
    .where(eq(bookingsTable.id, Number(bookingId)));

  res.json({ url: session.url, sessionId: session.id });
});

export const WebhookHandler: RequestHandler = async (req, res): Promise<void> => {
  const stripe = getStripeClient();
  const sig = req.headers["stripe-signature"];

  if (!sig) {
    res.status(400).json({ error: "Missing stripe-signature" });
    return;
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  let event: any;

  try {
    if (webhookSecret && Buffer.isBuffer(req.body)) {
      event = stripe.webhooks.constructEvent(
        req.body,
        Array.isArray(sig) ? sig[0] : sig,
        webhookSecret
      );
    } else {
      event = typeof req.body === "object" ? req.body : JSON.parse(req.body.toString());
    }
  } catch (err: any) {
    res.status(400).json({ error: `Webhook error: ${err.message}` });
    return;
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const bookingId = Number(session.metadata?.bookingId);
    const paymentIntentId = session.payment_intent;

    if (bookingId) {
      const [booking] = await db
        .update(bookingsTable)
        .set({ status: "confirmed", stripePaymentIntentId: String(paymentIntentId) })
        .where(eq(bookingsTable.id, bookingId))
        .returning();

      if (booking) {
        const [rental] = await db
          .select({ name: rentalsTable.name })
          .from(rentalsTable)
          .where(eq(rentalsTable.id, booking.rentalId));

        const emailData: BookingEmailData = {
          bookingId: booking.id,
          guestName: booking.guestName,
          guestEmail: booking.guestEmail,
          guestPhone: booking.guestPhone,
          rentalName: rental?.name ?? "Walker Creek Property",
          checkIn: booking.checkIn,
          checkOut: booking.checkOut,
          nights: calcNights(booking.checkIn, booking.checkOut),
          guestCount: booking.guestCount,
          nightlyTotal: booking.nightlyTotal,
          cleaningFee: booking.cleaningFee,
          taxAmount: booking.taxAmount,
          totalPrice: booking.totalPrice,
          specialRequests: booking.specialRequests,
          paymentMode: booking.paymentMode,
          status: "confirmed",
        };

        await Promise.allSettled([
          sendGuestConfirmationEmail(emailData),
          sendOwnerNotificationEmail(emailData),
        ]);
      }
    }
  }

  res.json({ received: true });
};

router.get("/stripe/session-status", async (req, res): Promise<void> => {
  const { session_id, booking_id } = req.query as { session_id: string; booking_id: string };
  if (!session_id || !booking_id) {
    res.status(400).json({ error: "session_id and booking_id required" });
    return;
  }

  const stripe = getStripeClient();
  const session = await stripe.checkout.sessions.retrieve(session_id);

  const [booking] = await db
    .select({
      id: bookingsTable.id,
      status: bookingsTable.status,
      guestName: bookingsTable.guestName,
      guestEmail: bookingsTable.guestEmail,
      rentalId: bookingsTable.rentalId,
      rentalName: rentalsTable.name,
      checkIn: bookingsTable.checkIn,
      checkOut: bookingsTable.checkOut,
      guestCount: bookingsTable.guestCount,
      totalPrice: bookingsTable.totalPrice,
      nightlyTotal: bookingsTable.nightlyTotal,
      cleaningFee: bookingsTable.cleaningFee,
      taxAmount: bookingsTable.taxAmount,
      paymentMode: bookingsTable.paymentMode,
    })
    .from(bookingsTable)
    .leftJoin(rentalsTable, eq(bookingsTable.rentalId, rentalsTable.id))
    .where(eq(bookingsTable.id, Number(booking_id)));

  if (!booking) {
    res.status(404).json({ error: "Booking not found" });
    return;
  }

  if (session.payment_status === "paid" && booking.status !== "confirmed") {
    await db
      .update(bookingsTable)
      .set({ status: "confirmed", stripePaymentIntentId: String(session.payment_intent) })
      .where(eq(bookingsTable.id, Number(booking_id)));
    booking.status = "confirmed";
  }

  res.json({ paymentStatus: session.payment_status, booking });
});

router.get("/settings/payment-mode", async (_req, res): Promise<void> => {
  const mode = await getPaymentMode();
  res.json({ mode });
});

router.put("/settings/payment-mode", async (req, res): Promise<void> => {
  const { mode } = req.body;
  if (!["full", "deposit", "request"].includes(mode)) {
    res.status(400).json({ error: "Invalid mode. Use: full, deposit, request" });
    return;
  }
  await db
    .insert(siteSettingsTable)
    .values({ key: "payment_mode", value: mode })
    .onConflictDoUpdate({ target: siteSettingsTable.key, set: { value: mode } });
  res.json({ mode });
});

export default router;
