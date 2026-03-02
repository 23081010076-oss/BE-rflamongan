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
  for (let r = 0; r < Math.min(raw.length, 20); r++) {
    const cells = raw[r].map((c) => norm(c));
    const hits = cells.filter((c) => KEYWORDS.some((k) => c === k || c.includes(k)));
    if (hits.length >= 2) return r;
  }
  return 0;
};

// Scan rows ABOVE the header row for an OPD banner like:
//   "OPD : DINAS BINA MARGA, CIPTA KARYA DAN TATA RUANG"
//   "PD : DINAS PENDIDIKAN"
const scanBannerOpd = (rawRows, headerRowIdx) => {
  for (let r = 0; r < Math.min(headerRowIdx, rawRows.length); r++) {
    for (const cell of rawRows[r]) {
      const s = String(cell ?? "").trim();
      // Match "OPD : xxx" or "PD : xxx" or "INSTANSI : xxx"
      const m = s.match(/^(?:OPD|PD|INSTANSI)\s*[:\-–]\s*(.+)/i);
      if (m) return m[1].trim();
    }
  }
  return null;
};

// OPD matching by word-overlap score (requires ≥2 matching significant words)
const resolveOpdByScore = (rawName, opds) => {
  if (!rawName) return null;
  const candidateWords = norm(rawName).split(" ").filter((w) => w.length > 3);
  let bestId = null;
  let bestScore = 0;
  for (const o of opds) {
    const nameWords = norm(o.name).split(" ").filter((w) => w.length > 3);
    const score = candidateWords.filter((w) => nameWords.includes(w)).length;
    if (score > bestScore) {
      bestScore = score;
      bestId = o.id;
    }
  }
  // require at least 2 overlapping meaningful words
  return bestScore >= 2 ? bestId : null;
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

// Determine if a row is a section/group header rather than real data.
// Returns parsed section info or false.
const parseSectionHeader = (name) => {
  if (!name) return false;
  const n = String(name).trim();
  // Rows starting with ":" are section headers: ": 1.03.03.2.01.0028 Nama Sub-Kegiatan"
  if (n.startsWith(":")) {
    const stripped = n.replace(/^[:\s]+/, "");
    const m = stripped.match(/^([\d.]+)\s*(.*)/);
    if (m) return { kodeRekening: m[1].trim(), kegiatan: m[2].trim() || stripped };
    return { kodeRekening: null, kegiatan: stripped };
  }
  // Standalone kode rekening rows like "1.03.03.2.01.0028 Nama"
  const m2 = n.match(/^(\d+\.\d+\.\d+[\d.]*)\s+(.*)/);
  if (m2) return { kodeRekening: m2[1].trim(), kegiatan: m2[2].trim() };
  return false;
};

// Detect total/subtotal summary rows that should never be imported
const isTotalRow = (name) => {
  if (!name) return false;
  const n = norm(name);
  return /^(JUMLAH|TOTAL|SUB TOTAL|SUBTOTAL|GRAND TOTAL|JUMLAH TOTAL|REKAPITULASI|REKAP)(\s|$)/.test(n);
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

  // 1. Read all raw rows for banner scanning + header detection
  const rawAll = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });

  // 2. Auto-detect header row
  const headerRowIdx = detectHeaderRow(ws);

  // 3. Scan banner rows ABOVE the header for "OPD : <name>"
  const bannerOpdName = scanBannerOpd(rawAll, headerRowIdx);

  // 4. Load all OPDs from DB
  const opds = await prisma.opd.findMany({ select: { id: true, code: true, name: true } });
  const opdByCode = {};
  opds.forEach((o) => { opdByCode[norm(o.code)] = o.id; });

  // Resolve OPD: exact code match → word-score match → defaults.opdId
  const resolveOpd = (rawValue) => {
    if (rawValue) {
      const n = norm(rawValue);
      if (opdByCode[n]) return opdByCode[n];
      const byScore = resolveOpdByScore(rawValue, opds);
      if (byScore) return byScore;
    }
    return null;
  };

  // Determine sheet-level default OPD:
  //   1. banner row from Excel  2. default from form
  const sheetOpdId =
    (bannerOpdName ? resolveOpd(bannerOpdName) : null) ||
    defaults.opdId ||
    null;

  // 5. Parse data rows
  const rows = XLSX.utils.sheet_to_json(ws, { range: headerRowIdx, defval: "" });

  if (rows.length === 0) {
    const err = new Error("File tidak memiliki data");
    err.statusCode = 400;
    throw err;
  }

  // 6. Build flexible column mapping from actual headers
  const colMap = buildHeaderMap(rows[0]);

  const get = (row, key) => {
    const header = colMap[key];
    return header !== undefined ? row[header] : "";
  };

  // 7. Auto-increment code
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

  // Track current section header for grouping
  let currentSection = { kodeRekening: null, kegiatan: null };

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

      // Check if this is a section header row → update context, don't import
      const section = parseSectionHeader(rawName);
      if (section) {
        currentSection = section;
        continue;
      }

      // Skip total/subtotal summary rows
      if (isTotalRow(rawName)) continue;

      // Skip fully blank rows
      if (!rawName) continue;

      const pagu = parseFloat(String(get(row, "pagu") || 0).replace(/,/g, "")) || 0;
      const nilai = parseFloat(String(get(row, "nilai") || 0).replace(/,/g, "")) || 0;

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
      const tanggalMulaiRaw = get(row, "tanggalMulai");
      const tanggalSelesaiRaw = get(row, "tanggalSelesai");

      // Inherit section header's kode rekening and kegiatan for this row
      const kegiatan =
        String(get(row, "kegiatan") || "").trim() || currentSection.kegiatan || name;
      const kodeRekening =
        String(get(row, "kodeRekening") || "").trim() || currentSection.kodeRekening || null;

      // OPD: per-row column → sheet banner → form default
      const rawOpdCode = String(get(row, "opdCode") || "").trim();
      const resolvedOpdId =
        (rawOpdCode ? resolveOpd(rawOpdCode) : null) || sheetOpdId;
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
        status: "ACTIVE",
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
