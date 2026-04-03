import { Router, type IRouter } from "express";

const router: IRouter = Router();

router.get("/psychologists", async (req, res): Promise<void> => {
  res.status(501).json({ error: "Not implemented" });
});

router.get("/psychologists/:id", async (req, res): Promise<void> => {
  res.status(501).json({ error: "Not implemented" });
});

router.post("/psychologists", async (req, res): Promise<void> => {
  res.status(501).json({ error: "Not implemented" });
});

router.patch("/psychologists/:id", async (req, res): Promise<void> => {
  res.status(501).json({ error: "Not implemented" });
});

router.delete("/psychologists/:id", async (req, res): Promise<void> => {
  res.status(501).json({ error: "Not implemented" });
});

export default router;
