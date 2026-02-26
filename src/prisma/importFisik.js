/**
 * Import data tabel `fisik` MySQL → PostgreSQL
 *
 * Script ini melakukan dua hal sekaligus:
 *   1. Insert raw ke tabel `fisik` (mirror persis dari MySQL)
 *   2. Konversi + upsert ke tabel `paket` (linked ke OPD, enum, float, dst)
 *
 * Jalankan: node src/prisma/importFisik.js
 *
 * Untuk data besar (ribuan baris), ganti array `fisikRows` di bawah
 * dengan hasil parse dari file .sql Anda, atau hubungkan langsung ke MySQL
 * via mysql2 dan baca row-nya di sana.
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ─── DATA DARI MYSQL DUMP ──────────────────────────────────────────────
// Tambahkan semua baris INSERT di sini.
// Format: sesuai kolom tabel fisik MySQL persis.
const fisikRows = [
  {
    id: 138,
    jasa: "Konstruksi",
    th_anggaran: "2014",
    skpd: "Dinas PU Bina Marga",
    kegiatan:
      "Pembangunan Dinding Penahan Tanah  Desa Sumberdadi - Sumberkerep",
    lokasi: "Kec. Mantu",
    no_kontrak: "050 / 60 / SPK / PPK",
    tgl_kontrak: "2014-07-29",
    nilai_kontrak: "110,400,000.00",
    no_spnk: "050/70/SPMK/PPK/APBD",
    tgl_spnk: "2014-04-30",
    nilai_spnk: "2014-09-26", // tipe date di MySQL (anomali struktur asli)
    pagu: "111,000,000.00",
    hps: "APBD",
    pelaksana: "CV. ABBAS UTAMA",
    rencana: "05",
    realisasi: "103103011705",
    deviasi: "0",
    foto1: "",
    foto2: "",
    foto3: "",
    foto4: "",
    tgl_update: "2014-07-11",
    prosentase: "15",
  },
  {
    id: 139,
    jasa: "Konstruksi",
    th_anggaran: "2014",
    skpd: "Dinas PU Bina Marga",
    kegiatan:
      "Pembangunan Dinding Penahan Tanah  Desa Sumberdadi - Sumberkerep",
    lokasi: "Kec. Mantu",
    no_kontrak: "050 / 60 / SPK / PPK",
    tgl_kontrak: "2014-07-29",
    nilai_kontrak: "110,400,000.00",
    no_spnk: "050/70/SPMK/PPK/APBD",
    tgl_spnk: "2014-04-30",
    nilai_spnk: "2014-09-26",
    pagu: "111,000,000.00",
    hps: "APBD",
    pelaksana: "CV. ABBAS UTAMA",
    rencana: "06",
    realisasi: "103103011705",
    deviasi: "15",
    foto1: "",
    foto2: "",
    foto3: "",
    foto4: "",
    tgl_update: "2014-07-11",
    prosentase: "85",
  },
  {
    id: 140,
    jasa: "Konstruksi",
    th_anggaran: "2014",
    skpd: "Dinas PU Bina Marga",
    kegiatan: "Peningkatan Jalan Poros Desa Strategis Sambeng - Candisari",
    lokasi: "Kec. Sambeng",
    no_kontrak: "050/80/KONTRAK/PPK/A",
    tgl_kontrak: "2014-05-26",
    nilai_kontrak: "854,983,000.00",
    no_spnk: "050/89/SPMK/PPK/APBD",
    tgl_spnk: "2014-05-26",
    nilai_spnk: "2014-10-22",
    pagu: "864,000,000.00",
    hps: "APBD",
    pelaksana: "CV. TERANG ABADI",
    rencana: "05",
    realisasi: "103103011807",
    deviasi: "0",
    foto1: "",
    foto2: "",
    foto3: "",
    foto4: "",
    tgl_update: "2014-07-11",
    prosentase: "0",
  },
  {
    id: 142,
    jasa: "Konsultasi",
    th_anggaran: "2014",
    skpd: "Bagian Pemerintahan",
    kegiatan: "Penilaian Panji-panji Keberhasilan Pembangunan Kecamatan",
    lokasi: "kecamatan lamongan",
    no_kontrak: "602.2/02/413.011/PPK",
    tgl_kontrak: "2014-04-24",
    nilai_kontrak: "81,775,100.00",
    no_spnk: "602.2/02/413.011/PPK",
    tgl_spnk: "2014-04-24",
    nilai_spnk: "2014-06-22",
    pagu: "82,000,000.00",
    hps: "APBD",
    pelaksana: "CV. PELITA PERSADA",
    rencana: "07",
    realisasi: "1.06.1.20.03.21.26.5.2.2.21.01",
    deviasi: "0",
    foto1: "",
    foto2: "",
    foto3: "",
    foto4: "",
    tgl_update: "2014-07-15",
    prosentase: "100",
  },
  {
    id: 143,
    jasa: "Konstruksi",
    th_anggaran: "2014",
    skpd: "Dinas PU Pengairan",
    kegiatan: "Pengerukan Waduk Cangkring",
    lokasi: "Desa Cangkring, Kec. Bluluk",
    no_kontrak: "050/17.SPK/26.02/413",
    tgl_kontrak: "2014-03-19",
    nilai_kontrak: "81,000,000.00",
    no_spnk: "050/17.SPK/26.02/413",
    tgl_spnk: "2014-03-19",
    nilai_spnk: "2014-04-05",
    pagu: "81,000,000.00",
    hps: "APBD Kabupaten Lamon",
    pelaksana: "Swakelola Dinas",
    rencana: "07",
    realisasi: "Bank Jatim Cabang Lamongan",
    deviasi: "0",
    foto1: "",
    foto2: "",
    foto3: "",
    foto4: "",
    tgl_update: "2014-07-16",
    prosentase: "100",
  },
];

// ─── HELPERS ──────────────────────────────────────────────────────────

/** "110,400,000.00" → 110400000 */
function parseAngka(str) {
  if (!str) return 0;
  const cleaned = String(str).replace(/,/g, "").trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

/** Map jasa MySQL → KategoriPaket enum */
function mapKategori(jasa) {
  const j = (jasa || "").toLowerCase();
  if (j.includes("konstruksi")) return "KONSTRUKSI";
  if (j.includes("konsultan") || j.includes("konsultasi")) return "KONSULTANSI";
  if (j.includes("barang")) return "BARANG";
  return "JASA_LAINNYA";
}

/** Tentukan status berdasarkan prosentase */
function mapStatus(pct) {
  if (pct >= 100) return "COMPLETED";
  if (pct > 0) return "ACTIVE";
  return "PENDING";
}

// Alias eksplisit: nama MySQL → potongan nama di DB
const SKPD_ALIAS = {
  "dinas pu pengairan": "sumber daya air",
  pengairan: "sumber daya air",
  "bagian pemerintahan": "sekretariat daerah",
  "bag. pemerintahan": "sekretariat daerah",
  "dinas pekerjaan umum": "bina marga",
  dpu: "bina marga",
};

/** Cari OPD di DB berdasarkan nama (partial, case-insensitive) */
async function findOpd(skpdName, opdCache) {
  if (opdCache[skpdName]) return opdCache[skpdName];

  // Coba exact match dulu
  let opd = await prisma.opd.findFirst({
    where: { name: { equals: skpdName, mode: "insensitive" } },
  });

  if (!opd) {
    // Cek alias mapping
    const alias = SKPD_ALIAS[skpdName.toLowerCase()];
    if (alias) {
      opd = await prisma.opd.findFirst({
        where: { name: { contains: alias, mode: "insensitive" } },
      });
    }
  }

  if (!opd) {
    // Ambil kata yang cukup unik (≥6 char), skip kata umum
    const SKIP = new Set([
      "dinas",
      "badan",
      "bagian",
      "kantor",
      "urusan",
      "bidang",
    ]);
    const words = skpdName
      .split(/\s+/)
      .filter((w) => w.length >= 6 && !SKIP.has(w.toLowerCase()));
    for (const word of words) {
      opd = await prisma.opd.findFirst({
        where: { name: { contains: word, mode: "insensitive" } },
      });
      if (opd) break;
    }
  }

  if (opd) opdCache[skpdName] = opd;
  return opd;
}

// ─── MAIN ─────────────────────────────────────────────────────────────

async function main() {
  console.log("🚀 Import data fisik MySQL → PostgreSQL\n");

  // Cache hasil lookup OPD agar tidak query berulang
  const opdCache = {};

  // Buat OPD fallback jika tidak ditemukan sama sekali
  let defaultOpd = await prisma.opd.findFirst({ where: { isActive: true } });

  let rawOk = 0,
    rawSkip = 0;
  let paketOk = 0,
    paketSkip = 0;

  for (const row of fisikRows) {
    // ── 1. Insert ke tabel fisik (raw) ──────────────────────────────
    try {
      await prisma.fisik.upsert({
        where: { id: row.id },
        update: {}, // tidak timpa jika sudah ada
        create: {
          id: row.id,
          jasa: row.jasa,
          thAnggaran: row.th_anggaran,
          skpd: row.skpd,
          kegiatan: row.kegiatan,
          lokasi: row.lokasi,
          noKontrak: row.no_kontrak,
          tglKontrak: new Date(row.tgl_kontrak),
          nilaiKontrak: row.nilai_kontrak,
          noSpnk: row.no_spnk,
          tglSpnk: new Date(row.tgl_spnk),
          nilaiSpnk: new Date(row.nilai_spnk), // anomali tipe di MySQL
          pagu: row.pagu,
          hps: row.hps,
          pelaksana: row.pelaksana,
          rencana: row.rencana,
          realisasi: row.realisasi,
          deviasi: row.deviasi,
          foto1: row.foto1,
          foto2: row.foto2,
          foto3: row.foto3,
          foto4: row.foto4,
          tglUpdate: new Date(row.tgl_update),
          prosentase: row.prosentase,
        },
      });
      rawOk++;
    } catch (err) {
      console.warn(`  ⚠️  Fisik raw id=${row.id}: ${err.message}`);
      rawSkip++;
    }

    // ── 2. Konversi ke tabel paket ──────────────────────────────────
    const opd = await findOpd(row.skpd, opdCache);
    if (!opd && !defaultOpd) {
      console.warn(`  ⚠️  OPD tidak ditemukan: "${row.skpd}" — lewati paket`);
      paketSkip++;
      continue;
    }
    const targetOpd = opd || defaultOpd;

    const nilai = parseAngka(row.nilai_kontrak);
    const pagu = parseAngka(row.pagu);
    const progres = parseFloat(row.prosentase) || 0;
    // nilaiRealisasi → estimasi dari progres × nilai (data asli tidak ada field ini)
    const nilaiRealisasi = Math.round((progres / 100) * nilai);
    const tahun = parseInt(row.th_anggaran) || new Date().getFullYear();
    const kategori = mapKategori(row.jasa);
    const status = mapStatus(progres);

    // code = unik per row menggunakan id fisik
    const contractSlug = (row.no_kontrak || "")
      .replace(/[^a-zA-Z0-9\-_\/]/g, "")
      .slice(0, 30);
    const code = contractSlug ? `${contractSlug}-${row.id}` : `FISIK-${row.id}`;

    try {
      await prisma.paket.upsert({
        where: { code },
        update: {
          progres,
          nilaiRealisasi,
          status,
          updatedAt: new Date(row.tgl_update),
        },
        create: {
          code,
          name: row.kegiatan,
          kategori,
          opdId: targetOpd.id,
          kegiatan: row.kegiatan,
          lokasi: row.lokasi,
          nilai,
          pagu,
          nilaiRealisasi,
          progres,
          tahun,
          status,
          nomorKontrak: row.no_kontrak,
          noSPMK: row.no_spnk,
          pelaksana: row.pelaksana,
          sumberDana: row.hps || "APBD",
          tanggalMulai: new Date(row.tgl_kontrak),
          tanggalSelesai: new Date(row.nilai_spnk), // tgl selesai dari nilai_spnk
          createdAt: new Date(row.tgl_update),
          updatedAt: new Date(row.tgl_update),
        },
      });
      console.log(
        `  ✅ [${kategori}] ${row.kegiatan.slice(0, 60)} (${progres}%) → OPD: ${targetOpd.name.slice(0, 30)}`,
      );
      paketOk++;
    } catch (err) {
      console.error(`  ❌ Paket id=${row.id}: ${err.message}`);
      paketSkip++;
    }
  }

  console.log(`
═══════════════════════════════════════════════
 Tabel fisik  → ✅ ${rawOk}  ⚠️  ${rawSkip} gagal
 Tabel paket  → ✅ ${paketOk}  ⚠️  ${paketSkip} gagal
═══════════════════════════════════════════════`);
}

main()
  .catch((e) => {
    console.error("Fatal:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
