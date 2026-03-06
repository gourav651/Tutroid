import prisma from "../../db.js";
import { emitNewMessage, emitNotification } from "../../socket/socket.js";

export const getOrCreateConversation = async (req, res, next) => {
  try {
    const { participantId } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    if (userId === participantId) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Cannot start conversation with yourself",
        });
    }

    // Get participant details to check role
    const participant = await prisma.user.findUnique({
      where: { id: participantId },
      select: { id: true, role: true, firstName: true, lastName: true },
    });

    if (!participant) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // ROLE RESTRICTION: Only TRAINER-INSTITUTION messaging allowed
    const allowedCombinations = [
      { user: "TRAINER", participant: "INSTITUTION" },
      { user: "INSTITUTION", participant: "TRAINER" },
    ];

    const isAllowed = allowedCombinations.some(
      (combo) =>
        combo.user === userRole && combo.participant === participant.role,
    );

    if (!isAllowed) {
      return res.status(403).json({
        success: false,
        message: "Messaging is only allowed between trainers and institutions",
      });
    }

    // REMOVED CONNECTION CHECK - All trainers and institutions can message each other

    // Find if conversation already exists between these two
    const existing = await prisma.conversation.findFirst({
      where: {
        AND: [
          { participants: { some: { id: userId } } },
          { participants: { some: { id: participantId } } },
        ],
      },
      include: {
        participants: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
            profilePicture: true,
            institutionProfile: {
              select: { name: true, location: true },
            },
          },
        },
      },
    });

    if (existing) {
      return res.json({ success: true, data: existing });
    }

    const conversation = await prisma.conversation.create({
      data: {
        participants: {
          connect: [{ id: userId }, { id: participantId }],
        },
      },
      include: {
        participants: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
            profilePicture: true,
            institutionProfile: {
              select: { name: true, location: true },
            },
          },
        },
      },
    });

    res.status(201).json({ success: true, data: conversation });
  } catch (error) {
    next(error);
  }
};

export const getConversations = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { limit = 50 } = req.query; // Add limit for performance

    const conversations = await prisma.conversation.findMany({
      where: {
        participants: { some: { id: userId } },
      },
      include: {
        participants: {
          where: { id: { not: userId } },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
            profilePicture: true,
            institutionProfile: {
              select: { name: true, location: true },
            },
          },
        },
        messages: {
          take: 1,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            content: true,
            createdAt: true,
            senderId: true,
          },
        },
        _count: {
          select: {
            messages: {
              where: {
                senderId: { not: userId },
                isRead: false,
              },
            },
          },
        },
      },
      orderBy: { updatedAt: "desc" },
      take: parseInt(limit),
    });

    res.json({ success: true, data: conversations });
  } catch (error) {
    next(error);
  }
};

export const sendMessage = async (req, res, next) => {
  try {
    const { conversationId, content } = req.body;
    const senderId = req.user.id;

    // Verify user is participant
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        participants: { some: { id: senderId } },
      },
      include: {
        participants: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
            institutionProfile: {
              select: { name: true },
            },
          },
        },
      },
    });

    if (!conversation) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    const message = await prisma.message.create({
      data: {
        conversationId,
        senderId,
        content,
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profilePicture: true,
          },
        },
      },
    });

    // Update conversation timestamp
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    // Emit real-time message via Socket.io
    // include all participants so even the sender (or others who haven't joined yet)
    // will receive an update through their personal room
    const participantIds = conversation.participants.map((p) => p.id);
    emitNewMessage(conversationId, message, participantIds);

    // Send notification to other participants
    const otherParticipants = conversation.participants.filter(
      (p) => p.id !== senderId,
    );
    for (const participant of otherParticipants) {
      const notification = await prisma.notification.create({
        data: {
          userId: participant.id,
          type: "MESSAGE",
          title: "New Message",
          message: `${req.user.firstName || "Someone"} sent you a message`,
          link: `/messages?userId=${senderId}`,
        },
      });
      emitNotification(participant.id, notification);
    }

    res.status(201).json({ success: true, data: message });
  } catch (error) {
    next(error);
  }
};

export const getMessages = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;
    const { limit = 50, before } = req.query; // Add pagination support

    // Verify user is participant
    const conv = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        participants: { some: { id: userId } },
      },
    });

    if (!conv) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    // Build query with optional cursor-based pagination
    const whereClause = { conversationId };
    if (before) {
      whereClause.createdAt = { lt: new Date(before) };
    }

    const messages = await prisma.message.findMany({
      where: whereClause,
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profilePicture: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: parseInt(limit),
    });

    // Reverse to get chronological order
    const chronologicalMessages = messages.reverse();

    res.json({ success: true, data: chronologicalMessages });
  } catch (error) {
    next(error);
  }
};

export const markAsRead = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;

    await prisma.message.updateMany({
      where: {
        conversationId,
        senderId: { not: userId },
        isRead: false,
      },
      data: { isRead: true },
    });

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

// Get all available users for messaging (trainers and institutions only)
export const getAvailableUsers = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    // Determine which roles the current user can message
    let allowedRoles = [];
    if (userRole === "TRAINER") {
      allowedRoles = ["INSTITUTION"];
    } else if (userRole === "INSTITUTION") {
      allowedRoles = ["TRAINER"];
    } else {
      return res.json({ success: true, data: [] }); // Students can't message anyone
    }

    // Get all users with allowed roles, excluding self
    // Limit to 100 users for performance
    const users = await prisma.user.findMany({
      where: {
        role: { in: allowedRoles },
        id: { not: userId },
        isActive: true,
        isBanned: false,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        role: true,
        profilePicture: true,
        trainerProfile: {
          select: {
            location: true,
          },
        },
        institutionProfile: {
          select: {
            name: true,
            location: true,
          },
        },
      },
      orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
      take: 100, // Limit results for performance
    });

    res.json({ success: true, data: users });
  } catch (error) {
    next(error);
  }
};
