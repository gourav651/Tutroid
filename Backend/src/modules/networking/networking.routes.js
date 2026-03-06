import express from "express";
import * as networkingController from "./networking.controller.js";
import { expressHireInterest } from "./hire.controller.js";
import { authenticate } from "../../middleware/auth.middleware.js";

const router = express.Router();

router.use(authenticate);

router.post("/connect/:userId", networkingController.sendRequest);
router.post("/respond/:requestId", networkingController.respondToRequest);
router.get("/my-network", networkingController.getNetwork);
router.get("/pending", networkingController.getPendingRequests);
router.get("/suggestions", networkingController.getSuggestions);
router.delete("/remove/:userId", networkingController.removeConnection);
router.post("/hire-interest/:trainerId", expressHireInterest);

export default router;
