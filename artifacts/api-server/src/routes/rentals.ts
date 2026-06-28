import { Router } from "express";
import { eq, asc } from "drizzle-orm";
import { db, rentalsTable, rentalPhotosTable, bookingsTable, blockedDatesTable } from "@workspace/db";
import {
  CreateRentalBody,
  UpdateRentalParams,
  UpdateRentalBody,
  DeleteRentalParams,
  GetRentalParams,
  ListRentalPhotosParams,
  AddRentalPhotoParams,
  AddRentalPhotoBody,
  DeleteRentalPhotoParams,
  GetRentalAvailabilityParams,
} from "@workspace/api-zod";

const router = Router();

router.get("/rentals", async (_req, res): Promise<void> => {
  const rentals = await db.select().from(rentalsTable).orderBy(asc(rentalsTable.sortOrder), asc(rentalsTable.id));
  res.json(rentals);
});

router.post("/rentals", async (req, res): Promise<void> => {
  const parsed = CreateRentalBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [rental] = await db.insert(rentalsTable).values(parsed.data).returning();
  res.status(201).json(rental);
});

router.get("/rentals/:id", async (req, res): Promise<void> => {
  const params = GetRentalParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [rental] = await db.select().from(rentalsTable).where(eq(rentalsTable.id, params.data.id));
  if (!rental) {
    res.status(404).json({ error: "Rental not found" });
    return;
  }
  res.json(rental);
});

router.patch("/rentals/:id", async (req, res): Promise<void> => {
  const params = UpdateRentalParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateRentalBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [rental] = await db.update(rentalsTable).set(parsed.data).where(eq(rentalsTable.id, params.data.id)).returning();
  if (!rental) {
    res.status(404).json({ error: "Rental not found" });
    return;
  }
  res.json(rental);
});

router.delete("/rentals/:id", async (req, res): Promise<void> => {
  const params = DeleteRentalParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  await db.delete(rentalsTable).where(eq(rentalsTable.id, params.data.id));
  res.sendStatus(204);
});

router.get("/rentals/:id/photos", async (req, res): Promise<void> => {
  const params = ListRentalPhotosParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const photos = await db
    .select()
    .from(rentalPhotosTable)
    .where(eq(rentalPhotosTable.rentalId, params.data.id))
    .orderBy(asc(rentalPhotosTable.sortOrder));
  res.json(photos);
});

router.post("/rentals/:id/photos", async (req, res): Promise<void> => {
  const params = AddRentalPhotoParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = AddRentalPhotoBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [photo] = await db
    .insert(rentalPhotosTable)
    .values({ ...parsed.data, rentalId: params.data.id })
    .returning();
  res.status(201).json(photo);
});

router.delete("/rental-photos/:id", async (req, res): Promise<void> => {
  const params = DeleteRentalPhotoParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  await db.delete(rentalPhotosTable).where(eq(rentalPhotosTable.id, params.data.id));
  res.sendStatus(204);
});

router.get("/rentals/:id/availability", async (req, res): Promise<void> => {
  const params = GetRentalAvailabilityParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const confirmedBookings = await db
    .select({ checkIn: bookingsTable.checkIn, checkOut: bookingsTable.checkOut })
    .from(bookingsTable)
    .where(eq(bookingsTable.rentalId, params.data.id));

  const blockedRanges = await db
    .select({ startDate: blockedDatesTable.startDate, endDate: blockedDatesTable.endDate })
    .from(blockedDatesTable)
    .where(eq(blockedDatesTable.rentalId, params.data.id));

  const unavailableDates: string[] = [];

  const addDatesInRange = (start: string, end: string) => {
    const current = new Date(start + "T00:00:00Z");
    const endDate = new Date(end + "T00:00:00Z");
    while (current < endDate) {
      unavailableDates.push(current.toISOString().split("T")[0]);
      current.setUTCDate(current.getUTCDate() + 1);
    }
  };

  for (const booking of confirmedBookings) {
    addDatesInRange(booking.checkIn, booking.checkOut);
  }
  for (const blocked of blockedRanges) {
    addDatesInRange(blocked.startDate, blocked.endDate);
  }

  const unique = [...new Set(unavailableDates)].sort();
  res.json({ rentalId: params.data.id, unavailableDates: unique });
});

export default router;
