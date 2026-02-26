import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import prisma from "./prisma.js";
import { log } from "./audit.service.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const VALID_STATUSES = ["PENDING", "ACTIVE", "COMPLETED", "CANCELLED"];

// ─── Query ────────────────────────────────────────────────────────────────────

export const getAll = async ({
  page = 1,
  limit = 10,
  search,
  kategori,
  status,
  opdId,
  tahun,
  userRole,
  userOpdId,
}) => {
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const where = {};

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { code: { contains: search, mode: "insensitive" } },
      { kegiatan: { contains: search, mode: "insensitive" } },
      { lokasi: { contains: search, mode: "insensitive" } },
    ];
  }

  if (kategori) where.kategori = kategori;
  if (status) where.status = status;
  if (opdId) where.opdId = opdId;
  if (tahun) where.tahun = parseInt(tahun);

  // OPD role can only see their own pakets
  if (userRole === "OPD" && userOpdId) where.opdId = userOpdId;

  const [pakets, total, agg] = await Promise.all([
    prisma.paket.findMany({
      where,
      skip,
      take: parseInt(limit),
      include: { opd: { select: { id: true, name: true, code: true } } },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.paket.count({ where }),
    prisma.paket.aggregate({
      where,
      _sum: { pagu: true, nilai: true, nilaiRealisasi: true },
      _avg: { progres: true },
    }),
  ]);

  const totalPagu = agg._sum.pagu || 0;
  const totalNilai = agg._sum.nilai || 0;
  const totalNilaiRealisasi = agg._sum.nilaiRealisasi || 0;
  const avgProgres = agg._avg.progres || 0;
  const avgKeuangan =
    totalNilai > 0 ? (totalNilaiRealisasi / totalNilai) * 100 : 0;

  return {
    data: pakets,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
    },
    totals: {
      pagu: totalPagu,
      nilai: totalNilai,
      sisa: totalPagu - totalNilai,
      nilaiRealisasi: totalNilaiRealisasi,
      avgFisik: parseFloat(avgProgres.toFixed(1)),
      avgKeuangan: parseFloat(avgKeuangan.toFixed(1)),
      count: total,
    },
  };
};

export const getById = async (id, userRole, userOpdId) => {
  const paket = await prisma.paket.findUnique({
    where: { id },
    include: {
      opd: true,
      progress: { orderBy: { tanggal: "desc" }, take: 20 },
      documents: true,
    },
  });

  if (!paket) {
    const err = new Error("Paket not found");
    err.statusCode = 404;
    throw err;
  }

  if (userRole === "OPD" && paket.opdId !== userOpdId) {
    const err = new Error("Access denied");
    err.statusCode = 403;
    throw err;
  }

  return paket;
};

// ─── Mutations ────────────────────────────────────────────────────────────────

export const create = async (data, userRole, userOpdId, actorId) => {
  const finalOpdId = userRole === "OPD" ? userOpdId : data.opdId;

  if (!finalOpdId) {
    const err = new Error("OPD is required");
    err.statusCode = 400;
    throw err;
  }

  // Auto-generate code jika tidak disediakan
  const tahun = parseInt(data.tahun) || new Date().getFullYear();
  const code =
    data.code && data.code.trim()
      ? data.code.trim()
      : `PKT-${tahun}-${Date.now()}`;

  const paket = await prisma.paket.create({
    data: {
      code,
      name: data.name,
      kategori: data.kategori,
      opdId: finalOpdId,
      kegiatan: data.kegiatan,
      lokasi: data.lokasi,
      pagu: data.pagu ? parseFloat(data.pagu) : 0,
      nilai: data.nilai ? parseFloat(data.nilai) : 0,
      nilaiRealisasi: data.nilaiRealisasi ? parseFloat(data.nilaiRealisasi) : 0,
      progres: data.progres ? parseFloat(data.progres) : 0,
      tahun,
      tanggalMulai: data.tanggalMulai ? new Date(data.tanggalMulai) : null,
      tanggalSelesai: data.tanggalSelesai
        ? new Date(data.tanggalSelesai)
        : null,
      keterangan: data.keterangan || null,
      nomorKontrak: data.nomorKontrak || null,
      noSPMK: data.noSPMK || null,
      sumberDana: data.sumberDana || "APBD",
      pelaksana: data.pelaksana || null,
      kodeRekening: data.kodeRekening || null,
    },
    include: { opd: true },
  });

  await log({
    userId: actorId,
    action: "CREATE",
    entity: "Paket",
    entityId: paket.id,
    details: { name: paket.name, code: paket.code },
  });

  return paket;
};

export const update = async (id, data, userRole, userOpdId, actorId) => {
  const existing = await prisma.paket.findUnique({ where: { id } });
  if (!existing) {
    const err = new Error("Paket not found");
    err.statusCode = 404;
    throw err;
  }

  if (userRole === "OPD" && existing.opdId !== userOpdId) {
    const err = new Error("Access denied");
    err.statusCode = 403;
    throw err;
  }

  if (data.nilai) data.nilai = parseFloat(data.nilai);
  if (data.nilaiRealisasi)
    data.nilaiRealisasi = parseFloat(data.nilaiRealisasi);
  if (data.progres) data.progres = parseFloat(data.progres);
  if (data.tahun) data.tahun = parseInt(data.tahun);
  if (data.tanggalMulai) data.tanggalMulai = new Date(data.tanggalMulai);
  if (data.tanggalSelesai) data.tanggalSelesai = new Date(data.tanggalSelesai);

  const paket = await prisma.paket.update({
    where: { id },
    data,
    include: { opd: true },
  });

  await log({
    userId: actorId,
    action: "UPDATE",
    entity: "Paket",
    entityId: paket.id,
    details: data,
  });

  return paket;
};

