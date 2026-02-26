import prisma from "./prisma.js";
import { log } from "./audit.service.js";

export const getAllOpd = async ({ search, isActive }) => {
  const where = {};

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { code: { contains: search, mode: "insensitive" } },
    ];
  }

  if (isActive !== undefined) {
    where.isActive = isActive === "true";
  }

  return prisma.opd.findMany({
    where,
    include: { _count: { select: { pakets: true, users: true } } },
    orderBy: { name: "asc" },
  });
};

export const getOpdById = async (id) => {
  const opd = await prisma.opd.findUnique({
    where: { id },
    include: {
      users: {
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
        },
      },
      pakets: { take: 10, orderBy: { updatedAt: "desc" } },
      _count: { select: { pakets: true, users: true } },
    },
  });

  if (!opd) {
    const err = new Error("OPD not found");
    err.statusCode = 404;
    throw err;
  }

  return opd;
};

export const createOpd = async (
  { code, name, kepala, contact, address },
  actorId,
) => {
  const opd = await prisma.opd.create({
    data: { code, name, kepala, contact, address },
  });

  await log({
    userId: actorId,
    action: "CREATE",
    entity: "OPD",
    entityId: opd.id,
    details: { name: opd.name, code: opd.code },
  });

  return opd;
};

export const updateOpd = async (id, data, actorId) => {
  const opd = await prisma.opd.update({ where: { id }, data });

  await log({
    userId: actorId,
    action: "UPDATE",
    entity: "OPD",
    entityId: opd.id,
    details: data,
  });

  return opd;
};

export const deleteOpd = async (id) => {
  const paketCount = await prisma.paket.count({ where: { opdId: id } });

  if (paketCount > 0) {
    const err = new Error("Cannot delete OPD with existing pakets");
    err.statusCode = 400;
    throw err;
  }

  await prisma.opd.delete({ where: { id } });
};

export const toggleOpdStatus = async (id, actorId) => {
  const current = await prisma.opd.findUnique({
    where: { id },
    select: { isActive: true },
  });

  if (!current) {
    const err = new Error("OPD not found");
    err.statusCode = 404;
    throw err;
  }

  const opd = await prisma.opd.update({
    where: { id },
    data: { isActive: !current.isActive },
  });

  await log({
    userId: actorId,
    action: "UPDATE",
    entity: "OPD",
    entityId: opd.id,
    details: { action: "toggle_status", isActive: opd.isActive },
  });

  return opd;
};
