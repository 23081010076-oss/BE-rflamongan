import * as dashboardService from "../services/dashboard.service.js";

const handleError = (error, res, next) => {
  if (error.statusCode)
    return res.status(error.statusCode).json({ error: error.message });
  next(error);
};

export const getStats = async (req, res, next) => {
  try {
    const result = await dashboardService.getStats(req.query.tahun);
    res.json(result);
  } catch (error) {
    handleError(error, res, next);
  }
};

export const getChartData = async (req, res, next) => {
  try {
    const result = await dashboardService.getChartData(req.query.tahun);
    res.json(result);
  } catch (error) {
    handleError(error, res, next);
  }
};

export const getRecentUpdates = async (req, res, next) => {
  try {
    const result = await dashboardService.getRecentUpdates(req.query.limit);
    res.json(result);
  } catch (error) {
    handleError(error, res, next);
  }
};
