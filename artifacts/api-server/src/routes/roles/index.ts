import { Router, type IRouter } from "express";

const router: IRouter = Router();

router.get("/roles", async (req, res): Promise<void> => {
  res.status(501).json({ error: "Not implemented" });
});

router.post("/roles", async (req, res): Promise<void> => {
  res.status(501).json({ error: "Not implemented" });
});

router.get("/roles/:id", async (req, res): Promise<void> => {
  res.status(501).json({ error: "Not implemented" });
});

router.patch("/roles/:id", async (req, res): Promise<void> => {
  res.status(501).json({ error: "Not implemented" });
});

router.delete("/roles/:id", async (req, res): Promise<void> => {
  res.status(501).json({ error: "Not implemented" });
});

router.get("/roles/:id/permissions", async (req, res): Promise<void> => {
  res.status(501).json({ error: "Not implemented" });
});

router.post("/roles/:id/permissions", async (req, res): Promise<void> => {
  res.status(501).json({ error: "Not implemented" });
});

export default router;
