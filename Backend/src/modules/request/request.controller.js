import {
  applyRequestService,
  respondToRequestService,
  markCompleteService,
} from "./request.service.js";

export const applyRequest = async (req, res, next) => {
  try {
    const result = await applyRequestService(
      req.user,
      req.validated.body.targetId,
    );

    return res.status(201).json({
      success: true,
      message: "Request processed successfully",
      data: result,
      meta: null,
    });
  } catch (error) {
    next(error);
  }
};

export const respondToRequest = async (req, res, next) => {
  try {
    const result = await respondToRequestService(
      req.user,
      req.params.id,
      req.validated.body.action,
    );

    return res.status(200).json({
      success: true,
      message: "Request updated successfully",
      data: result,
      meta: null,
    });
  } catch (error) {
    next(error);
  }
};

export const markComplete = async (req, res, next) => {
  try {
    const result = await markCompleteService(req.user, req.params.id);

    return res.status(200).json({
      success: true,
      message: "Completion updated",
      data: result,
      meta: null,
    });
  } catch (error) {
    next(error);
  }
};
