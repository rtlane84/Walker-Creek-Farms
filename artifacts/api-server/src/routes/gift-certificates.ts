import { Router } from "express";
import { eq } from "drizzle-orm";
import { db, giftCertificatesTable } from "@workspace/db";
import {
  CreateGiftCertificateBody,
  UpdateGiftCertificateParams,
  UpdateGiftCertificateBody,
  DeleteGiftCertificateParams,
} from "@workspace/api-zod";

const router = Router();

router.get("/gift-certificates", async (_req, res): Promise<void> => {
  const certs = await db.select().from(giftCertificatesTable);
  res.json(certs);
});

router.post("/gift-certificates", async (req, res): Promise<void> => {
  const parsed = CreateGiftCertificateBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [cert] = await db.insert(giftCertificatesTable).values(parsed.data).returning();
  res.status(201).json(cert);
});

router.patch("/gift-certificates/:id", async (req, res): Promise<void> => {
  const params = UpdateGiftCertificateParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateGiftCertificateBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [cert] = await db.update(giftCertificatesTable).set(parsed.data).where(eq(giftCertificatesTable.id, params.data.id)).returning();
  if (!cert) {
    res.status(404).json({ error: "Gift certificate not found" });
    return;
  }
  res.json(cert);
});

router.delete("/gift-certificates/:id", async (req, res): Promise<void> => {
  const params = DeleteGiftCertificateParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  await db.delete(giftCertificatesTable).where(eq(giftCertificatesTable.id, params.data.id));
  res.sendStatus(204);
});

export default router;
