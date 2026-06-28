import { Router } from "express";
import { eq, desc } from "drizzle-orm";
import { db, contactMessagesTable } from "@workspace/db";
import {
  CreateContactMessageBody,
  DeleteContactMessageParams,
} from "@workspace/api-zod";

const router = Router();

router.get("/contact-messages", async (_req, res): Promise<void> => {
  const messages = await db.select().from(contactMessagesTable).orderBy(desc(contactMessagesTable.createdAt));
  res.json(messages);
});

router.post("/contact-messages", async (req, res): Promise<void> => {
  const parsed = CreateContactMessageBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [msg] = await db.insert(contactMessagesTable).values(parsed.data).returning();
  res.status(201).json(msg);
});

router.delete("/contact-messages/:id", async (req, res): Promise<void> => {
  const params = DeleteContactMessageParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  await db.delete(contactMessagesTable).where(eq(contactMessagesTable.id, params.data.id));
  res.sendStatus(204);
});

export default router;
