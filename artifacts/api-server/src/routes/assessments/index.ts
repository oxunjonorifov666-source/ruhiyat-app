import { Router, type IRouter } from "express";

const router: IRouter = Router();

router.get("/tests", async (req, res): Promise<void> => {
  res.status(501).json({ error: "Not implemented" });
});

router.get("/tests/:id", async (req, res): Promise<void> => {
  res.status(501).json({ error: "Not implemented" });
});

router.post("/tests", async (req, res): Promise<void> => {
  res.status(501).json({ error: "Not implemented" });
});

router.patch("/tests/:id", async (req, res): Promise<void> => {
  res.status(501).json({ error: "Not implemented" });
});

router.delete("/tests/:id", async (req, res): Promise<void> => {
  res.status(501).json({ error: "Not implemented" });
});

router.get("/tests/:id/questions", async (req, res): Promise<void> => {
  res.status(501).json({ error: "Not implemented" });
});

router.post("/tests/:id/submit", async (req, res): Promise<void> => {
  res.status(501).json({ error: "Not implemented" });
});

router.get("/test-results", async (req, res): Promise<void> => {
  res.status(501).json({ error: "Not implemented" });
});

router.get("/test-results/:id", async (req, res): Promise<void> => {
  res.status(501).json({ error: "Not implemented" });
});

export default router;
