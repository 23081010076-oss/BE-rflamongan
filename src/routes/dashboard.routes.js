import express from "express";
import {
  getStats,
  getChartData,
  getRecentUpdates,
} from "../controllers/dashboard.controller.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

router.use(authenticate);

router.get("/stats", getStats);
router.get("/chart", getChartData);
router.get("/recent", getRecentUpdates);

export default router;
