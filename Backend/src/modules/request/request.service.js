import client from "../../db.js";

const MAX_PENDING = 5;


/*       HELPER METHODS   */


const getTrainerProfileByUser = async (userId) => {
  const trainer = await client.trainerProfile.findUnique({
    where: { userId },
    select: { id: true, isActive: true },
  });

  if (!trainer) throw new Error("Trainer profile not found");
  if (!trainer.isActive) throw new Error("Trainer account is inactive");

  return trainer;
};

const getInstitutionProfileByUser = async (userId) => {
  const institution = await client.institutionProfile.findUnique({
    where: { userId },
    select: { id: true, isActive: true },
  });

  if (!institution) throw new Error("Institution profile not found");
  if (!institution.isActive) throw new Error("Institution account is inactive");

  return institution;
};


/*                               APPLY REQUEST                                */


export const applyRequestService = async (user, targetId) => {
  const { userId, role } = user;

  if (!["TRAINER", "INSTITUTION"].includes(role)) {
    throw new Error("Invalid role for request");
  }

  let trainerId;
  let institutionId;
  let initiatedBy;

  if (role === "INSTITUTION") {
    const institution = await getInstitutionProfileByUser(userId);

    const trainer = await client.trainerProfile.findUnique({
      where: { id: targetId },
      select: { id: true, isActive: true, verified: true },
    });

    if (!trainer || !trainer.isActive || !trainer.verified) {
      throw new Error("Trainer not available");
    }

    institutionId = institution.id;
    trainerId = trainer.id;
    initiatedBy = "INSTITUTION";
  } else {
    const trainer = await getTrainerProfileByUser(userId);

    const institution = await client.institutionProfile.findUnique({
      where: { id: targetId },
      select: { id: true, isActive: true },
    });

    if (!institution || !institution.isActive) {
      throw new Error("Institution not available");
    }

    trainerId = trainer.id;
    institutionId = institution.id;
    initiatedBy = "TRAINER";
  }

  /* --------------- Pending Limit Check ----------- */

  const pendingCount = await client.request.count({
    where:
      role === "INSTITUTION"
        ? { institutionId, status: "PENDING" }
        : { trainerId, status: "PENDING" },
  });

  if (pendingCount >= MAX_PENDING) {
    throw new Error("Pending request limit reached");
  }

  /* --------------------Existing Check -------------------- */

  const existing = await client.request.findUnique({
    where: {
      trainerId_institutionId: {
        trainerId,
        institutionId,
      },
    },
  });

  if (existing) {
    if (existing.status === "PENDING") {
      if (existing.initiatedBy !== initiatedBy) {
        // Mutual interest → auto accept
        return await client.request.update({
          where: { id: existing.id },
          data: { status: "ACCEPTED" },
        });
      }

      throw new Error("Request already pending");
    }

    if (existing.status === "COMPLETED") {
      throw new Error("Request already completed");
    }

    if (existing.status === "REJECTED") {
      // Reset state and re-initiate
      return await client.request.update({
        where: { id: existing.id },
        data: {
          status: "PENDING",
          initiatedBy,
          trainerMarkedComplete: false,
          institutionMarkedComplete: false,
        },
      });
    }
  }

  /* --------------------Create New------------------- */

  try {
    return await client.request.create({
      data: {
        trainerId,
        institutionId,
        initiatedBy,
      },
    });
  } catch (error) {
    if (error.code === "P2002") {
      throw new Error("Request already exists");
    }
    throw error;
  }
};

/*                           RESPOND TO REQUEST                               */


export const respondToRequestService = async (user, requestId, action) => {
  const { userId, role } = user;

  if (!["ACCEPTED", "REJECTED"].includes(action)) {
    throw new Error("Invalid action");
  }

  const request = await client.request.findUnique({
    where: { id: requestId },
  });

  if (!request) throw new Error("Request not found");
  if (request.status !== "PENDING") {
    throw new Error("Request is not pending");
  }

  let isResponder = false;

  if (role === "TRAINER") {
    const trainer = await getTrainerProfileByUser(userId);
    isResponder =
      trainer.id === request.trainerId &&
      request.initiatedBy !== "TRAINER";
  }

  if (role === "INSTITUTION") {
    const institution = await getInstitutionProfileByUser(userId);
    isResponder =
      institution.id === request.institutionId &&
      request.initiatedBy !== "INSTITUTION";
  }

  if (!isResponder) {
    throw new Error("Not authorized to respond to this request");
  }

  return await client.request.update({
    where: { id: requestId },
    data: { status: action },
  });
};

/*                             MARK COMPLETE                                  */


export const markCompleteService = async (user, requestId) => {
  const { userId, role } = user;

  const request = await client.request.findUnique({
    where: { id: requestId },
  });

  if (!request) throw new Error("Request not found");
  if (request.status !== "ACCEPTED") {
    throw new Error("Only accepted requests can be completed");
  }

  let updateData = {};

  if (role === "TRAINER") {
    const trainer = await getTrainerProfileByUser(userId);
    if (trainer.id !== request.trainerId) {
      throw new Error("Not authorized");
    }
    updateData.trainerMarkedComplete = true;
  }

  if (role === "INSTITUTION") {
    const institution = await getInstitutionProfileByUser(userId);
    if (institution.id !== request.institutionId) {
      throw new Error("Not authorized");
    }
    updateData.institutionMarkedComplete = true;
  }

  await client.request.update({
    where: { id: requestId },
    data: updateData,
  });

  const fresh = await client.request.findUnique({
    where: { id: requestId },
  });

  if (
    fresh.trainerMarkedComplete &&
    fresh.institutionMarkedComplete
  ) {
    return await client.request.update({
      where: { id: requestId },
      data: { status: "COMPLETED" },
    });
  }

  return fresh;
};