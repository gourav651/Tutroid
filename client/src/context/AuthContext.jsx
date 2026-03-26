import React, { createContext, useContext, useReducer } from "react";
import ApiService from "../services/api";

const AuthContext = createContext();

const AUTH_ACTIONS = {
  LOGIN_START: "LOGIN_START",
  LOGIN_SUCCESS: "LOGIN_SUCCESS",
  LOGIN_FAILURE: "LOGIN_FAILURE",
  SIGNUP_START: "SIGNUP_START",
  SIGNUP_SUCCESS: "SIGNUP_SUCCESS",
  SIGNUP_FAILURE: "SIGNUP_FAILURE",
  LOGOUT: "LOGOUT",
  CLEAR_ERROR: "CLEAR_ERROR",
  UPDATE_PROFILE_START: "UPDATE_PROFILE_START",
  UPDATE_PROFILE_SUCCESS: "UPDATE_PROFILE_SUCCESS",
  UPDATE_PROFILE_FAILURE: "UPDATE_PROFILE_FAILURE",
  SYNC_PROFILE_DATA: "SYNC_PROFILE_DATA",
};

const storedToken = localStorage.getItem("token");
const storedUserRaw = localStorage.getItem("user");

let parsedUser = null;

try {
  parsedUser =
    storedUserRaw && storedUserRaw !== "undefined"
      ? JSON.parse(storedUserRaw)
      : null;
} catch {
  parsedUser = null;
  localStorage.removeItem("user");
}

const initialState = {
  user: parsedUser,
  token: storedToken || null,
  isAuthenticated: !!storedToken,
  loading: false,
  error: null,
};

const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH_ACTIONS.LOGIN_START:
    case AUTH_ACTIONS.SIGNUP_START:
      return {
        ...state,
        loading: true,
        error: null,
      };

    case AUTH_ACTIONS.LOGIN_SUCCESS:
    case AUTH_ACTIONS.SIGNUP_SUCCESS:
      localStorage.setItem("token", action.payload.token);
      localStorage.setItem("user", JSON.stringify(action.payload.user));

      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        loading: false,
        error: null,
      };

    case AUTH_ACTIONS.LOGIN_FAILURE:
    case AUTH_ACTIONS.SIGNUP_FAILURE:
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
        error: action.payload,
      };

    case AUTH_ACTIONS.LOGOUT:
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      return {
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
        error: null,
      };

    case AUTH_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null,
      };

    case AUTH_ACTIONS.UPDATE_PROFILE_START:
      return {
        ...state,
        loading: true,
        error: null,
      };

    case AUTH_ACTIONS.UPDATE_PROFILE_SUCCESS:
      localStorage.setItem("user", JSON.stringify(action.payload));
      return {
        ...state,
        user: action.payload,
        loading: false,
        error: null,
      };

    case AUTH_ACTIONS.UPDATE_PROFILE_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload,
      };

    case AUTH_ACTIONS.SYNC_PROFILE_DATA:
      const syncedUser = {
        ...state.user,
        ...action.payload,
      };
      localStorage.setItem("user", JSON.stringify(syncedUser));
      return {
        ...state,
        user: syncedUser,
      };

    default:
      return state;
  }
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  const login = async (credentials) => {
    dispatch({ type: AUTH_ACTIONS.LOGIN_START });

    try {
      const response = await ApiService.login(credentials);

      dispatch({
        type: AUTH_ACTIONS.LOGIN_SUCCESS,
        payload: response.data,
      });

      return response;
    } catch (error) {
      dispatch({
        type: AUTH_ACTIONS.LOGIN_FAILURE,
        payload: error.message || "Login failed",
      });
      throw error;
    }
  };

  const signup = async (userData) => {
    dispatch({ type: AUTH_ACTIONS.SIGNUP_START });

    try {
      const response = await ApiService.signup(userData);

      if (response.success && response.requiresVerification) {
        dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
        return response;
      }

      if (response.success && response.data?.token) {
        dispatch({
          type: AUTH_ACTIONS.SIGNUP_SUCCESS,
          payload: response.data,
        });
      }

      return response;
    } catch (error) {
      dispatch({
        type: AUTH_ACTIONS.SIGNUP_FAILURE,
        payload: error.message || "Signup failed",
      });
      throw error;
    }
  };

  const logout = () => {
    dispatch({ type: AUTH_ACTIONS.LOGOUT });
  };

  const clearError = () => {
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
  };

  const updateProfile = async (profileData) => {
    dispatch({ type: AUTH_ACTIONS.UPDATE_PROFILE_START });

    try {
      const response = await ApiService.updateGeneralProfile(profileData);

      const updatedUser = {
        ...state.user,
        ...response.data,
      };

      dispatch({
        type: AUTH_ACTIONS.UPDATE_PROFILE_SUCCESS,
        payload: updatedUser,
      });

      return response;
    } catch (error) {
      dispatch({
        type: AUTH_ACTIONS.UPDATE_PROFILE_FAILURE,
        payload: error.message || "Profile update failed",
      });
      throw error;
    }
  };

  const syncProfileData = (profileData) => {
    dispatch({
      type: AUTH_ACTIONS.SYNC_PROFILE_DATA,
      payload: profileData,
    });
  };


  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        signup,
        logout,
        clearError,
        updateProfile,
        syncProfileData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export { AUTH_ACTIONS };
