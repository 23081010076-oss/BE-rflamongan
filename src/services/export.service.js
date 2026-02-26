import ExcelJS from "exceljs";
import prisma from "./prisma.js";

// ─── Shared style constants ───────────────────────────────────────────────────
const borderThin = { style: "thin", color: { argb: "FF000000" } };
const borderMedium = { style: "medium", color: { argb: "FF000000" } };
const bAll = {
  top: borderThin,
  left: borderThin,
  bottom: borderThin,
  right: borderThin,
};
const bMed = {
  top: borderMedium,
  left: borderMedium,
  bottom: borderMedium,
  right: borderMedium,
};

const headerFill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FF1F3864" },
};
const opdFill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FFD6E4F0" },
};
const groupFill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FFE8F4FD" },
};
const totalFill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FFFFF2CC" },
};
const grandFill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FFFFC000" },
};
const statusColors = {
  PENDING: "FFFEF3C7",
  ACTIVE: "FFDBEAFE",
  COMPLETED: "FFD1FAE5",
  CANCELLED: "FFFEE2E2",
};

const rupiahFmt = '"Rp "#,##0';
const AC = { horizontal: "center", vertical: "middle", wrapText: true };
const AL = { horizontal: "left", vertical: "middle", wrapText: true };
const AR = { horizontal: "right", vertical: "middle", wrapText: true };

const applyHeader = (cell, extra = {}) => {
  cell.fill = headerFill;
  cell.font = {
    bold: true,
    color: { argb: "FFFFFFFF" },
    size: 10,
    name: "Arial",
    ...extra,
  };
  cell.border = bAll;
  cell.alignment = AC;
};

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("id-ID") : "");

