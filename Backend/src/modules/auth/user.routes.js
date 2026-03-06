import express from "express";
import client from "../../db.js";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import { getProfileSummary } from "./profileSummary.controller.js";

const router = express.Router();

// Profile summary endpoint - must come before /profile/:identifier
router.get("/profile-summary", authMiddleware(), getProfileSummary);

router.get("/profile", authMiddleware(), async (req, res) => {
    try {
        const user = await client.user.findUnique({
            where: { id: req.user.id },
            include: {
                trainerProfile: true,
                institutionProfile: true,
                studentProfile: true,
                education: true,
                experience: true
            }
        });

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        res.json({ success: true, data: user });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.get("/profile/:identifier", authMiddleware(), async (req, res) => {
    try {
        const { identifier } = req.params;
        
        // Check if identifier is a UUID or username
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);
        
        const user = await client.user.findUnique({
            where: isUUID ? { id: identifier } : { username: identifier },
            include: {
                trainerProfile: true,
                institutionProfile: true,
                studentProfile: true,
                education: true,
                experience: true
            }
        });

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        res.json({ success: true, data: user });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.put("/profile", authMiddleware(), async (req, res) => {
    try {
        const userId = req.user.id;
        const {
            firstName, lastName, profilePicture, coverImage, bio, headline, location,
            skills, experience, education
        } = req.body;

        // Validate that profilePicture and coverImage are not base64 data URLs
        if (profilePicture && profilePicture.startsWith('data:')) {
            return res.status(400).json({ 
                success: false, 
                message: "Profile picture must be uploaded to cloud storage first. Please use the file upload feature." 
            });
        }
        if (coverImage && coverImage.startsWith('data:')) {
            return res.status(400).json({ 
                success: false, 
                message: "Cover image must be uploaded to cloud storage first. Please use the file upload feature." 
            });
        }

        // Update user basic info
        const updatedUser = await client.user.update({
            where: { id: userId },
            data: {
                firstName,
                lastName,
                profilePicture,
                coverImage,
                bio,
                headline,
                location
            }
        });

        // Handle experience updates
        if (experience && Array.isArray(experience)) {
            // Delete existing experience
            await client.experience.deleteMany({
                where: { userId }
            });

            // Create new experience entries
            if (experience.length > 0) {
                await client.experience.createMany({
                    data: experience.map(exp => ({
                        userId,
                        title: exp.title,
                        company: exp.company,
                        location: exp.location || null,
                        startDate: exp.startDate ? new Date(exp.startDate) : null,
                        endDate: exp.endDate ? new Date(exp.endDate) : null,
                        isCurrent: exp.isCurrent || false,
                        description: exp.description || null
                    }))
                });
            }
        }

        // Handle education updates
        if (education && Array.isArray(education)) {
            // Delete existing education
            await client.education.deleteMany({
                where: { userId }
            });

            // Create new education entries
            if (education.length > 0) {
                await client.education.createMany({
                    data: education.map(edu => ({
                        userId,
                        school: edu.school,
                        degree: edu.degree || null,
                        fieldOfStudy: edu.fieldOfStudy || null,
                        startDate: edu.startDate ? new Date(edu.startDate) : null,
                        endDate: edu.endDate ? new Date(edu.endDate) : null,
                        description: edu.description || null
                    }))
                });
            }
        }

        // Handle role specific profile updates
        if (req.user.role === "TRAINER") {
            await client.trainerProfile.upsert({
                where: { userId },
                update: { bio, location, skills: skills || [] },
                create: { userId, bio, location, skills: skills || [], experience: 0 }
            });
        } else if (req.user.role === "STUDENT") {
            await client.studentProfile.upsert({
                where: { userId },
                update: { bio, location },
                create: { userId, bio, location }
            });
        } else if (req.user.role === "INSTITUTION") {
            await client.institutionProfile.upsert({
                where: { userId },
                update: { 
                    name: firstName || "Institution",
                    location: location || "Not specified" 
                },
                create: { 
                    userId, 
                    name: firstName || "Institution", 
                    location: location || "Not specified" 
                }
            });
        }

        // Fetch updated user with all relations
        const completeUser = await client.user.findUnique({
            where: { id: userId },
            include: {
                trainerProfile: true,
                institutionProfile: true,
                studentProfile: true,
                education: true,
                experience: true
            }
        });

        res.json({ success: true, data: completeUser });
    } catch (error) {
        console.error("Profile update error:", error);
        
        // Handle specific Prisma errors
        if (error.code === 'P2025') {
            return res.status(404).json({ 
                success: false, 
                message: "User account not found. Please log out and create a new account.",
                code: "USER_NOT_FOUND"
            });
        }
        
        res.status(500).json({ success: false, message: error.message });
    }
});

router.get("/search", authMiddleware(), async (req, res) => {
    try {
        const { query, role, location } = req.query;

        // Simple search across names and roles
        const users = await client.user.findMany({
            where: {
                AND: [
                    query ? {
                        OR: [
                            { firstName: { contains: query, mode: "insensitive" } },
                            { lastName: { contains: query, mode: "insensitive" } },
                            { email: { contains: query, mode: "insensitive" } },
                            { headline: { contains: query, mode: "insensitive" } },
                        ],
                    } : {},
                    role ? { role } : {},
                    location ? { location: { contains: location, mode: "insensitive" } } : {},
                    { NOT: { id: req.user.id } }, // Don't include self
                ],
            },
            include: {
                trainerProfile: true,
                institutionProfile: true,
                studentProfile: true,
            },
            take: 20,
        });

        res.json({ success: true, data: users });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

export default router;
