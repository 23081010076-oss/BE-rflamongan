import prisma from "./prisma.js";

/**
 * Catat aktivitas ke tabel AuditLog.
 * @param {object} opts
 * @param {string} opts.userId
 * @param {string} opts.action   - e.g. "CREATE" | "UPDATE" | "DELETE" | "LOGIN"
 * @param {string} opts.entity   - e.g. "Paket" | "User" | "OPD"
 * @param {string} opts.entityId
 * @param {object} [opts.details]
 * @param {string} [opts.ipAddress]
 */
export const log = async ({
  userId,
  action,
  entity,
  entityId,
  details,
  ipAddress,
}) => {
  await prisma.auditLog.create({
    data: {
      userId,
      action,
      entity,
      entityId,
      details: details ? JSON.stringify(details) : undefined,
      ipAddress,
    },
  });
};
