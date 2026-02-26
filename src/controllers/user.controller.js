import * as userService from "../services/user.service.js";

const handleError = (error, res, next) => {
  if (error.statusCode)
    return res.status(error.statusCode).json({ error: error.message });
  next(error);
};

export const getAllUsers = async (req, res, next) => {
  try {
    const result = await userService.getAllUsers(req.query);
    res.json(result);
  } catch (error) {
    handleError(error, res, next);
  }
};

export const getUserById = async (req, res, next) => {
  try {
    const result = await userService.getUserById(req.params.id);
    res.json(result);
  } catch (error) {
    handleError(error, res, next);
  }
};

export const createUser = async (req, res, next) => {
  try {
    const result = await userService.createUser(req.body, req.user.id);
    res.status(201).json(result);
  } catch (error) {
    handleError(error, res, next);
  }
};

export const updateUser = async (req, res, next) => {
  try {
    const result = await userService.updateUser(
      req.params.id,
      req.body,
      req.user.id,
    );
    res.json(result);
  } catch (error) {
    handleError(error, res, next);
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    const result = await userService.deleteUser(req.params.id, req.user.id);
    res.json(result);
  } catch (error) {
    handleError(error, res, next);
  }
};

export const toggleUserStatus = async (req, res, next) => {
  try {
    const result = await userService.toggleUserStatus(
      req.params.id,
      req.user.id,
    );
    res.json(result);
  } catch (error) {
    handleError(error, res, next);
  }
};
