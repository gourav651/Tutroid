import prisma from "../../db.js";

export const getNotifications = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { limit = 20, page = 1 } = req.query;

        // Parallel queries for better performance
        const [notifications, unreadCount] = await Promise.all([
            prisma.notification.findMany({
                where: { userId },
                select: {
                    id: true,
                    type: true,
                    title: true,
                    message: true,
                    link: true,
                    isRead: true,
                    createdAt: true,
                },
                orderBy: { createdAt: "desc" },
                take: parseInt(limit),
                skip: (parseInt(page) - 1) * parseInt(limit)
            }),
            prisma.notification.count({
                where: { userId, isRead: false }
            })
        ]);

        res.json({ 
            success: true, 
            data: notifications,
            unreadCount 
        });
    } catch (error) {
        next(error);
    }
};

export const markAsRead = async (req, res, next) => {
    try {
        const { notificationId } = req.params;
        const userId = req.user.id;

        await prisma.notification.updateMany({
            where: { 
                id: notificationId,
                userId 
            },
            data: { isRead: true }
        });

        res.json({ success: true });
    } catch (error) {
        next(error);
    }
};

export const markAllAsRead = async (req, res, next) => {
    try {
        const userId = req.user.id;

        await prisma.notification.updateMany({
            where: { userId, isRead: false },
            data: { isRead: true }
        });

        res.json({ success: true });
    } catch (error) {
        next(error);
    }
};

export const deleteNotification = async (req, res, next) => {
    try {
        const { notificationId } = req.params;
        const userId = req.user.id;

        await prisma.notification.deleteMany({
            where: { 
                id: notificationId,
                userId 
            }
        });

        res.json({ success: true });
    } catch (error) {
        next(error);
    }
};
