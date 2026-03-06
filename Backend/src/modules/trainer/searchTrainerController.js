import { searchTrainersService } from "./searchTrainerService";

export const searchTrainerController = async (req, res, next) => {
  try {
    const result = await searchTrainersService(req.query);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
