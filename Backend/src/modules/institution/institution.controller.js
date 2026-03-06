import {
  createInstitutionProfileService,
  getMyInstitutionProfileService,
  searchInstitutionsService,
} from "./institution.services.js";

export const createInstitutionProfile = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    const profile = await createInstitutionProfileService(
      userId,
      req.validated.body,
    );

    return res.status(201).json({
      success: true,
      message: "Institution profile created successfully",
      data: profile,
    });
  } catch (err) {
    next(err);
  }
};

export const getMyInstitutionProfile = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    const profile = await getMyInstitutionProfileService(userId);

    return res.status(200).json({
      success: true,
      message: "Institution profile fetched successfully",
      data: profile,
    });
  } catch (err) {
    next(err);
  }
};

export const searchInstitutions = async (req, res, next) => {
  try {
    const filters = req.query;
    const result = await searchInstitutionsService(filters);

    return res.status(200).json({
      success: true,
      message: "Institutions fetched successfully",
      data: result.institutions,
      pagination: result.pagination,
    });
  } catch (err) {
    next(err);
  }
};
