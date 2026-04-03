import { Router, type IRouter } from "express";

const router: IRouter = Router();

router.get("/meetings", async (req, res): Promise<void> => {
  res.status(501).json({ error: "Not implemented" });
});

router.get("/meetings/:id", async (req, res): Promise<void> => {
  res.status(501).json({ error: "Not implemented" });
});

router.post("/meetings", async (req, res): Promise<void> => {
  res.status(501).json({ error: "Not implemented" });
});

router.patch("/meetings/:id", async (req, res): Promise<void> => {
  res.status(501).json({ error: "Not implemented" });
});

router.delete("/meetings/:id", async (req, res): Promise<void> => {
  res.status(501).json({ error: "Not implemented" });
});

router.post("/meetings/:id/join", async (req, res): Promise<void> => {
  res.status(501).json({ error: "Not implemented" });
});

router.post("/meetings/:id/leave", async (req, res): Promise<void> => {
  res.status(501).json({ error: "Not implemented" });
});

export default router;
