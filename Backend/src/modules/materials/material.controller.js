import {
  uploadMaterialService,
  getTrainerMaterialsService,
} from "./material.service.js";

export const uploadMaterial = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const file = req.file;
    const { title } = req.body;

    const material = await uploadMaterialService(
      userId,
      file,
      title
    );

    res.status(201).json({
      success: true,
      message: "Material uploaded successfully",
      data: material,
    });
  } catch (error) {
    next(error);
  }
};

export const getTrainerMaterials = async (req, res, next) => {
  try {
    const { trainerId } = req.params;

    const materials = await getTrainerMaterialsService(trainerId);

    res.status(200).json({
      success: true,
      data: materials,
    });
  } catch (error) {
    next(error);
  }
};