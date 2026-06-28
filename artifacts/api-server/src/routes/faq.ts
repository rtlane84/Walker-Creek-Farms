import { Router } from "express";
import { eq, asc } from "drizzle-orm";
import { db, faqItemsTable } from "@workspace/db";
import {
  CreateFaqItemBody,
  UpdateFaqItemParams,
  UpdateFaqItemBody,
  DeleteFaqItemParams,
} from "@workspace/api-zod";

const router = Router();

router.get("/faq-items", async (_req, res): Promise<void> => {
  const items = await db.select().from(faqItemsTable).orderBy(asc(faqItemsTable.sortOrder));
  res.json(items);
});

router.post("/faq-items", async (req, res): Promise<void> => {
  const parsed = CreateFaqItemBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [item] = await db.insert(faqItemsTable).values(parsed.data).returning();
  res.status(201).json(item);
});

router.patch("/faq-items/:id", async (req, res): Promise<void> => {
  const params = UpdateFaqItemParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateFaqItemBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [item] = await db.update(faqItemsTable).set(parsed.data).where(eq(faqItemsTable.id, params.data.id)).returning();
  if (!item) {
    res.status(404).json({ error: "FAQ item not found" });
    return;
  }
  res.json(item);
});

router.delete("/faq-items/:id", async (req, res): Promise<void> => {
  const params = DeleteFaqItemParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  await db.delete(faqItemsTable).where(eq(faqItemsTable.id, params.data.id));
  res.sendStatus(204);
});

export default router;