// ─── Template import (blank xlsx) ────────────────────────────────────────────
export const buildImportTemplate = async (targetTahun) => {
  const wbTpl = new ExcelJS.Workbook();
  wbTpl.creator = "ERP Lamongan";

  const hFill = headerFill;
  const exFill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFE8F4FD" },
  };
  const wFill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFFFD7D7" },
  };
  const xFill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFFFF2CC" },
  };

  // ── Sheet 1: Template ──────────────────────────────────────────────────────
  const tplSheet = wbTpl.addWorksheet("Template", {
    pageSetup: {
      paperSize: 9,
      orientation: "landscape",
      fitToPage: true,
      fitToWidth: 1,
    },
  });

  tplSheet.columns = [
    { key: "a", width: 55 }, // PAKET PEKERJAAN
    { key: "b", width: 14 }, // OPD
    { key: "c", width: 22 }, // KODE REKENING
    { key: "d", width: 55 }, // KEGIATAN
    { key: "e", width: 16 }, // KATEGORI
    { key: "f", width: 8 }, // TAHUN
    { key: "g", width: 18 }, // PAGU ANGGARAN
    { key: "h", width: 18 }, // NILAI KONTRAK
    { key: "i", width: 18 }, // NILAI REALISASI
    { key: "j", width: 30 }, // PELAKSANA
    { key: "k", width: 22 }, // NOMOR KONTRAK
    { key: "l", width: 16 }, // NO SPMK
    { key: "m", width: 14 }, // SPMK MULAI
    { key: "n", width: 14 }, // SPMK SELESAI
    { key: "o", width: 12 }, // PROGRES FISIK
    { key: "p", width: 14 }, // SUMBER DANA
    { key: "q", width: 25 }, // LOKASI
    { key: "r", width: 20 }, // KET
  ];

  // Row 1 — Title
  const titleRow = tplSheet.addRow([
    `TEMPLATE IMPORT PAKET PEKERJAAN — TAHUN ${targetTahun}`,
  ]);
  tplSheet.mergeCells(1, 1, 1, 18);
  titleRow.height = 28;
  titleRow.getCell(1).font = {
    bold: true,
    size: 13,
    name: "Arial",
    color: { argb: "FF1F3864" },
  };
  titleRow.getCell(1).alignment = { horizontal: "center", vertical: "middle" };

  // Row 2 — Spacer
  tplSheet.addRow([]);

  // Row 3 — Header
  const hRow = tplSheet.addRow([
    "PAKET PEKERJAAN",
    "OPD",
    "KODE REKENING",
    "KEGIATAN",
    "KATEGORI",
    "TAHUN",
    "PAGU ANGGARAN",
    "NILAI KONTRAK",
    "NILAI REALISASI",
    "PELAKSANA",
    "NOMOR KONTRAK",
    "NO SPMK",
    "SPMK MULAI",
    "SPMK SELESAI",
    "PROGRES FISIK",
    "SUMBER DANA",
    "LOKASI",
    "KET",
  ]);
  hRow.height = 30;
  hRow.eachCell({ includeEmpty: true }, (cell) => {
    cell.fill = hFill;
    cell.font = {
      bold: true,
      size: 9,
      name: "Arial",
      color: { argb: "FFFFFFFF" },
    };
    cell.alignment = {
      horizontal: "center",
      vertical: "middle",
      wrapText: true,
    };
    cell.border = bAll;
  });

  // Row 4 — Example data
  const exRow = tplSheet.addRow([
    "Pembangunan SPAM Desa Jubellor Kec. Sugio",
    "DBMCKTR",
    "1.03.03.2.01.0028",
    "Pembangunan Sistem Penyediaan Air Minum (SPAM) Jaringan Perpipaan",
    "KONSTRUKSI",
    targetTahun,
    300000000,
    300000000,
    0,
    "CV Contoh",
    "",
    "",
    "2026-01-01",
    "2026-12-31",
    0,
    "APBD",
    "Kec. Sugio",
    "",
  ]);
  exRow.height = 20;
  exRow.eachCell({ includeEmpty: true }, (cell, colNum) => {
    cell.fill = exFill;
    cell.font = { size: 9, name: "Arial", italic: true };
    cell.border = bAll;
    cell.alignment = { vertical: "middle", wrapText: true };
    if ([7, 8, 9].includes(colNum)) {
      cell.numFmt = rupiahFmt;
      cell.alignment.horizontal = "right";
    } else if (colNum === 15) {
      cell.numFmt = '0"%"';
      cell.alignment.horizontal = "center";
    }
  });

  // Rows 5–54 — Empty input rows
  for (let i = 0; i < 50; i++) {
    const r = tplSheet.addRow(Array(18).fill(""));
    r.height = 18;
    r.eachCell({ includeEmpty: true }, (cell, colNum) => {
      cell.border = bAll;
      cell.font = { size: 9, name: "Arial" };
      cell.alignment = { vertical: "middle" };
      if ([7, 8, 9].includes(colNum)) {
        cell.numFmt = rupiahFmt;
        cell.alignment.horizontal = "right";
      }
    });
  }

  // ── Sheet 2: Panduan ────────────────────────────────────────────────────────
  const guideSheet = wbTpl.addWorksheet("Panduan");
  guideSheet.columns = [
    { width: 22 },
    { width: 55 },
    { width: 10 },
    { width: 45 },
  ];

  const gTitle = guideSheet.addRow([
    "PANDUAN PENGISIAN TEMPLATE IMPORT PAKET PEKERJAAN",
  ]);
  guideSheet.mergeCells(1, 1, 1, 4);
  gTitle.getCell(1).font = {
    bold: true,
    size: 13,
    name: "Arial",
    color: { argb: "FF1F3864" },
  };
  gTitle.getCell(1).alignment = { horizontal: "center", vertical: "middle" };
  gTitle.height = 28;
  guideSheet.addRow([]);

  const ghRow = guideSheet.addRow([
    "NAMA KOLOM",
    "KETERANGAN",
    "WAJIB",
    "CONTOH NILAI",
  ]);
  ghRow.height = 22;
  ghRow.eachCell({ includeEmpty: true }, (cell) => {
    cell.fill = hFill;
    cell.font = {
      bold: true,
      size: 10,
      name: "Arial",
      color: { argb: "FFFFFFFF" },
    };
    cell.alignment = { horizontal: "center", vertical: "middle" };
    cell.border = bAll;
  });

  const guideRows = [
    [
      "PAKET PEKERJAAN",
      "Nama paket pekerjaan / sub-kegiatan",
      "Ya",
      "Pembangunan SPAM Desa X",
      true,
    ],
    ["OPD", "Kode OPD yang terdaftar di sistem", "Ya", "DBMCKTR", true],
    [
      "KODE REKENING",
      "Kode rekening anggaran",
      "Tidak",
      "1.03.03.2.01.0028",
      false,
    ],
    [
      "KEGIATAN",
      "Nama kegiatan induk",
      "Ya",
      "Pembangunan SPAM Jaringan Perpipaan",
      true,
    ],
    [
      "KATEGORI",
      "KONSTRUKSI / KONSULTANSI / BARANG / JASA_LAINNYA",
      "Ya",
      "KONSTRUKSI",
      true,
    ],
    ["TAHUN", "Tahun anggaran (angka)", "Ya", "2026", true],
    [
      "PAGU ANGGARAN",
      "Nilai pagu anggaran (angka, tanpa titik/koma)",
      "Ya",
      "300000000",
      true,
    ],
    ["NILAI KONTRAK", "Nilai kontrak (angka)", "Ya", "300000000", true],
    [
      "NILAI REALISASI",
      "Nilai realisasi keuangan (angka)",
      "Tidak",
      "0",
      false,
    ],
    ["PELAKSANA", "Nama perusahaan pelaksana", "Tidak", "CV Contoh", false],
    [
      "NOMOR KONTRAK",
      "Nomor kontrak pekerjaan",
      "Tidak",
      "600/001.PKT/2026",
      false,
    ],
    ["NO SPMK", "Nomor SPMK", "Tidak", "700/001.SPMK/2026", false],
    [
      "SPMK MULAI",
      "Tanggal mulai SPMK (format: YYYY-MM-DD)",
      "Tidak",
      "2026-01-15",
      false,
    ],
    [
      "SPMK SELESAI",
      "Tanggal selesai SPMK (format: YYYY-MM-DD)",
      "Tidak",
      "2026-12-31",
      false,
    ],
    [
      "PROGRES FISIK",
      "Progres fisik dalam persen (0–100)",
      "Tidak",
      "0",
      false,
    ],
    ["SUMBER DANA", "APBD / APBN / DAK / BLUD / HIBAH", "Tidak", "APBD", false],
    ["LOKASI", "Lokasi pekerjaan", "Ya", "Kec. Sugio, Kab. Lamongan", true],
    ["KET", "Keterangan tambahan", "Tidak", "", false],
  ];

  guideRows.forEach(([col, ket, wajib, contoh, isWajib]) => {
    const r = guideSheet.addRow([col, ket, wajib, contoh]);
    r.height = 20;
    r.eachCell({ includeEmpty: true }, (cell, idx) => {
      cell.border = bAll;
      cell.font = { size: 9, name: "Arial" };
      cell.alignment = { vertical: "middle", wrapText: true };
      if (idx === 3) {
        cell.fill = isWajib ? wFill : xFill;
        cell.font = { size: 9, name: "Arial", bold: true };
        cell.alignment = { horizontal: "center", vertical: "middle" };
      }
    });
  });

  guideSheet.addRow([]);
  const lw = guideSheet.addRow(["  Merah = Wajib diisi"]);
  lw.getCell(1).fill = wFill;
  lw.getCell(1).font = { size: 9, name: "Arial", bold: true };
  const lo = guideSheet.addRow(["  Kuning = Opsional"]);
  lo.getCell(1).fill = xFill;
  lo.getCell(1).font = { size: 9, name: "Arial", bold: true };

  return wbTpl.xlsx.writeBuffer();
};

