import { Router, type IRouter } from "express";

const router: IRouter = Router();

router.get("/courses", async (req, res): Promise<void> => {
  res.status(501).json({ error: "Not implemented" });
});

router.get("/courses/:id", async (req, res): Promise<void> => {
  res.status(501).json({ error: "Not implemented" });
});

router.post("/courses", async (req, res): Promise<void> => {
  res.status(501).json({ error: "Not implemented" });
});

router.patch("/courses/:id", async (req, res): Promise<void> => {
  res.status(501).json({ error: "Not implemented" });
});

router.delete("/courses/:id", async (req, res): Promise<void> => {
  res.status(501).json({ error: "Not implemented" });
});

router.get("/groups", async (req, res): Promise<void> => {
  res.status(501).json({ error: "Not implemented" });
});

router.post("/groups", async (req, res): Promise<void> => {
  res.status(501).json({ error: "Not implemented" });
});

router.get("/enrollments", async (req, res): Promise<void> => {
  res.status(501).json({ error: "Not implemented" });
});

router.post("/enrollments", async (req, res): Promise<void> => {
  res.status(501).json({ error: "Not implemented" });
});

export default router;
