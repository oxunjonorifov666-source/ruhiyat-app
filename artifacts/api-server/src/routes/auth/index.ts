import { Router, type IRouter } from "express";

const router: IRouter = Router();

router.post("/auth/register", async (req, res): Promise<void> => {
  res.status(501).json({ error: "Not implemented" });
});

router.post("/auth/login", async (req, res): Promise<void> => {
  res.status(501).json({ error: "Not implemented" });
});

router.post("/auth/refresh", async (req, res): Promise<void> => {
  res.status(501).json({ error: "Not implemented" });
});

router.post("/auth/logout", async (req, res): Promise<void> => {
  res.status(501).json({ error: "Not implemented" });
});

router.post("/auth/otp/send", async (req, res): Promise<void> => {
  res.status(501).json({ error: "Not implemented" });
});

router.post("/auth/otp/verify", async (req, res): Promise<void> => {
  res.status(501).json({ error: "Not implemented" });
});

router.post("/auth/password/reset-request", async (req, res): Promise<void> => {
  res.status(501).json({ error: "Not implemented" });
});

router.post("/auth/password/reset", async (req, res): Promise<void> => {
  res.status(501).json({ error: "Not implemented" });
});

export default router;
