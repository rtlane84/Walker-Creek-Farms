import { Router } from "express";
import { eq, and, or, gte, lte, desc } from "drizzle-orm";
import { db, bookingsTable, blockedDatesTable, rentalsTable } from "@workspace/db";
import {
  CreateBookingBody,
  ListBookingsQueryParams,
  GetBookingParams,
  UpdateBookingParams,
  UpdateBookingBody,
  DeleteBookingParams,
  ConfirmBookingParams,
  ConfirmBookingBody,
} from "@workspace/api-zod";
import { getPaymentMode } from "./stripe";
import { sendGuestConfirmationEmail, sendOwnerNotificationEmail } from "../emailService";

const router = Router();

const BOOKING_SELECT = {
  id: bookingsTable.id,
  rentalId: bookingsTable.rentalId,
  rentalName: rentalsTable.name,
  guestName: bookingsTable.guestName,
  guestEmail: bookingsTable.guestEmail,
  guestPhone: bookingsTable.guestPhone,
  checkIn: bookingsTable.checkIn,
  checkOut: bookingsTable.checkOut,
  guestCount: bookingsTable.guestCount,
  status: bookingsTable.status,
  totalPrice: bookingsTable.totalPrice,
  nightlyTotal: bookingsTable.nightlyTotal,
  cleaningFee: bookingsTable.cleaningFee,
  taxAmount: bookingsTable.taxAmount,
  specialRequests: bookingsTable.specialRequests,
  stripePaymentIntentId: bookingsTable.stripePaymentIntentId,
  stripeCheckoutSessionId: bookingsTable.stripeCheckoutSessionId,
  paymentMode: bookingsTable.paymentMode,
  isAdminCreated: bookingsTable.isAdminCreated,
  refundNote: bookingsTable.refundNote,
  createdAt: bookingsTable.createdAt,
};

function calcNights(checkIn: string, checkOut: string) {
  return Math.ceil(
    (new Date(checkOut + "T00:00:00Z").getTime() - new Date(checkIn + "T00:00:00Z").getTime()) /
      (1000 * 60 * 60 * 24)
  );
}

router.get("/bookings", async (req, res): Promise<void> => {
  const query = ListBookingsQueryParams.safeParse(req.query);
  const bookings = await db
    .select(BOOKING_SELECT)
    .from(bookingsTable)
    .leftJoin(rentalsTable, eq(bookingsTable.rentalId, rentalsTable.id))
    .orderBy(desc(bookingsTable.createdAt));

  const status = query.success ? query.data.status : undefined;
  const filtered = status ? bookings.filter((b) => b.status === status) : bookings;
  res.json(filtered);
});

