import { Router } from "express";
import todoController from "../controllers/todo.controller.js";
import { authenticate } from "../authorization/authorization.js";

const router = Router({ mergeParams: true });

router.get("/", [authenticate], todoController.findAll);
router.post("/", [authenticate], todoController.create);

export default router;
