import { Router } from "express";
import { login, loginSchema, me } from "../controllers/authController";
import { validateBody } from "../middleware/validate";
import { authenticate } from "../middleware/auth";

const router = Router();

router.post("/login", validateBody(loginSchema), login);
router.get("/me", authenticate, me);

export default router;
