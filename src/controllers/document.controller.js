import * as paketService from "../services/paket.service.js";

const handleError = (error, res, next) => {
  if (error.statusCode)
    return res.status(error.statusCode).json({ error: error.message });
  next(error);
};

export const uploadDocuments = async (req, res, next) => {
  try {
    const result = await paketService.uploadDocuments(
      req.params.id,
      req.files,
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

export const deleteDocument = async (req, res, next) => {
  try {
    const result = await paketService.deleteDocument(
      req.params.id,
      req.params.documentId,
      req.user?.role,
      req.user?.opdId,
      req.user?.id,
    );
    res.json(result);
  } catch (error) {
    handleError(error, res, next);
  }
};
