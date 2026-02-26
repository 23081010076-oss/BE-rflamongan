import * as opdService from "../services/opd.service.js";

const handleError = (error, res, next) => {
  if (error.statusCode)
    return res.status(error.statusCode).json({ error: error.message });
  next(error);
};

export const getAllOpd = async (req, res, next) => {
  try {
    const result = await opdService.getAllOpd(req.query);
    res.json(result);
  } catch (error) {
    handleError(error, res, next);
  }
};

export const getOpdById = async (req, res, next) => {
  try {
    const result = await opdService.getOpdById(req.params.id);
    res.json(result);
  } catch (error) {
    handleError(error, res, next);
  }
};

export const createOpd = async (req, res, next) => {
  try {
    const result = await opdService.createOpd(req.body, req.user.id);
    res.status(201).json(result);
  } catch (error) {
    handleError(error, res, next);
  }
};

export const updateOpd = async (req, res, next) => {
  try {
    const result = await opdService.updateOpd(
      req.params.id,
      req.body,
      req.user.id,
    );
    res.json(result);
  } catch (error) {
    handleError(error, res, next);
  }
};

export const deleteOpd = async (req, res, next) => {
  try {
    const result = await opdService.deleteOpd(req.params.id);
    res.json(result);
  } catch (error) {
    handleError(error, res, next);
  }
};

export const toggleOpdStatus = async (req, res, next) => {
  try {
    const result = await opdService.toggleOpdStatus(req.params.id, req.user.id);
    res.json(result);
  } catch (error) {
    handleError(error, res, next);
  }
};
