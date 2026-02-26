import express from "express";
import {
  login,
  register,
  getMe,
  changePassword,
} from "../controllers/auth.controller.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

router.post("/login", login);
router.post("/register", register);
router.get("/me", authenticate, getMe);
router.post("/change-password", authenticate, changePassword);

export default router;
