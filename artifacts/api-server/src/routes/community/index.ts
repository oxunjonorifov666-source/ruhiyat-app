import { Router, type IRouter } from "express";

const router: IRouter = Router();

router.get("/community/posts", async (req, res): Promise<void> => {
  res.status(501).json({ error: "Not implemented" });
});

router.post("/community/posts", async (req, res): Promise<void> => {
  res.status(501).json({ error: "Not implemented" });
});

router.get("/community/posts/:id", async (req, res): Promise<void> => {
  res.status(501).json({ error: "Not implemented" });
});

router.patch("/community/posts/:id", async (req, res): Promise<void> => {
  res.status(501).json({ error: "Not implemented" });
});

router.delete("/community/posts/:id", async (req, res): Promise<void> => {
  res.status(501).json({ error: "Not implemented" });
});

router.get("/community/posts/:id/comments", async (req, res): Promise<void> => {
  res.status(501).json({ error: "Not implemented" });
});

router.post("/community/posts/:id/comments", async (req, res): Promise<void> => {
  res.status(501).json({ error: "Not implemented" });
});

router.post("/complaints", async (req, res): Promise<void> => {
  res.status(501).json({ error: "Not implemented" });
});

router.get("/complaints", async (req, res): Promise<void> => {
  res.status(501).json({ error: "Not implemented" });
});

router.patch("/complaints/:id", async (req, res): Promise<void> => {
  res.status(501).json({ error: "Not implemented" });
});

router.get("/moderation/actions", async (req, res): Promise<void> => {
  res.status(501).json({ error: "Not implemented" });
});

router.post("/moderation/actions", async (req, res): Promise<void> => {
  res.status(501).json({ error: "Not implemented" });
});

export default router;
