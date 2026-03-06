import { getPublicTrainerProfileService } from "./publicProfileServices.js";

export const getPublicTrainerProfile = async (req, res, next) => {
  try {
    const { id } = req.params;

    const profile = await getPublicTrainerProfileService(id);

    return res.status(200).json({
      success: true,
      message: "Trainer profile fetched successfully",
      data: profile,
      meta: null,
    });
  } catch (error) {
    next(error);
  }
};