export const remove = async (id, userRole, actorId) => {
  const existing = await prisma.paket.findUnique({ where: { id } });
  if (!existing) {
    const err = new Error("Paket not found");
    err.statusCode = 404;
    throw err;
  }

  if (userRole !== "ADMIN") {
    const err = new Error("Only admin can delete paket");
    err.statusCode = 403;
    throw err;
  }

  await prisma.paket.delete({ where: { id } });

  await log({
    userId: actorId,
    action: "DELETE",
    entity: "Paket",
    entityId: id,
    details: { name: existing.name },
  });
};

export const updateStatus = async (
  id,
  status,
  userRole,
  userOpdId,
  actorId,
) => {
  if (!VALID_STATUSES.includes(status)) {
    const err = new Error(
      "Invalid status. Must be one of: PENDING, ACTIVE, COMPLETED, CANCELLED",
    );
    err.statusCode = 400;
    throw err;
  }

  const existing = await prisma.paket.findUnique({ where: { id } });
  if (!existing) {
    const err = new Error("Paket not found");
    err.statusCode = 404;
    throw err;
  }

  if (userRole === "OPD" && existing.opdId !== userOpdId) {
    const err = new Error("Access denied");
    err.statusCode = 403;
    throw err;
  }

  const paket = await prisma.paket.update({
    where: { id },
    data: { status },
    include: { opd: true },
  });

  await log({
    userId: actorId,
    action: "UPDATE",
    entity: "Paket",
    entityId: paket.id,
    details: {
      action: "update_status",
      oldStatus: existing.status,
      newStatus: status,
    },
  });

  return paket;
};

export const updateProgress = async (
  id,
  { progres, nilaiRealisasi, keterangan },
  userRole,
  userOpdId,
) => {
  const paket = await prisma.paket.findUnique({ where: { id } });
  if (!paket) {
    const err = new Error("Paket not found");
    err.statusCode = 404;
    throw err;
  }

  if (userRole === "OPD" && paket.opdId !== userOpdId) {
    const err = new Error("Access denied");
    err.statusCode = 403;
    throw err;
  }

  await prisma.paketProgress.create({
    data: {
      paketId: id,
      progres: parseFloat(progres),
      nilaiRealisasi: parseFloat(nilaiRealisasi),
      keterangan,
    },
  });

  return prisma.paket.update({
    where: { id },
    data: {
      progres: parseFloat(progres),
      nilaiRealisasi: parseFloat(nilaiRealisasi),
    },
    include: {
      opd: true,
      progress: { orderBy: { tanggal: "desc" }, take: 10 },
    },
  });
};

// ─── Documents ────────────────────────────────────────────────────────────────

export const uploadDocuments = async (
  id,
  files,
  { category, progressPercentage },
  userRole,
  userOpdId,
  actorId,
) => {
  if (!files || files.length === 0) {
    const err = new Error("No files uploaded");
    err.statusCode = 400;
    throw err;
  }

  const paket = await prisma.paket.findUnique({ where: { id } });
  if (!paket) {
    const err = new Error("Paket not found");
    err.statusCode = 404;
    throw err;
  }

  if (userRole === "OPD" && paket.opdId !== userOpdId) {
    const err = new Error("Access denied");
    err.statusCode = 403;
    throw err;
  }

  const documents = await Promise.all(
    files.map((file) =>
      prisma.document.create({
        data: {
          paketId: id,
          name: file.originalname,
          filename: file.filename,
          filepath: `/uploads/${file.filename}`,
          mimetype: file.mimetype,
          filesize: file.size,
          category: category || null,
          progressPercentage: progressPercentage
            ? parseInt(progressPercentage)
            : null,
        },
      }),
    ),
  );

  await log({
    userId: actorId,
    action: "UPLOAD_DOCUMENTS",
    entity: "Document",
    entityId: id,
    details: {
      paketName: paket.name,
      filesCount: files.length,
      progressPercentage,
    },
  });

  return documents;
};

export const deleteDocument = async (
  paketId,
  documentId,
  userRole,
  userOpdId,
  actorId,
) => {
  const document = await prisma.document.findUnique({
    where: { id: documentId },
    include: { paket: true },
  });

  if (!document) {
    const err = new Error("Document not found");
    err.statusCode = 404;
    throw err;
  }

  if (document.paketId !== paketId) {
    const err = new Error("Document does not belong to this paket");
    err.statusCode = 400;
    throw err;
  }

  if (userRole === "OPD" && document.paket.opdId !== userOpdId) {
    const err = new Error("Access denied");
    err.statusCode = 403;
    throw err;
  }

  try {
    const filePath = path.join(__dirname, "../../public", document.fileUrl);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch (e) {
    console.error("Error deleting file:", e);
  }

  await prisma.document.delete({ where: { id: documentId } });

  await log({
    userId: actorId,
    action: "DELETE_DOCUMENT",
    entity: "Document",
    entityId: documentId,
    details: { paketName: document.paket.name, fileName: document.name },
  });
};
