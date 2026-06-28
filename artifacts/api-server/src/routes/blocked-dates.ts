import { Router } from "express";
import { eq } from "drizzle-orm";
import { db, blockedDatesTable } from "@workspace/db";
import {
  CreateBlockedDateBody,
  DeleteBlockedDateParams,
} from "@workspace/api-zod";

const router = Router();

router.get("/blocked-dates", async (_req, res): Promise<void> => {
  const dates = await db.select().from(blockedDatesTable);
  res.json(dates);
});

router.post("/blocked-dates", async (req, res): Promise<void> => {
  const parsed = CreateBlockedDateBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [date] = await db.insert(blockedDatesTable).values(parsed.data).returning();
  res.status(201).json(date);
});

router.delete("/blocked-dates/:id", async (req, res): Promise<void> => {
  const params = DeleteBlockedDateParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  await db.delete(blockedDatesTable).where(eq(blockedDatesTable.id, params.data.id));
  res.sendStatus(204);
});

export default router;
