import * as authService from "../services/auth.service.js";

const handleError = (error, res, next) => {
  if (error.statusCode)
    return res.status(error.statusCode).json({ error: error.message });
  next(error);
};

export const login = async (req, res, next) => {
  try {
    const result = await authService.loginUser(req.body, req.ip);
    res.json(result);
  } catch (error) {
    handleError(error, res, next);
  }
};

export const register = async (req, res, next) => {
  try {
    const result = await authService.registerUser(req.body);
    res.status(201).json(result);
  } catch (error) {
    handleError(error, res, next);
  }
};

export const getMe = async (req, res, next) => {
  try {
    const result = await authService.getMe(req.user.id);
    res.json(result);
  } catch (error) {
    handleError(error, res, next);
  }
};

export const changePassword = async (req, res, next) => {
  try {
    const result = await authService.changePassword(req.user.id, req.body);
    res.json(result);
  } catch (error) {
    handleError(error, res, next);
  }
};