// ─── Laporan export (data report) ────────────────────────────────────────────
export const buildExportReport = async ({
  kategori,
  status,
  tahun,
  opdId,
  userRole,
  userOpdId,
}) => {
  const targetTahun = tahun || new Date().getFullYear();
  const where = {};
  if (kategori) where.kategori = kategori;
  if (status) where.status = status;
  if (tahun) where.tahun = parseInt(tahun);
  if (opdId) where.opdId = opdId;
  if (userRole === "OPD" && userOpdId) where.opdId = userOpdId;

  const pakets = await prisma.paket.findMany({
    where,
    orderBy: [
      { opd: { name: "asc" } },
      { kodeRekening: "asc" },
      { createdAt: "asc" },
    ],
    include: { opd: { select: { id: true, code: true, name: true } } },
  });

  if (pakets.length === 0) return null;

  const COL_COUNT = 14;
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "ERP Lamongan";
  const ws = workbook.addWorksheet(`Laporan ${targetTahun}`, {
    pageSetup: {
      paperSize: 9,
      orientation: "landscape",
      fitToPage: true,
      fitToWidth: 1,
    },
  });

  ws.columns = [
    { width: 5 },
    { width: 50 },
    { width: 18 },
    { width: 18 },
    { width: 18 },
    { width: 28 },
    { width: 14 },
    { width: 14 },
    { width: 12 },
    { width: 14 },
    { width: 14 },
    { width: 25 },
    { width: 20 },
    { width: 12 },
  ];

  // Title block
  const addTitle = (text, bold, size) => {
    const row = ws.addRow([text]);
    row.height = bold ? 24 : 18;
    ws.mergeCells(row.number, 1, row.number, COL_COUNT);
    const cell = row.getCell(1);
    cell.font = { bold, size, name: "Arial" };
    cell.alignment = AC;
  };
  addTitle(`DAFTAR KEGIATAN PROYEK TAHUN ${targetTahun}`, true, 14);
  addTitle(`APBD KABUPATEN LAMONGAN`, true, 12);
  addTitle(`TAHUN ANGGARAN ${targetTahun}`, false, 11);
  ws.addRow([]);

  // Group by OPD
  const opdGroups = [];
  const opdIndex = {};
  pakets.forEach((p) => {
    const key = p.opd?.id || "__NO_OPD__";
    if (opdIndex[key] === undefined) {
      opdIndex[key] = opdGroups.length;
      opdGroups.push({
        label: p.opd?.name?.toUpperCase() || "TANPA OPD",
        items: [],
      });
    }
    opdGroups[opdIndex[key]].items.push(p);
  });

  let grandTotalPagu = 0,
    grandTotalNilai = 0,
    grandTotalSisa = 0;

  for (const { label, items } of opdGroups) {
    // OPD label row
    const opdRow = ws.addRow([`OPD : ${label}`]);
    ws.mergeCells(opdRow.number, 1, opdRow.number, COL_COUNT);
    opdRow.height = 22;
    const opdCell = opdRow.getCell(1);
    opdCell.fill = opdFill;
    opdCell.font = { bold: true, size: 11, name: "Arial" };
    opdCell.alignment = AL;
    opdCell.border = bMed;

    // Header row 1
    const h1 = ws.addRow([
      "NO",
      "PAKET PEKERJAAN",
      "PAGU ANGGARAN",
      "NILAI KONTRAK",
      "SISA ANGGARAN",
      "PELAKSANA",
      "S P M K",
      "",
      "PROGRES REALISASI",
      "",
      "SUMBER DANA",
      "LOKASI",
      "KET",
      "STATUS",
    ]);
    h1.height = 28;
    ws.mergeCells(h1.number, 7, h1.number, 8);
    ws.mergeCells(h1.number, 9, h1.number, 10);
    [1, 2, 3, 4, 5, 6, 11, 12, 13, 14].forEach((c) =>
      ws.mergeCells(h1.number, c, h1.number + 1, c),
    );
    h1.eachCell({ includeEmpty: true }, (cell) => applyHeader(cell));

    // Header row 2
    const h2 = ws.addRow([
      "",
      "",
      "",
      "",
      "",
      "",
      "MULAI",
      "SELESAI",
      "FISIK(%)",
      "KEUANGAN(%)",
      "",
      "",
      "",
      "",
    ]);
    h2.height = 20;
    h2.eachCell({ includeEmpty: true }, (cell) => applyHeader(cell));

    // Data rows grouped by kodeRekening + kegiatan
    const groups = {};
    const groupOrder = [];
    items.forEach((p) => {
      const key = p.kodeRekening
        ? `${p.kodeRekening}||${p.kegiatan}`
        : `__NO_CODE__||${p.kegiatan || ""}`;
      if (!groups[key]) {
        groups[key] = [];
        groupOrder.push(key);
      }
      groups[key].push(p);
    });

    let seq = 1,
      totalPagu = 0,
      totalNilai = 0,
      totalSisa = 0;

    for (const key of groupOrder) {
      const [kode, kegiatan] = key.split("||");
      const grpLabel =
        kode !== "__NO_CODE__" ? `${kode}  ${kegiatan}` : `  ${kegiatan}`;
      const gRow = ws.addRow([grpLabel]);
      ws.mergeCells(gRow.number, 1, gRow.number, COL_COUNT);
      gRow.height = 18;
      gRow.getCell(1).fill = groupFill;
      gRow.getCell(1).font = {
        bold: true,
        italic: true,
        size: 9,
        name: "Arial",
      };
      gRow.getCell(1).alignment = AL;
      gRow.getCell(1).border = bAll;

      for (const p of groups[key]) {
        const pagu = p.pagu || 0;
        const nilaiKontrak = p.nilai || 0;
        const sisa = pagu - nilaiKontrak;
        const progresKeu =
          nilaiKontrak > 0 ? (p.nilaiRealisasi / nilaiKontrak) * 100 : 0;
        totalPagu += pagu;
        totalNilai += nilaiKontrak;
        totalSisa += sisa;

        const dRow = ws.addRow([
          seq++,
          p.name,
          pagu,
          nilaiKontrak,
          sisa,
          p.pelaksana || "",
          fmtDate(p.tanggalMulai),
          fmtDate(p.tanggalSelesai),
          p.progres,
          progresKeu,
          p.sumberDana || "",
          p.lokasi || "",
          p.keterangan || "",
          p.status || "",
        ]);
        dRow.height = 18;
        dRow.eachCell({ includeEmpty: true }, (cell, colNum) => {
          cell.border = bAll;
          cell.font = { size: 9, name: "Arial" };
          if ([3, 4, 5].includes(colNum)) {
            cell.numFmt = rupiahFmt;
            cell.alignment = AR;
          } else if ([9, 10].includes(colNum)) {
            cell.numFmt = '0.00"%"';
            cell.alignment = AC;
          } else if ([7, 8].includes(colNum)) {
            cell.alignment = AC;
          } else if (colNum === 1) {
            cell.alignment = AC;
          } else if (colNum === 14) {
            cell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: statusColors[p.status] || "FFFFFFFF" },
            };
            cell.font = { bold: true, size: 9, name: "Arial" };
            cell.alignment = AC;
          } else {
            cell.alignment = AL;
          }
        });
      }
    }

    // TOTAL per OPD
    const totRow = ws.addRow([
      "TOTAL",
      "",
      totalPagu,
      totalNilai,
      totalSisa,
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
    ]);
    ws.mergeCells(totRow.number, 1, totRow.number, 2);
    totRow.height = 20;
    totRow.eachCell({ includeEmpty: true }, (cell, colNum) => {
      cell.fill = totalFill;
      cell.font = { bold: true, size: 10, name: "Arial" };
      cell.border = bAll;
      cell.alignment = [3, 4, 5].includes(colNum) ? AR : AC;
      if ([3, 4, 5].includes(colNum)) cell.numFmt = rupiahFmt;
    });

    grandTotalPagu += totalPagu;
    grandTotalNilai += totalNilai;
    grandTotalSisa += totalSisa;
    ws.addRow([]);
    ws.addRow([]);
  }

  // GRAND TOTAL
  const gtRow = ws.addRow([
    "GRAND TOTAL SEMUA OPD",
    "",
    grandTotalPagu,
    grandTotalNilai,
    grandTotalSisa,
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
  ]);
  ws.mergeCells(gtRow.number, 1, gtRow.number, 2);
  gtRow.height = 26;
  gtRow.eachCell({ includeEmpty: true }, (cell, colNum) => {
    cell.fill = grandFill;
    cell.font = { bold: true, size: 12, name: "Arial" };
    cell.border = bMed;
    cell.alignment = [3, 4, 5].includes(colNum) ? AR : AC;
    if ([3, 4, 5].includes(colNum)) cell.numFmt = rupiahFmt;
  });

  return {
    buffer: await workbook.xlsx.writeBuffer(),
    filename: `laporan_paket_${targetTahun}.xlsx`,
  };
};
