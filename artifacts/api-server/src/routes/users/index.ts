import { Router, type IRouter } from "express";

const router: IRouter = Router();

router.get("/users", async (req, res): Promise<void> => {
  res.status(501).json({ error: "Not implemented" });
});

router.get("/users/:id", async (req, res): Promise<void> => {
  res.status(501).json({ error: "Not implemented" });
});

router.patch("/users/:id", async (req, res): Promise<void> => {
  res.status(501).json({ error: "Not implemented" });
});

router.delete("/users/:id", async (req, res): Promise<void> => {
  res.status(501).json({ error: "Not implemented" });
});

router.get("/users/:id/sessions", async (req, res): Promise<void> => {
  res.status(501).json({ error: "Not implemented" });
});

export default router;
