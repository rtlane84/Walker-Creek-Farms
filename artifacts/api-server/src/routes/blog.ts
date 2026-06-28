import { Router } from "express";
import { eq, desc } from "drizzle-orm";
import { db, blogPostsTable } from "@workspace/db";
import {
  CreateBlogPostBody,
  ListBlogPostsQueryParams,
  GetBlogPostParams,
  UpdateBlogPostParams,
  UpdateBlogPostBody,
  DeleteBlogPostParams,
} from "@workspace/api-zod";

const router = Router();

router.get("/blog-posts", async (req, res): Promise<void> => {
  const query = ListBlogPostsQueryParams.safeParse(req.query);
  const posts = await db.select().from(blogPostsTable).orderBy(desc(blogPostsTable.createdAt));
  const published = query.success ? query.data.published : undefined;
  const filtered = published !== undefined ? posts.filter((p) => p.isPublished === published) : posts;
  res.json(filtered);
});

router.post("/blog-posts", async (req, res): Promise<void> => {
  const parsed = CreateBlogPostBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const data = {
    ...parsed.data,
    publishedAt: parsed.data.isPublished ? new Date() : null,
  };
  const [post] = await db.insert(blogPostsTable).values(data).returning();
  res.status(201).json(post);
});

router.get("/blog-posts/:id", async (req, res): Promise<void> => {
  const params = GetBlogPostParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [post] = await db.select().from(blogPostsTable).where(eq(blogPostsTable.id, params.data.id));
  if (!post) {
    res.status(404).json({ error: "Blog post not found" });
    return;
  }
  res.json(post);
});

router.patch("/blog-posts/:id", async (req, res): Promise<void> => {
  const params = UpdateBlogPostParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateBlogPostBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const existing = await db.select().from(blogPostsTable).where(eq(blogPostsTable.id, params.data.id));
  const wasPublished = existing[0]?.isPublished;
  const data = {
    ...parsed.data,
    ...(parsed.data.isPublished && !wasPublished ? { publishedAt: new Date() } : {}),
  };
  const [post] = await db.update(blogPostsTable).set(data).where(eq(blogPostsTable.id, params.data.id)).returning();
  if (!post) {
    res.status(404).json({ error: "Blog post not found" });
    return;
  }
  res.json(post);
});

router.delete("/blog-posts/:id", async (req, res): Promise<void> => {
  const params = DeleteBlogPostParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  await db.delete(blogPostsTable).where(eq(blogPostsTable.id, params.data.id));
  res.sendStatus(204);
});

export default router;
