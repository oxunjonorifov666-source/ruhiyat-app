import { Router, type IRouter } from "express";

const router: IRouter = Router();

router.get("/mood", async (req, res): Promise<void> => {
  res.status(501).json({ error: "Not implemented" });
});

router.post("/mood", async (req, res): Promise<void> => {
  res.status(501).json({ error: "Not implemented" });
});

router.get("/diary", async (req, res): Promise<void> => {
  res.status(501).json({ error: "Not implemented" });
});

router.post("/diary", async (req, res): Promise<void> => {
  res.status(501).json({ error: "Not implemented" });
});

router.get("/diary/:id", async (req, res): Promise<void> => {
  res.status(501).json({ error: "Not implemented" });
});

router.patch("/diary/:id", async (req, res): Promise<void> => {
  res.status(501).json({ error: "Not implemented" });
});

router.delete("/diary/:id", async (req, res): Promise<void> => {
  res.status(501).json({ error: "Not implemented" });
});

router.get("/habits", async (req, res): Promise<void> => {
  res.status(501).json({ error: "Not implemented" });
});

router.post("/habits", async (req, res): Promise<void> => {
  res.status(501).json({ error: "Not implemented" });
});

router.patch("/habits/:id", async (req, res): Promise<void> => {
  res.status(501).json({ error: "Not implemented" });
});

router.delete("/habits/:id", async (req, res): Promise<void> => {
  res.status(501).json({ error: "Not implemented" });
});

router.post("/habits/:id/log", async (req, res): Promise<void> => {
  res.status(501).json({ error: "Not implemented" });
});

router.get("/sleep", async (req, res): Promise<void> => {
  res.status(501).json({ error: "Not implemented" });
});

router.post("/sleep", async (req, res): Promise<void> => {
  res.status(501).json({ error: "Not implemented" });
});

router.get("/breathing", async (req, res): Promise<void> => {
  res.status(501).json({ error: "Not implemented" });
});

router.post("/breathing", async (req, res): Promise<void> => {
  res.status(501).json({ error: "Not implemented" });
});

router.get("/saved-items", async (req, res): Promise<void> => {
  res.status(501).json({ error: "Not implemented" });
});

router.post("/saved-items", async (req, res): Promise<void> => {
  res.status(501).json({ error: "Not implemented" });
});

router.delete("/saved-items/:id", async (req, res): Promise<void> => {
  res.status(501).json({ error: "Not implemented" });
});

export default router;
