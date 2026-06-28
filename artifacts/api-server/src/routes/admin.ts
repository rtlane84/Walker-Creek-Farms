import { Router } from "express";
import { eq, gte, desc } from "drizzle-orm";
import { db, bookingsTable, rentalsTable } from "@workspace/db";
import { AdminLoginBody } from "@workspace/api-zod";

const router = Router();

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "walkercreek2024";

router.post("/admin/login", async (req, res): Promise<void> => {
  const parsed = AdminLoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  if (parsed.data.password !== ADMIN_PASSWORD) {
    res.status(401).json({ error: "Invalid password" });
    return;
  }
  (req.session as any).isAdmin = true;
  res.json({ success: true, message: "Logged in successfully" });
});

router.post("/admin/logout", async (req, res): Promise<void> => {
  req.session.destroy(() => {
    res.json({ success: true, message: "Logged out" });
  });
});

router.get("/admin/me", async (req, res): Promise<void> => {
  const isAdmin = (req.session as any)?.isAdmin === true;
  if (!isAdmin) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  res.json({ isAdmin: true });
});

router.get("/admin/dashboard", async (_req, res): Promise<void> => {
  const allBookings = await db
    .select({
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
      cleaningFee: bookingsTable.cleaningFee,
      taxAmount: bookingsTable.taxAmount,
      specialRequests: bookingsTable.specialRequests,
      stripePaymentIntentId: bookingsTable.stripePaymentIntentId,
      isAdminCreated: bookingsTable.isAdminCreated,
      createdAt: bookingsTable.createdAt,
    })
    .from(bookingsTable)
    .leftJoin(rentalsTable, eq(bookingsTable.rentalId, rentalsTable.id))
    .orderBy(desc(bookingsTable.createdAt));

  const today = new Date().toISOString().split("T")[0];
  const confirmedBookings = allBookings.filter((b) => b.status !== "cancelled");
  const upcomingBookings = confirmedBookings.filter((b) => b.checkIn >= today);
  const pendingBookings = allBookings.filter((b) => b.status === "pending");
  const totalRevenue = confirmedBookings.reduce((sum, b) => sum + b.totalPrice, 0);
  const recentBookings = allBookings.slice(0, 10);

  const activeRentals = await db.select().from(rentalsTable).where(eq(rentalsTable.isActive, true));

  res.json({
    totalBookings: allBookings.length,
    upcomingBookings: upcomingBookings.length,
    totalRevenue,
    activeRentals: activeRentals.length,
    pendingBookings: pendingBookings.length,
    recentBookings,
  });
});

router.get("/admin/upcoming-arrivals", async (_req, res): Promise<void> => {
  const today = new Date().toISOString().split("T")[0];
  const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  const arrivals = await db
    .select({
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
      cleaningFee: bookingsTable.cleaningFee,
      taxAmount: bookingsTable.taxAmount,
      specialRequests: bookingsTable.specialRequests,
      stripePaymentIntentId: bookingsTable.stripePaymentIntentId,
      isAdminCreated: bookingsTable.isAdminCreated,
      createdAt: bookingsTable.createdAt,
    })
    .from(bookingsTable)
    .leftJoin(rentalsTable, eq(bookingsTable.rentalId, rentalsTable.id))
    .where(gte(bookingsTable.checkIn, today));

  const upcoming = arrivals.filter((b) => b.checkIn <= thirtyDaysFromNow && b.status !== "cancelled");
  upcoming.sort((a, b) => a.checkIn.localeCompare(b.checkIn));
  res.json(upcoming);
});

export default router;
