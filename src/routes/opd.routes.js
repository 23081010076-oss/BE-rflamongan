import express from "express";
import {
  getAllOpd,
  getOpdById,
  createOpd,
  updateOpd,
  deleteOpd,
  toggleOpdStatus,
} from "../controllers/opd.controller.js";
import { authenticate, authorize } from "../middleware/auth.js";

const router = express.Router();

router.use(authenticate);

router.get("/", getAllOpd);
router.get("/:id", getOpdById);
router.post("/", authorize("ADMIN"), createOpd);
router.put("/:id", authorize("ADMIN"), updateOpd);
router.patch("/:id/toggle-status", authorize("ADMIN"), toggleOpdStatus);
router.delete("/:id", authorize("ADMIN"), deleteOpd);

export default router;
