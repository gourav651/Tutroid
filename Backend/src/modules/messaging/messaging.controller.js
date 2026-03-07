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

    // UPDATED: Allow TRAINER-INSTITUTION and TRAINER-TRAINER messaging
    const allowedCombinations = [
      { user: "TRAINER", participant: "INSTITUTION" },
      { user: "INSTITUTION", participant: "TRAINER" },
      { user: "TRAINER", participant: "TRAINER" }, // NEW: Trainer to Trainer
    ];

    const isAllowed = allowedCombinations.some(
      (combo) =>
        combo.user === userRole && combo.participant === participant.role,
    );

    if (!isAllowed) {
      return res.status(403).json({
        success: false,
        message: "Messaging is only allowed between trainers and institutions, or between trainers",
      });
    }

    // Find if conversation already exists between these two
    const existing = await prisma.conversation.findFirst({
      where: {
        AND: [
          { participants: { some: { id: userId } } },
          { participants: { some: { id: participantId } } },
        ],
      },
      select: {
        id: true,
        createdAt: true,
        updatedAt: true,
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
      select: {
        id: true,
        createdAt: true,
        updatedAt: true,
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
    const { limit = 20 } = req.query; // Reduced default limit

    const conversations = await prisma.conversation.findMany({
      where: {
        participants: { some: { id: userId } },
      },
      select: {
        id: true,
        createdAt: true,
        updatedAt: true,
        participants: {
          where: { id: { not: userId } },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
            profilePicture: true,
            // Only include essential profile data
            institutionProfile: {
              select: { name: true },
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

    // Cache conversations list for 1 minute
    res.set('Cache-Control', 'private, max-age=60');
    res.json({ success: true, data: conversations });
  } catch (error) {
    next(error);
  }
};

export const sendMessage = async (req, res, next) => {
  try {
    const { conversationId, content } = req.body;
    const senderId = req.user.id;

    // Optimized: Verify participant and create message in parallel
    const [conversation, message] = await Promise.all([
      prisma.conversation.findFirst({
        where: {
          id: conversationId,
          participants: { some: { id: senderId } },
        },
        select: {
          id: true,
          participants: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              role: true,
            },
          },
        },
      }),
      // Create message immediately (optimistic)
      prisma.message.create({
        data: {
          conversationId,
          senderId,
          content,
        },
        select: {
          id: true,
          conversationId: true,
          senderId: true, // Include senderId for frontend alignment
          content: true,
          createdAt: true,
          isRead: true,
          sender: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              profilePicture: true,
            },
          },
        },
      }),
    ]);

    if (!conversation) {
      // Rollback: delete the message if not authorized
      await prisma.message.delete({ where: { id: message.id } });
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    // Update conversation timestamp and send notifications asynchronously (non-blocking)
    setImmediate(async () => {
      try {
        await prisma.conversation.update({
          where: { id: conversationId },
          data: { updatedAt: new Date() },
        });

        // Emit real-time message via Socket.io
        const participantIds = conversation.participants.map((p) => p.id);
        emitNewMessage(conversationId, message, participantIds);

        // Send notifications to other participants
        const otherParticipants = conversation.participants.filter(
          (p) => p.id !== senderId,
        );
        
        // Batch create notifications
        if (otherParticipants.length > 0) {
          const notifications = await prisma.notification.createMany({
            data: otherParticipants.map(participant => ({
              userId: participant.id,
              type: "MESSAGE",
              title: "New Message",
              message: `${req.user.firstName || "Someone"} sent you a message`,
              link: `/messages?userId=${senderId}`,
            })),
          });

          // Emit notifications
          otherParticipants.forEach(participant => {
            emitNotification(participant.id, {
              type: "MESSAGE",
              title: "New Message",
              message: `${req.user.firstName || "Someone"} sent you a message`,
            });
          });
        }
      } catch (error) {
        console.error('Background notification error:', error);
      }
    });

    // Return immediately without waiting for notifications
    res.status(201).json({ success: true, data: message });
  } catch (error) {
    next(error);
  }
};;

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
      select: {
        id: true,
        conversationId: true,
        senderId: true, // Include senderId for frontend alignment
        content: true,
        createdAt: true,
        isRead: true,
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

// Get all available users for messaging (trainers can message trainers and institutions)
export const getAvailableUsers = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    // Determine which roles the current user can message
    let allowedRoles = [];
    if (userRole === "TRAINER") {
      allowedRoles = ["INSTITUTION", "TRAINER"]; // Trainers can message both
    } else if (userRole === "INSTITUTION") {
      allowedRoles = ["TRAINER"];
    } else {
      return res.json({ success: true, data: [] }); // Students can't message anyone
    }

    // Get all users with allowed roles, excluding self
    // Optimized with minimal data selection
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
            bio: true,
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
