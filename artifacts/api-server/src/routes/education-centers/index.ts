import { Router, type IRouter } from "express";

const router: IRouter = Router();

router.get("/education-centers", async (req, res): Promise<void> => {
  res.status(501).json({ error: "Not implemented" });
});

router.get("/education-centers/:id", async (req, res): Promise<void> => {
  res.status(501).json({ error: "Not implemented" });
});

router.post("/education-centers", async (req, res): Promise<void> => {
  res.status(501).json({ error: "Not implemented" });
});

router.patch("/education-centers/:id", async (req, res): Promise<void> => {
  res.status(501).json({ error: "Not implemented" });
});

router.delete("/education-centers/:id", async (req, res): Promise<void> => {
  res.status(501).json({ error: "Not implemented" });
});

router.get("/education-centers/:id/staff", async (req, res): Promise<void> => {
  res.status(501).json({ error: "Not implemented" });
});

router.get("/education-centers/:id/students", async (req, res): Promise<void> => {
  res.status(501).json({ error: "Not implemented" });
});

router.get("/education-centers/:id/teachers", async (req, res): Promise<void> => {
  res.status(501).json({ error: "Not implemented" });
});

router.get("/education-centers/:id/courses", async (req, res): Promise<void> => {
  res.status(501).json({ error: "Not implemented" });
});

router.get("/education-centers/:id/groups", async (req, res): Promise<void> => {
  res.status(501).json({ error: "Not implemented" });
});

export default router;
