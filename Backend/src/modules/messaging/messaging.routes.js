import express from "express";
import * as messagingController from "./messaging.controller.js";
import { authenticate } from "../../middleware/auth.middleware.js";

const router = express.Router();

router.use(authenticate);

router.post("/conversation", messagingController.getOrCreateConversation);
router.get("/conversations", messagingController.getConversations);
router.get("/available-users", messagingController.getAvailableUsers);
router.post("/send", messagingController.sendMessage);
router.get("/:conversationId/messages", messagingController.getMessages);
router.patch("/read/:conversationId", messagingController.markAsRead);

export default router;
