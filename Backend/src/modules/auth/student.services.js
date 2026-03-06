import client from "../../db.js";

export const getStudentProfileService = async (userId) => {
    const profile = await client.user.findUnique({
        where: { id: userId },
        include: {
            studentProfile: true,
            education: true,
            experience: true,
        },
    });

    if (!profile) throw new Error("Student not found");
    return profile;
};

export const updateStudentProfileService = async (userId, data) => {
    const { bio, location, education, experience, ...userData } = data;

    return await client.$transaction(async (tx) => {
        // Update basic user info
        const updatedUser = await tx.user.update({
            where: { id: userId },
            data: {
                firstName: userData.firstName,
                lastName: userData.lastName,
                profilePicture: userData.profilePicture,
                headline: userData.headline,
                bio: userData.bio,
                location: userData.location
            },
        });

        // Update or create student profile
        await tx.studentProfile.upsert({
            where: { userId },
            create: { userId, bio, location },
            update: { bio, location },
        });

        // Handle education and experience if provided (simple version: replace all)
        if (education) {
            await tx.education.deleteMany({ where: { userId } });
            await tx.education.createMany({
                data: education.map(edu => ({ ...edu, userId }))
            });
        }

        if (experience) {
            await tx.experience.deleteMany({ where: { userId } });
            await tx.experience.createMany({
                data: experience.map(exp => ({ ...exp, userId }))
            });
        }

        return updatedUser;
    });
};
