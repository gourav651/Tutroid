import express from "express";
import { validate } from "../../middleware/validate.middleware.js";
import { authMiddleware } from "../../middleware/auth.middleware.js";

import {
  createInstitutionProfile,
  getMyInstitutionProfile,
  searchInstitutions,
} from "./institution.controller.js";

import { createInstitutionProfileSchema } from "./institution.schema.js";

const router = express.Router();

console.log("Institution routes loaded");

// Public search endpoint
router.get("/search", searchInstitutions);

router.post(
  "/profile",
  authMiddleware(["INSTITUTION"]),
  validate(createInstitutionProfileSchema),
  createInstitutionProfile,
);

router.get(
  "/profile",
  authMiddleware(["INSTITUTION"]),
  getMyInstitutionProfile,
);

export default router;
