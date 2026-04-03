import { Router, type IRouter } from "express";

const router: IRouter = Router();

router.get("/payments", async (req, res): Promise<void> => {
  res.status(501).json({ error: "Not implemented" });
});

router.post("/payments", async (req, res): Promise<void> => {
  res.status(501).json({ error: "Not implemented" });
});

router.get("/payments/:id", async (req, res): Promise<void> => {
  res.status(501).json({ error: "Not implemented" });
});

router.get("/transactions", async (req, res): Promise<void> => {
  res.status(501).json({ error: "Not implemented" });
});

router.get("/revenue", async (req, res): Promise<void> => {
  res.status(501).json({ error: "Not implemented" });
});

export default router;
