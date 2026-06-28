import { pgTable, text, serial, timestamp, integer, boolean, doublePrecision } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const rentalsTable = pgTable("rentals", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull().default("cabin"),
  description: text("description").notNull(),
  guestCount: integer("guest_count").notNull().default(2),
  bedrooms: integer("bedrooms").notNull().default(1),
  bathrooms: doublePrecision("bathrooms").notNull().default(1),
  weekdayPrice: doublePrecision("weekday_price").notNull(),
  weekendPrice: doublePrecision("weekend_price").notNull(),
  cleaningFee: doublePrecision("cleaning_fee").notNull().default(0),
  taxRate: doublePrecision("tax_rate").notNull().default(0),
  amenities: text("amenities"),
  coverPhoto: text("cover_photo"),
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertRentalSchema = createInsertSchema(rentalsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertRental = z.infer<typeof insertRentalSchema>;
export type Rental = typeof rentalsTable.$inferSelect;

export const rentalPhotosTable = pgTable("rental_photos", {
  id: serial("id").primaryKey(),
  rentalId: integer("rental_id").notNull().references(() => rentalsTable.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  caption: text("caption"),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const insertRentalPhotoSchema = createInsertSchema(rentalPhotosTable).omit({ id: true });
export type InsertRentalPhoto = z.infer<typeof insertRentalPhotoSchema>;
export type RentalPhoto = typeof rentalPhotosTable.$inferSelect;
