import * as paketService from "../services/paket.service.js";

const handleError = (error, res, next) => {
  if (error.statusCode)
    return res.status(error.statusCode).json({ error: error.message });
  next(error);
};

export const getAllPaket = async (req, res, next) => {
  try {
    const result = await paketService.getAll({
      ...req.query,
      userRole: req.user?.role,
      userOpdId: req.user?.opdId,
    });
    res.json(result);
  } catch (error) {
    handleError(error, res, next);
  }
};

export const getPaketById = async (req, res, next) => {
  try {
    const result = await paketService.getById(
      req.params.id,
      req.user?.role,
      req.user?.opdId,
    );
    res.json(result);
  } catch (error) {
    handleError(error, res, next);
  }
};

export const createPaket = async (req, res, next) => {
  try {
    const result = await paketService.create(
      req.body,
      req.user?.role,
      req.user?.opdId,
      req.user?.id,
    );
    res.status(201).json(result);
  } catch (error) {
    handleError(error, res, next);
  }
};

export const updatePaket = async (req, res, next) => {
  try {
    const result = await paketService.update(
      req.params.id,
      req.body,
      req.user?.role,
      req.user?.opdId,
      req.user?.id,
    );
    res.json(result);
  } catch (error) {
    handleError(error, res, next);
  }
};

export const deletePaket = async (req, res, next) => {
  try {
    const result = await paketService.remove(
      req.params.id,
      req.user?.role,
      req.user?.id,
    );
    res.json(result);
  } catch (error) {
    handleError(error, res, next);
  }
};

export const updatePaketStatus = async (req, res, next) => {
  try {
    const result = await paketService.updateStatus(
      req.params.id,
      req.body.status,
      req.user?.role,
      req.user?.opdId,
      req.user?.id,
    );
    res.json(result);
  } catch (error) {
    handleError(error, res, next);
  }
};

export const updateProgress = async (req, res, next) => {
  try {
    const result = await paketService.updateProgress(
      req.params.id,
      req.body,
      req.user?.role,
      req.user?.opdId,
    );
    res.json(result);
  } catch (error) {
    handleError(error, res, next);
  }
};
