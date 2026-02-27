import * as XLSX from "xlsx";
import prisma from "./prisma.js";
import { log } from "./audit.service.js";

// ─── helpers ─────────────────────────────────────────────────────────────────

const norm = (s) =>
  String(s ?? "")
    .toUpperCase()
    .replace(/[^A-Z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

// Column alias map: canonical key → possible header strings (normalized)
const COL = {
  name:          ["PAKET PEKERJAAN","NAMA PEKERJAAN","NAMA PAKET","PEKERJAAN","PAKET","NAMA KEGIATAN","KEGIATAN PEKERJAAN"],
  pagu:          ["PAGU ANGGARAN","PAGU","ANGGARAN","NILAI PAGU","DIPA"],
  nilai:         ["NILAI KONTRAK","KONTRAK","NILAI","HARGA KONTRAK","HPS"],
  nilaiRealisasi:["NILAI REALISASI","REALISASI KEUANGAN","KEUANGAN","REALISASI"],
  pelaksana:     ["PELAKSANA","KONTRAKTOR","REKANAN","PENYEDIA","NAMA PELAKSANA"],
  sumberDana:    ["SUMBER DANA","DANA","SUMBER"],
  lokasi:        ["LOKASI","TEMPAT","WILAYAH","KECAMATAN","ALAMAT"],
  keterangan:    ["KET","KETERANGAN","CATATAN","INFO"],
  tahun:         ["TAHUN","TAHUN ANGGARAN","TA"],
  progres:       ["PROGRES FISIK","FISIK","PROGRES","REALISASI FISIK"],
  nomorKontrak:  ["NOMOR KONTRAK","NO KONTRAK","KODE KONTRAK"],
  noSPMK:        ["NO SPMK","SPMK","NOMOR SPMK"],
  tanggalMulai:  ["SPMK MULAI","MULAI","TGL MULAI","TANGGAL MULAI","KONTRAK MULAI"],
  tanggalSelesai:["SPMK SELESAI","SELESAI","TGL SELESAI","TANGGAL SELESAI","KONTRAK SELESAI"],
  kegiatan:      ["KEGIATAN","PROGRAM","SUB KEGIATAN"],
  kodeRekening:  ["KODE REKENING","KODE","REKENING"],
  opdCode:       ["OPD","OPD CODE","KODE OPD","INSTANSI"],
  kategori:      ["KATEGORI","JENIS","JENIS PEKERJAAN","JENIS PENGADAAN"],
};

// Build colKey → actual header string map from a row's keys
const buildHeaderMap = (row) => {
  const map = {};
  for (const [key, aliases] of Object.entries(COL)) {
    for (const rawHeader of Object.keys(row)) {
      const n = norm(rawHeader);
      if (aliases.some((alias) => n === alias || n.startsWith(alias))) {
        if (!(key in map)) map[key] = rawHeader;
      }
    }
  }
  return map;
};

// Detect which spreadsheet row is the actual column header row (0-based)
const detectHeaderRow = (ws) => {
  const raw = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
  const KEYWORDS = ["PAKET PEKERJAAN","NAMA PEKERJAAN","PEKERJAAN","NILAI KONTRAK","PAGU ANGGARAN","PELAKSANA","PAKET"];
  for (let r = 0; r < Math.min(raw.length, 15); r++) {
    const cells = raw[r].map((c) => norm(c));
    const hits = cells.filter((c) => KEYWORDS.some((k) => c === k || c.includes(k)));
    if (hits.length >= 2) return r;
  }
  return 0;
};

// Infer kategori from text content
const inferKategori = (text) => {
  const t = norm(text);
  if (/KONSULTAN|PERENCANAAN|PENGAWASAN|SUPERVISI|STUDI|KAJIAN|DED|FEASIBILITY|AUDIT|SURVEY/.test(t))
    return "KONSULTANSI";
  if (/BARANG|ALAT|KENDARAAN|KOMPUTER|MEBEL|FURNITURE|SERAGAM/.test(t))
    return "BARANG";
  if (/PEMELIHARAAN|CLEANING|JASA LAIN|OPERASIONAL|LAUNDRY|KEBERSIHAN|KEAMANAN|SECURITY/.test(t))
    return "JASA_LAINNYA";
  return "KONSTRUKSI";
};

// Determine if a row is a section/group header rather than real data
const isSectionHeader = (name) => {
  if (!name) return true;
  const n = String(name).trim();
  if (n.startsWith(":")) return true;            // ": 1.03.03..."
  if (/^\d+\.\d+\.\d+/.test(n)) return true;    // kode rekening as row header
  return false;
};

const VALID_MAP = {
  KONSTRUKSI: "KONSTRUKSI", KONSTRUSI: "KONSTRUKSI",
  KONSULTANSI: "KONSULTANSI", KONSULTAN: "KONSULTANSI",
  BARANG: "BARANG",
  JASA_LAINNYA: "JASA_LAINNYA", "JASA LAINNYA": "JASA_LAINNYA", JASA: "JASA_LAINNYA",
};

// ─── main export ─────────────────────────────────────────────────────────────

export const importFromBuffer = async (buffer, actorId, defaults = {}) => {
  const wb = XLSX.read(buffer, { type: "buffer" });
  const ws = wb.Sheets[wb.SheetNames[0]];

  // 1. Auto-detect header row
  const headerRowIdx = detectHeaderRow(ws);
  const rows = XLSX.utils.sheet_to_json(ws, { range: headerRowIdx, defval: "" });

  if (rows.length === 0) {
    const err = new Error("File tidak memiliki data");
    err.statusCode = 400;
    throw err;
  }

  // 2. Build flexible column mapping from actual headers
  const colMap = buildHeaderMap(rows[0]);

  const get = (row, key) => {
    const header = colMap[key];
    return header !== undefined ? row[header] : "";
  };

  // 3. OPD lookup: by code and by name (fuzzy)
  const opds = await prisma.opd.findMany({ select: { id: true, code: true, name: true } });
  const opdByCode = {};
  const opdByName = {};
  opds.forEach((o) => {
    opdByCode[norm(o.code)] = o.id;
    norm(o.name).split(" ").filter((w) => w.length > 3).forEach((w) => {
      if (!opdByName[w]) opdByName[w] = o.id;
    });
  });

  const resolveOpd = (rawCode) => {
    if (!rawCode) return defaults.opdId || null;
    const n = norm(rawCode);
    if (opdByCode[n]) return opdByCode[n];
    for (const w of n.split(" ").filter((w) => w.length > 3)) {
      if (opdByName[w]) return opdByName[w];
    }
    return defaults.opdId || null;
  };

  // 4. Auto-increment code
  const latestPaket = await prisma.paket.findFirst({
    orderBy: { createdAt: "desc" },
    select: { code: true },
  });
  let autoCodeNum = 1;
  if (latestPaket?.code) {
    const match = latestPaket.code.match(/(\d+)$/);
    if (match) autoCodeNum = parseInt(match[1]) + 1;
  }

  const parseDate = (raw) => {
    if (!raw) return null;
    const d =
      typeof raw === "number"
        ? new Date(Math.round((raw - 25569) * 86400 * 1000))
        : new Date(raw);
    return isNaN(d.getTime()) ? null : d;
  };

  const results = { success: 0, failed: 0, errors: [] };

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = headerRowIdx + i + 2;

    try {
      // Try to find the name from the mapped column, or fall back to first non-empty string column
      let rawName = String(get(row, "name") || "").trim();
      if (!rawName) {
        const fallbackKey = Object.keys(row).find((k) => {
          const n = norm(k);
          return ["PAKET","PEKERJAAN","NAMA"].some((kw) => n.includes(kw));
        });
        rawName = fallbackKey ? String(row[fallbackKey] || "").trim() : "";
      }

      const pagu = parseFloat(String(get(row, "pagu") || 0).replace(/,/g, "")) || 0;
      const nilai = parseFloat(String(get(row, "nilai") || 0).replace(/,/g, "")) || 0;

      // Skip section headers and blank rows
      if (isSectionHeader(rawName)) continue;
      if (!rawName) continue;

      const name = rawName;
      const nilaiRealisasi = parseFloat(String(get(row, "nilaiRealisasi") || 0).replace(/,/g, "")) || 0;
      const pelaksana = String(get(row, "pelaksana") || "").trim() || null;
      const lokasi = String(get(row, "lokasi") || "").trim();
      const keterangan = String(get(row, "keterangan") || "").trim() || null;
      const sumberDana = String(get(row, "sumberDana") || defaults.sumberDana || "APBD").trim();
      const tahun = parseInt(get(row, "tahun")) || parseInt(defaults.tahun) || new Date().getFullYear();
      const progres = parseFloat(String(get(row, "progres") || 0).replace(/,/g, "")) || 0;
      const nomorKontrak = String(get(row, "nomorKontrak") || "").trim() || null;
      const noSPMK = String(get(row, "noSPMK") || "").trim() || null;
      const kegiatan = String(get(row, "kegiatan") || "").trim() || name;
      const kodeRekening = String(get(row, "kodeRekening") || "").trim() || null;
      const tanggalMulaiRaw = get(row, "tanggalMulai");
      const tanggalSelesaiRaw = get(row, "tanggalSelesai");

      // OPD
      const rawOpdCode = String(get(row, "opdCode") || "").trim();
      const resolvedOpdId = resolveOpd(rawOpdCode);
      if (!resolvedOpdId) {
        results.errors.push(`Baris ${rowNum}: OPD tidak ditemukan — pilih OPD default di form`);
        results.failed++;
        continue;
      }

      // Kategori
      const rawKategori = norm(get(row, "kategori") || "");
      const kategori = VALID_MAP[rawKategori] || inferKategori(name + " " + kegiatan);

      // Code
      const code = `PK-${tahun}-${String(autoCodeNum).padStart(4, "0")}`;
      autoCodeNum++;

      const paketData = {
        name, kegiatan, kodeRekening, kategori,
        opdId: resolvedOpdId,
        pagu, nilai, nilaiRealisasi, pelaksana, sumberDana,
        lokasi: lokasi || "-", keterangan, tahun, progres,
        nomorKontrak, noSPMK,
        tanggalMulai: parseDate(tanggalMulaiRaw),
        tanggalSelesai: parseDate(tanggalSelesaiRaw),
      };

      await prisma.paket.upsert({
        where: { code },
        create: { code, ...paketData },
        update: paketData,
      });
      results.success++;
    } catch (err) {
      results.failed++;
      results.errors.push(`Baris ${rowNum}: ${err.message}`);
    }
  }

  await log({
    userId: actorId,
    action: "IMPORT_PAKET",
    entity: "Paket",
    entityId: "BULK",
    details: { total: rows.length, success: results.success, failed: results.failed },
  });

  return results;
};
