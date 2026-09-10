import { Router } from "express";
import authRoutes from "./auth.routes.js";
import { authenticate } from "../authorization/authorization.js";

const router = Router();

router.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

router.use("/", authRoutes);

// Feature 1 auth probe for US-1.3; Feature 2 replaces this with list CRUD.
router.get("/lists", [authenticate], (_req, res) => {
  res.send([]);
});

export default router;
