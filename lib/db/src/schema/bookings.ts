import { pgTable, text, serial, timestamp, integer, boolean, doublePrecision, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { rentalsTable } from "./rentals";

export const bookingsTable = pgTable("bookings", {
  id: serial("id").primaryKey(),
  rentalId: integer("rental_id").notNull().references(() => rentalsTable.id),
  guestName: text("guest_name").notNull(),
  guestEmail: text("guest_email").notNull(),
  guestPhone: text("guest_phone").notNull(),
  checkIn: date("check_in", { mode: "string" }).notNull(),
  checkOut: date("check_out", { mode: "string" }).notNull(),
  guestCount: integer("guest_count").notNull().default(1),
  status: text("status").notNull().default("pending"),
  totalPrice: doublePrecision("total_price").notNull().default(0),
  cleaningFee: doublePrecision("cleaning_fee").notNull().default(0),
  taxAmount: doublePrecision("tax_amount").notNull().default(0),
  specialRequests: text("special_requests"),
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  isAdminCreated: boolean("is_admin_created").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertBookingSchema = createInsertSchema(bookingsTable).omit({ id: true, createdAt: true });
export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type Booking = typeof bookingsTable.$inferSelect;

export const blockedDatesTable = pgTable("blocked_dates", {
  id: serial("id").primaryKey(),
  rentalId: integer("rental_id").notNull().references(() => rentalsTable.id, { onDelete: "cascade" }),
  startDate: date("start_date", { mode: "string" }).notNull(),
  endDate: date("end_date", { mode: "string" }).notNull(),
  reason: text("reason"),
});

export const insertBlockedDateSchema = createInsertSchema(blockedDatesTable).omit({ id: true });
export type InsertBlockedDate = z.infer<typeof insertBlockedDateSchema>;
export type BlockedDate = typeof blockedDatesTable.$inferSelect;
