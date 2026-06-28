import { Router } from "express";
import { eq, asc } from "drizzle-orm";
import { db, foodItemsTable } from "@workspace/db";
import {
  CreateFoodItemBody,
  UpdateFoodItemParams,
  UpdateFoodItemBody,
  DeleteFoodItemParams,
} from "@workspace/api-zod";

const router = Router();

router.get("/food-items", async (_req, res): Promise<void> => {
  const items = await db.select().from(foodItemsTable).orderBy(asc(foodItemsTable.sortOrder));
  res.json(items);
});

router.post("/food-items", async (req, res): Promise<void> => {
  const parsed = CreateFoodItemBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [item] = await db.insert(foodItemsTable).values(parsed.data).returning();
  res.status(201).json(item);
});

router.patch("/food-items/:id", async (req, res): Promise<void> => {
  const params = UpdateFoodItemParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateFoodItemBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [item] = await db.update(foodItemsTable).set(parsed.data).where(eq(foodItemsTable.id, params.data.id)).returning();
  if (!item) {
    res.status(404).json({ error: "Food item not found" });
    return;
  }
  res.json(item);
});

router.delete("/food-items/:id", async (req, res): Promise<void> => {
  const params = DeleteFoodItemParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  await db.delete(foodItemsTable).where(eq(foodItemsTable.id, params.data.id));
  res.sendStatus(204);
});

export default router;
