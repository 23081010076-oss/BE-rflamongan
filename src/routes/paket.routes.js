import express from "express";
import {
  getAllPaket,
  getPaketById,
  createPaket,
  updatePaket,
  deletePaket,
  updatePaketStatus,
  updateProgress,
} from "../controllers/paket.controller.js";
import {
  uploadDocuments,
  deleteDocument,
} from "../controllers/document.controller.js";
import {
  exportPaket,
  importPaket,
} from "../controllers/paket.io.controller.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";
import multer from "multer";

const router = express.Router();
const uploadExcel = multer({ storage: multer.memoryStorage() });

router.use(authenticate);

// Export/Import (BEFORE /:id to avoid route conflict)
router.get("/export", exportPaket);
router.post(
  "/import",
  authorize("ADMIN", "OPD"),
  uploadExcel.single("file"),
  importPaket,
);

router.get("/", getAllPaket);
router.get("/:id", getPaketById);
router.post("/", authorize("ADMIN", "OPD"), createPaket);
router.put("/:id", authorize("ADMIN", "OPD"), updatePaket);
router.patch("/:id/status", authorize("ADMIN", "OPD"), updatePaketStatus);
router.delete("/:id", authorize("ADMIN"), deletePaket);
router.post("/:id/progress", authorize("ADMIN", "OPD"), updateProgress);
router.post(
  "/:id/documents",
  authorize("ADMIN", "OPD"),
  upload.array("files", 10),
  uploadDocuments,
);
router.delete(
  "/:id/documents/:documentId",
  authorize("ADMIN", "OPD"),
  deleteDocument,
);

export default router;
