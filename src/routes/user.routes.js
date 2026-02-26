import express from "express";
import {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  toggleUserStatus,
} from "../controllers/user.controller.js";
import { authenticate, authorize } from "../middleware/auth.js";

const router = express.Router();

router.use(authenticate);
router.use(authorize("ADMIN"));

router.get("/", getAllUsers);
router.get("/:id", getUserById);
router.post("/", createUser);
router.put("/:id", updateUser);
router.patch("/:id/toggle-status", toggleUserStatus);
router.delete("/:id", deleteUser);

export default router;
