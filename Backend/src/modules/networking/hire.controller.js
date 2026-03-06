import prisma from "../../db.js";
import { AppError } from "../../utils/AppError.js";

/**
 * POST /networking/hire-interest/:trainerId
 * Institution expresses interest in hiring a trainer
 */
export const expressHireInterest = async (req, res, next) => {
    try {
        const institutionId = req.user.id;
        const { trainerId } = req.params;

        // Verify the requester is an institution
        if (req.user.role !== "INSTITUTION") {
            throw new AppError("Only institutions can express hire interest", 403);
        }

        // Verify the target is a trainer
        const trainer = await prisma.user.findUnique({
            where: { id: trainerId },
            include: { trainerProfile: true }
        });

        if (!trainer || trainer.role !== "TRAINER") {
            throw new AppError("Trainer not found", 404);
        }

        // Get institution details
        const institution = await prisma.user.findUnique({
            where: { id: institutionId },
            include: { institutionProfile: true }
        });

        const institutionName = institution.firstName || 
                               institution.institutionProfile?.name || 
                               "An institution";

        // Create notification for the trainer
        await prisma.notification.create({
            data: {
                userId: trainerId,
                type: "HIRE_INTEREST",
                title: "Hiring Interest",
                message: `${institutionName} is interested in hiring you for a training opportunity`,
                link: `/profile/${institution.username || institutionId}`
            }
        });

        res.json({ 
            success: true, 
            message: "Hire interest notification sent successfully" 
        });
    } catch (error) {
        next(error);
    }
};
