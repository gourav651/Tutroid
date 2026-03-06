import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware.js";
import { advancedSearch, getAvailableSkills } from "./discovery.controller.js";

const router = Router();

router.get("/search", authenticate, advancedSearch);
router.get("/skills", authenticate, getAvailableSkills);

export default router;
