import * as XLSX from "xlsx";
import prisma from "./prisma.js";
import { log } from "./audit.service.js";

const VALID_KATEGORI = ["KONSTRUKSI", "KONSULTANSI", "BARANG", "JASA_LAINNYA"];

export const importFromBuffer = async (buffer, actorId) => {
  const wb = XLSX.read(buffer, { type: "buffer" });
  const ws = wb.Sheets[wb.SheetNames[0]];

  // Try to detect if file uses template (title+spacer on rows 1-2, header row 3)
  const rowsWithSkip = XLSX.utils.sheet_to_json(ws, { range: 2 });
  const rowsNoSkip = XLSX.utils.sheet_to_json(ws);
  const firstKeySkip = rowsWithSkip[0] ? Object.keys(rowsWithSkip[0])[0] : "";
  const isNewTemplate =
    firstKeySkip === "PAKET PEKERJAAN" || firstKeySkip === "PAKET_PEKERJAAN";
  const rows = isNewTemplate ? rowsWithSkip : rowsNoSkip;

  if (rows.length === 0) {
    const err = new Error("File tidak memiliki data");
    err.statusCode = 400;
    throw err;
  }

  // Build OPD lookup map
  const opds = await prisma.opd.findMany({ select: { id: true, code: true } });
  const opdMap = {};
  opds.forEach((o) => {
    opdMap[o.code.toUpperCase()] = o.id;
  });

  // Auto-increment code counter
  const latestPaket = await prisma.paket.findFirst({
    orderBy: { createdAt: "desc" },
    select: { code: true },
  });
  let autoCodeNum = 1;
  if (latestPaket?.code) {
    const match = latestPaket.code.match(/(\d+)$/);
    if (match) autoCodeNum = parseInt(match[1]) + 1;
  }

  const results = { success: 0, failed: 0, errors: [] };

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + (isNewTemplate ? 4 : 2); // human-readable row
    try {
      const name = String(
        row["PAKET PEKERJAAN"] || row["PAKET_PEKERJAAN"] || row.name || "",
      ).trim();
      const kegiatan = String(row["KEGIATAN"] || row.kegiatan || "").trim();
      const kodeRekening = String(
        row["KODE REKENING"] || row["KODE_REKENING"] || row.kode_rekening || "",
      ).trim();
      const opdCode = String(
        row["OPD"] || row["OPD_CODE"] || row.opd_code || "",
      )
        .trim()
        .toUpperCase();
      const kategori = String(row["KATEGORI"] || row.kategori || "")
        .trim()
        .toUpperCase();
      const pagu =
        parseFloat(
          row["PAGU ANGGARAN"] || row["PAGU_ANGGARAN"] || row.pagu || 0,
        ) || 0;
      const nilai =
        parseFloat(
          row["NILAI KONTRAK"] || row["NILAI_KONTRAK"] || row.nilai || 0,
        ) || 0;
      const nilaiRealisasi =
        parseFloat(
          row["NILAI REALISASI"] ||
            row["NILAI_REALISASI"] ||
            row.nilaiRealisasi ||
            0,
        ) || 0;
      const pelaksana =
        String(row["PELAKSANA"] || row.pelaksana || "").trim() || null;
      const sumberDana = String(
        row["SUMBER DANA"] || row["SUMBER_DANA"] || row.sumber_dana || "APBD",
      ).trim();
      const lokasi = String(row["LOKASI"] || row.lokasi || "").trim();
      const keterangan =
        String(row["KET"] || row.keterangan || "").trim() || null;
      const tahun =
        parseInt(row["TAHUN"] || row.tahun) || new Date().getFullYear();
      const progres =
        parseFloat(
          row["PROGRES FISIK"] || row["PROGRES_FISIK"] || row.progres || 0,
        ) || 0;
      const nomorKontrak =
        String(
          row["NOMOR KONTRAK"] ||
            row["NOMOR_KONTRAK"] ||
            row.nomor_kontrak ||
            "",
        ).trim() || null;
      const noSPMK =
        String(row["NO SPMK"] || row["NO_SPMK"] || row.no_spmk || "").trim() ||
        null;
      const tanggalMulaiRaw =
        row["SPMK MULAI"] || row["SPMK_MULAI"] || row.tanggal_mulai;
      const tanggalSelesaiRaw =
        row["SPMK SELESAI"] || row["SPMK_SELESAI"] || row.tanggal_selesai;

      if (!name) {
        results.errors.push(`Baris ${rowNum}: PAKET PEKERJAAN kosong`);
        results.failed++;
        continue;
      }
      if (!kegiatan) {
        results.errors.push(`Baris ${rowNum}: KEGIATAN kosong`);
        results.failed++;
        continue;
      }
      if (!kategori || !VALID_KATEGORI.includes(kategori)) {
        results.errors.push(
          `Baris ${rowNum}: KATEGORI tidak valid (${kategori})`,
        );
        results.failed++;
        continue;
      }
      if (!opdMap[opdCode]) {
        results.errors.push(
          `Baris ${rowNum}: OPD tidak ditemukan (${opdCode})`,
        );
        results.failed++;
        continue;
      }

      // Code selalu di-generate otomatis; tidak perlu kolom KODE PAKET
      const code = `PK-${tahun}-${String(autoCodeNum).padStart(4, "0")}`;
      autoCodeNum++;

      const parseDate = (raw) => {
        if (!raw) return null;
        const d =
          typeof raw === "number"
            ? new Date(Math.round((raw - 25569) * 86400 * 1000))
            : new Date(raw);
        return isNaN(d) ? null : d;
      };

      const paketData = {
        name,
        kegiatan: kegiatan || "-",
        kodeRekening: kodeRekening || null,
        kategori,
        opdId: opdMap[opdCode],
        pagu,
        nilai,
        nilaiRealisasi,
        pelaksana,
        sumberDana,
        lokasi: lokasi || "-",
        keterangan,
        tahun,
        progres,
        nomorKontrak,
        noSPMK,
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
    details: {
      total: rows.length,
      success: results.success,
      failed: results.failed,
    },
  });

  return results;
};
