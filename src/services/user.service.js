import bcrypt from "bcrypt";
import prisma from "./prisma.js";
import { log } from "./audit.service.js";

export const getAllUsers = async ({ role, opdId, isActive }) => {
  const where = {};
  if (role) where.role = role;
  if (opdId) where.opdId = opdId;
  if (isActive !== undefined) where.isActive = isActive === "true";

  const users = await prisma.user.findMany({
    where,
    include: { opd: { select: { id: true, name: true, code: true } } },
    orderBy: { createdAt: "desc" },
  });

  return users.map(({ password, ...u }) => u);
};

export const getUserById = async (id) => {
  const user = await prisma.user.findUnique({
    where: { id },
    include: { opd: true },
  });
  if (!user) {
    const err = new Error("User not found");
    err.statusCode = 404;
    throw err;
  }
  const { password, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

export const createUser = async (
  { email, password, name, role, opdId },
  actorId,
) => {
  const hashed = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { email, password: hashed, name, role, opdId },
    include: { opd: true },
  });

  await log({
    userId: actorId,
    action: "CREATE",
    entity: "User",
    entityId: user.id,
    details: { email: user.email, name: user.name },
  });

  const { password: _, ...u } = user;
  return u;
};

export const updateUser = async (id, { password, ...data }, actorId) => {
  if (password) {
    data.password = await bcrypt.hash(password, 10);
  }

  const user = await prisma.user.update({
    where: { id },
    data,
    include: { opd: true },
  });

  await log({
    userId: actorId,
    action: "UPDATE",
    entity: "User",
    entityId: user.id,
    details: data,
  });

  const { password: _, ...u } = user;
  return u;
};

export const deleteUser = async (id, actorId) => {
  if (id === actorId) {
    const err = new Error("Cannot delete your own account");
    err.statusCode = 400;
    throw err;
  }
  await prisma.user.delete({ where: { id } });
};

export const toggleUserStatus = async (id, actorId) => {
  if (id === actorId) {
    const err = new Error("Cannot toggle your own account status");
    err.statusCode = 400;
    throw err;
  }

  const current = await prisma.user.findUnique({
    where: { id },
    select: { isActive: true },
  });
  if (!current) {
    const err = new Error("User not found");
    err.statusCode = 404;
    throw err;
  }

  const user = await prisma.user.update({
    where: { id },
    data: { isActive: !current.isActive },
    include: { opd: true },
  });

  await log({
    userId: actorId,
    action: "UPDATE",
    entity: "User",
    entityId: user.id,
    details: { action: "toggle_status", isActive: user.isActive },
  });

  const { password, ...u } = user;
  return u;
};
