import { Router, type IRouter } from "express";

const router: IRouter = Router();

router.get("/chats", async (req, res): Promise<void> => {
  res.status(501).json({ error: "Not implemented" });
});

router.post("/chats", async (req, res): Promise<void> => {
  res.status(501).json({ error: "Not implemented" });
});

router.get("/chats/:id", async (req, res): Promise<void> => {
  res.status(501).json({ error: "Not implemented" });
});

router.get("/chats/:id/messages", async (req, res): Promise<void> => {
  res.status(501).json({ error: "Not implemented" });
});

router.post("/chats/:id/messages", async (req, res): Promise<void> => {
  res.status(501).json({ error: "Not implemented" });
});

router.get("/notifications", async (req, res): Promise<void> => {
  res.status(501).json({ error: "Not implemented" });
});

router.patch("/notifications/:id/read", async (req, res): Promise<void> => {
  res.status(501).json({ error: "Not implemented" });
});

router.get("/announcements", async (req, res): Promise<void> => {
  res.status(501).json({ error: "Not implemented" });
});

router.post("/announcements", async (req, res): Promise<void> => {
  res.status(501).json({ error: "Not implemented" });
});

router.patch("/announcements/:id", async (req, res): Promise<void> => {
  res.status(501).json({ error: "Not implemented" });
});

router.delete("/announcements/:id", async (req, res): Promise<void> => {
  res.status(501).json({ error: "Not implemented" });
});

export default router;
