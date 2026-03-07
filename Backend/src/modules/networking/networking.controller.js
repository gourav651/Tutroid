import prisma from "../../db.js";

export const sendRequest = async (req, res, next) => {
    try {
        const { userId: receiverId } = req.params;
        const senderId = req.user.id;

        if (senderId === receiverId) {
            return res.status(400).json({ success: false, message: "You cannot connect with yourself" });
        }

        // Check if connection already exists
        const existing = await prisma.connection.findFirst({
            where: {
                OR: [
                    { senderId, receiverId },
                    { senderId: receiverId, receiverId: senderId }
                ]
            },
            select: { id: true }, // Minimal selection
        });

        if (existing) {
            return res.status(400).json({ success: false, message: "Connection request already exists or you are already connected" });
        }

        const connection = await prisma.connection.create({
            data: {
                senderId,
                receiverId,
                status: "PENDING"
            },
            select: {
                id: true,
                status: true,
                createdAt: true,
            },
        });

        // Create notification asynchronously (non-blocking)
        setImmediate(async () => {
            try {
                await prisma.notification.create({
                    data: {
                        userId: receiverId,
                        type: "CONNECTION",
                        title: "New Connection Request",
                        message: "Someone wants to connect with you",
                        link: `/networking`,
                    },
                });
            } catch (error) {
                console.error('Notification creation error:', error);
            }
        });

        return res.status(201).json({ success: true, data: connection });
    } catch (error) {
        next(error);
    }
};

export const respondToRequest = async (req, res, next) => {
    try {
        const { requestId } = req.params;
        const { status } = req.body; // ACCEPTED or REJECTED
        const userId = req.user.id;

        const request = await prisma.connection.findUnique({
            where: { id: requestId }
        });

        if (!request || request.receiverId !== userId) {
            return res.status(404).json({ success: false, message: "Request not found" });
        }

        if (status === "ACCEPTED") {
            const updated = await prisma.connection.update({
                where: { id: requestId },
                data: { status: "ACCEPTED" }
            });
            return res.json({ success: true, data: updated });
        } else {
            await prisma.connection.delete({
                where: { id: requestId }
            });
            return res.json({ success: true, message: "Request rejected" });
        }
    } catch (error) {
        next(error);
    }
};

export const getNetwork = async (req, res, next) => {
    try {
        const userId = req.user.id;

        const connections = await prisma.connection.findMany({
            where: {
                OR: [
                    { senderId: userId, status: "ACCEPTED" },
                    { receiverId: userId, status: "ACCEPTED" }
                ]
            },
            select: {
                id: true,
                senderId: true,
                receiverId: true,
                sender: {
                    select: { 
                        id: true, 
                        firstName: true, 
                        lastName: true, 
                        role: true, 
                        profilePicture: true,
                        trainerProfile: {
                            select: { bio: true, location: true }
                        }, 
                        institutionProfile: {
                            select: { name: true, location: true }
                        }
                    }
                },
                receiver: {
                    select: { 
                        id: true, 
                        firstName: true, 
                        lastName: true, 
                        role: true, 
                        profilePicture: true,
                        trainerProfile: {
                            select: { bio: true, location: true }
                        }, 
                        institutionProfile: {
                            select: { name: true, location: true }
                        }
                    }
                }
            }
        });

        const network = connections.map(c => c.senderId === userId ? c.receiver : c.sender);

        res.json({ success: true, data: network });
    } catch (error) {
        next(error);
    }
};

export const getPendingRequests = async (req, res, next) => {
    try {
        const userId = req.user.id;

        const pending = await prisma.connection.findMany({
            where: { receiverId: userId, status: "PENDING" },
            include: {
                sender: {
                    select: { id: true, firstName: true, lastName: true, role: true }
                }
            }
        });

        res.json({ success: true, data: pending });
    } catch (error) {
        next(error);
    }
};

export const getSuggestions = async (req, res, next) => {
    try {
        const userId = req.user.id;

        // Suggest users who are not already connected or pending
        const connectedIds = (await prisma.connection.findMany({
            where: {
                OR: [{ senderId: userId }, { receiverId: userId }]
            },
            select: { senderId: true, receiverId: true }
        })).flatMap(c => [c.senderId, c.receiverId]);

        const suggestions = await prisma.user.findMany({
            where: {
                id: { notIn: [...connectedIds, userId] },
                isActive: true
            },
            take: 10,
            select: { id: true, firstName: true, lastName: true, role: true, trainerProfile: true, institutionProfile: true }
        });

        res.json({ success: true, data: suggestions });
    } catch (error) {
        next(error);
    }
};

export const removeConnection = async (req, res, next) => {
    try {
        const { userId: otherId } = req.params;
        const userId = req.user.id;

        await prisma.connection.deleteMany({
            where: {
                OR: [
                    { senderId: userId, receiverId: otherId },
                    { senderId: otherId, receiverId: userId }
                ]
            }
        });

        res.json({ success: true, message: "Connection removed" });
    } catch (error) {
        next(error);
    }
};
