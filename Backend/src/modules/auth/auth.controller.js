import { signupService, loginService } from "./auth.service.js";

// ================= SIGNUP =================
export const signup = async (req, res, next) => {
  try {
    const { token, user } = await signupService(req.body || {});

    res.status(201).json({
      success: true,
      message: "User created successfully",
      data: {
        token,
        user,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ================= LOGIN =================
export const login = async (req, res, next) => {
  try {
    const { token, user } = await loginService(req.validated?.body || req.body);

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        token,
        user,
      },
    });
  } catch (err) {
    next(err);
  }
};
