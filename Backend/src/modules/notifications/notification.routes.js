import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware.js";
import { 
    getNotifications, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification 
} from "./notification.controller.js";

const router = Router();

router.get("/", authenticate, getNotifications);
router.patch("/:notificationId/read", authenticate, markAsRead);
router.patch("/read-all", authenticate, markAllAsRead);
router.delete("/:notificationId", authenticate, deleteNotification);

export default router;
