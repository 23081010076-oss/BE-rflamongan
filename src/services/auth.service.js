import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "./prisma.js";
import { log } from "./audit.service.js";

export const loginUser = async ({ email, password, ipAddress }) => {
  if (!email || !password) {
    const err = new Error("Email and password are required");
    err.statusCode = 400;
    throw err;
  }

  const user = await prisma.user.findUnique({
    where: { email },
    include: { opd: true },
  });

  if (!user) {
    const err = new Error("Invalid credentials");
    err.statusCode = 401;
    throw err;
  }

  if (!user.isActive) {
    const err = new Error("Account is inactive");
    err.statusCode = 401;
    throw err;
  }

  const validPassword = await bcrypt.compare(password, user.password);
  if (!validPassword) {
    const err = new Error("Invalid credentials");
    err.statusCode = 401;
    throw err;
  }

  const token = jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" },
  );

  await log({
    userId: user.id,
    action: "LOGIN",
    entity: "User",
    entityId: user.id,
    ipAddress,
  });

  const { password: _, ...userWithoutPassword } = user;
  return { token, user: userWithoutPassword };
};

export const registerUser = async ({ email, password, name, role, opdId }) => {
  if (!email || !password || !name) {
    const err = new Error("Email, password, and name are required");
    err.statusCode = 400;
    throw err;
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    const err = new Error("Email already exists");
    err.statusCode = 409;
    throw err;
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name,
      role: role || "VIEWER",
      opdId,
    },
    include: { opd: true },
  });

  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

export const getMe = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { opd: true },
  });
  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

export const changePassword = async ({ userId, oldPassword, newPassword }) => {
  if (!oldPassword || !newPassword) {
    const err = new Error("Old and new passwords are required");
    err.statusCode = 400;
    throw err;
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });

  const valid = await bcrypt.compare(oldPassword, user.password);
  if (!valid) {
    const err = new Error("Invalid old password");
    err.statusCode = 401;
    throw err;
  }

  const hashed = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { id: userId },
    data: { password: hashed },
  });
};