router.post("/bookings", async (req, res): Promise<void> => {
  const parsed = CreateBookingBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { rentalId, checkIn, checkOut } = parsed.data;

  const conflictingBookings = await db
    .select()
    .from(bookingsTable)
    .where(
      and(
        eq(bookingsTable.rentalId, rentalId),
        or(
          and(lte(bookingsTable.checkIn, checkIn), gte(bookingsTable.checkOut, checkIn)),
          and(lte(bookingsTable.checkIn, checkOut), gte(bookingsTable.checkOut, checkOut)),
          and(gte(bookingsTable.checkIn, checkIn), lte(bookingsTable.checkOut, checkOut))
        )
      )
    );

  const confirmedConflicts = conflictingBookings.filter((b) => b.status !== "cancelled");
  if (confirmedConflicts.length > 0) {
    res.status(409).json({ error: "Selected dates are not available" });
    return;
  }

  const [rental] = await db.select().from(rentalsTable).where(eq(rentalsTable.id, rentalId));
  if (!rental) {
    res.status(404).json({ error: "Rental not found" });
    return;
  }

  const nights = calcNights(checkIn, checkOut);

  const checkInDate = new Date(checkIn + "T12:00:00Z");
  let nightlyTotal = 0;
  for (let i = 0; i < nights; i++) {
    const d = new Date(checkInDate);
    d.setUTCDate(d.getUTCDate() + i);
    const dow = d.getUTCDay();
    nightlyTotal += dow === 0 || dow === 5 || dow === 6 ? rental.weekendPrice : rental.weekdayPrice;
  }

  const cleaningFee = rental.cleaningFee;
  const taxAmount = (nightlyTotal + cleaningFee) * (rental.taxRate / 100);
  const totalPrice = nightlyTotal + cleaningFee + taxAmount;

  const paymentMode = parsed.data.isAdminCreated ? "manual" : await getPaymentMode();
  const status = parsed.data.isAdminCreated ? "confirmed" : paymentMode === "request" ? "pending" : "pending";

  const [booking] = await db
    .insert(bookingsTable)
    .values({
      ...parsed.data,
      nightlyTotal,
      totalPrice,
      cleaningFee,
      taxAmount,
      paymentMode,
      status,
    })
    .returning();

  const bookingWithName = { ...booking, rentalName: rental.name };

  if (parsed.data.isAdminCreated || paymentMode === "request") {
    const emailData = {
      bookingId: booking.id,
      guestName: booking.guestName,
      guestEmail: booking.guestEmail,
      guestPhone: booking.guestPhone,
      rentalName: rental.name,
      checkIn: booking.checkIn,
      checkOut: booking.checkOut,
      nights,
      guestCount: booking.guestCount,
      nightlyTotal: booking.nightlyTotal,
      cleaningFee: booking.cleaningFee,
      taxAmount: booking.taxAmount,
      totalPrice: booking.totalPrice,
      specialRequests: booking.specialRequests,
      paymentMode: booking.paymentMode,
      status: booking.status,
    };
    await Promise.allSettled([
      sendGuestConfirmationEmail(emailData),
      sendOwnerNotificationEmail(emailData),
    ]);
  }

  res.status(201).json(bookingWithName);
});

router.get("/bookings/:id", async (req, res): Promise<void> => {
  const params = GetBookingParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const [booking] = await db
    .select(BOOKING_SELECT)
    .from(bookingsTable)
    .leftJoin(rentalsTable, eq(bookingsTable.rentalId, rentalsTable.id))
    .where(eq(bookingsTable.id, params.data.id));
  if (!booking) { res.status(404).json({ error: "Booking not found" }); return; }
  res.json(booking);
});

router.patch("/bookings/:id", async (req, res): Promise<void> => {
  const params = UpdateBookingParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const parsed = UpdateBookingBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [booking] = await db
    .update(bookingsTable)
    .set(parsed.data)
    .where(eq(bookingsTable.id, params.data.id))
    .returning();
  if (!booking) { res.status(404).json({ error: "Booking not found" }); return; }
  const [rental] = await db.select({ name: rentalsTable.name }).from(rentalsTable).where(eq(rentalsTable.id, booking.rentalId));
  res.json({ ...booking, rentalName: rental?.name ?? null });
});

router.delete("/bookings/:id", async (req, res): Promise<void> => {
  const params = DeleteBookingParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  await db.update(bookingsTable).set({ status: "cancelled" }).where(eq(bookingsTable.id, params.data.id));
  res.sendStatus(204);
});

router.post("/bookings/:id/confirm", async (req, res): Promise<void> => {
  const params = ConfirmBookingParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const parsed = ConfirmBookingBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [booking] = await db
    .update(bookingsTable)
    .set({ status: "confirmed", stripePaymentIntentId: parsed.data.paymentIntentId })
    .where(eq(bookingsTable.id, params.data.id))
    .returning();
  if (!booking) { res.status(404).json({ error: "Booking not found" }); return; }
  const [rental] = await db.select({ name: rentalsTable.name }).from(rentalsTable).where(eq(rentalsTable.id, booking.rentalId));
  res.json({ ...booking, rentalName: rental?.name ?? null });
});

export default router;
