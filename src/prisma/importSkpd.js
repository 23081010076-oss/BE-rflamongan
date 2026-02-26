/**
 * Import data SKPD dari MySQL dump ke tabel opd PostgreSQL
 * Jalankan: node src/prisma/importSkpd.js
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const skpdData = [
  {
    id: 1,
    instansi: "Dinas Pendidikan",
    kode: "1.01.01",
    urusan: "Pendidikan",
  },
  { id: 2, instansi: "Dinas Kesehatan", kode: "1.01.02", urusan: "Kesehatan" },
  {
    id: 3,
    instansi: "Rumah Sakit Umum Daerah Dr. Soegiri",
    kode: "1.01.02",
    urusan: "Kesehatan",
  },
  {
    id: 4,
    instansi:
      "Badan Perencanaan Pembangunan Penelitian Dan Pengembangan Daerah",
    kode: "3.01.02",
    urusan: "Perencanaan Pembangunan",
  },
  {
    id: 5,
    instansi: "Rumah Sakit Umum Daerah Ngimbang",
    kode: "1.01.02",
    urusan: "Kesehatan",
  },
  {
    id: 6,
    instansi: "Dinas PU Bina Marga",
    kode: "1.01.03",
    urusan: "Pekerjaan Umum",
  },
  {
    id: 7,
    instansi: "DINAS PU SUMBER DAYA AIR",
    kode: "1.01.03",
    urusan: "Pekerjaan Umum",
  },
  {
    id: 8,
    instansi: "DINAS PERUMAHAN RAKYAT DAN KAWASAN PERMUKIMAN",
    kode: "1.01.04",
    urusan: "Pekerjaan Umum",
  },
  {
    id: 10,
    instansi: "Dinas Perhubungan",
    kode: "1.02.09",
    urusan: "Perhubungan",
  },
  {
    id: 11,
    instansi: "Dinas Lingkungan Hidup",
    kode: "1.02.05",
    urusan: "Lingkungan Hidup",
  },
  {
    id: 12,
    instansi: "DINAS KEPENDUDUKAN DAN PENCATATAN SIPIL",
    kode: "1.02.06",
    urusan: "Administrasi Kependudukan dan Pencatatan Sipil",
  },
  {
    id: 13,
    instansi: "Dinas Pemberdayaan Perempuan dan Perlindungan Anak",
    kode: "1.02.02",
    urusan: "Pemberdayaan Perempuan Dan Perlindungan Anak",
  },
  {
    id: 14,
    instansi: "Dinas Tenaga kerja",
    kode: "1.02.01",
    urusan: "Tenaga Kerja",
  },
  { id: 15, instansi: "DINAS SOSIAL", kode: "1.01.06", urusan: "Sosial" },
  {
    id: 16,
    instansi: "DINAS KOPERASI DAN USAHA MIKRO",
    kode: "1.02.11",
    urusan: "DINAS KOPERASI DAN USAHA MIKRO",
  },
  {
    id: 17,
    instansi: "Dinas Perindustrian dan Perdagangan",
    kode: "2.01.07",
    urusan: "Perdagangan",
  },
  {
    id: 18,
    instansi: "DINAS PENANAMAN MODAL DAN PELAYANAN TERPADU SATU PINTU",
    kode: "1.02.12",
    urusan: "Penanaman Modal",
  },
  {
    id: 19,
    instansi: "Dinas Pariwisata dan Kebudayaan",
    kode: "1.02.16",
    urusan: "Kebudayaan",
  },
  {
    id: 20,
    instansi: "Dinas Pemuda dan Olahraga",
    kode: "1.02.13",
    urusan: "Kepemudaan dan Olah Raga",
  },
  {
    id: 21,
    instansi: "Badan Kesatuan Bangsa dan Politik",
    kode: "5.01.01",
    urusan: "Kesatuan Bangsa dan Politik",
  },
  {
    id: 22,
    instansi: "Satuan Polisi Pamong Praja",
    kode: "1.01.05",
    urusan: "Ketentraman, Ketertiban Umum, dan Perlindungan Masyarakat",
  },
  {
    id: 23,
    instansi: "Badan Penanggulangan Bencana Daerah",
    kode: "1.01.05",
    urusan: "Ketentraman, Ketertiban Umum, dan Perlindungan Masyarakat",
  },
  {
    id: 24,
    instansi: "Sekretariat Dewan Perwakilan Rakyat Daerah",
    kode: "4.01.04",
    urusan: "Sekretariat DPRD",
  },
  {
    id: 25,
    instansi: "Kepala Daerah Dan Wakil Kepala Daerah",
    kode: "1.20.02",
    urusan:
      "Otonomi Daerah, Pemerintahan Umum, Administrasi  Keuangan Daerah, Perangkat Daerah, Kepegawaian dan Persandian",
  },
  {
    id: 26,
    instansi: "Sekretariat Daerah",
    kode: "4.01.03",
    urusan: "Sekretariat Daerah",
  },
  {
    id: 27,
    instansi: "Badan Pengelolaan Keuangan dan Aset Daerah",
    kode: "3.01.03",
    urusan: "Keuangan",
  },
  { id: 28, instansi: "Inspektorat", kode: "3.01.01", urusan: "Inspektorat" },
  {
    id: 29,
    instansi: "Badan Kepegawaian dan Pengembangan Sumber Daya Manusia",
    kode: "3.01.04",
    urusan: "Kepegawaian",
  },
  {
    id: 30,
    instansi: "Kecamatan Babat",
    kode: "6.01.01",
    urusan: "Kewilayahan",
  },
  {
    id: 31,
    instansi: "Kecamatan Bluluk",
    kode: "6.01.01",
    urusan: "Kewilayahan",
  },
  {
    id: 32,
    instansi: "Kecamatan Brondong",
    kode: "6.01.01",
    urusan: "Kewilayahan",
  },
  {
    id: 33,
    instansi: "Kecamatan Deket",
    kode: "6.01.01",
    urusan: "Kewilayahan",
  },
  {
    id: 34,
    instansi: "Kecamatan Glagah",
    kode: "6.01.01",
    urusan: "Kewilayahan",
  },
  {
    id: 35,
    instansi: "Kecamatan Kalitengah",
    kode: "6.01.01",
    urusan: "Kewilayahan",
  },
  {
    id: 36,
    instansi: "Kecamatan Karangbinangun",
    kode: "6.01.01",
    urusan: "Kewilayahan",
  },
  {
    id: 37,
    instansi: "Kecamatan Karanggeneng",
    kode: "6.01.01",
    urusan: "Kewilayahan",
  },
  {
    id: 38,
    instansi: "Kecamatan Kedungpring",
    kode: "6.01.01",
    urusan: "Kewilayahan",
  },
  {
    id: 39,
    instansi: "Kecamatan Kembangbahu",
    kode: "6.01.01",
    urusan: "Kewilayahan",
  },
  {
    id: 40,
    instansi: "Kecamatan Lamongan",
    kode: "6.01.01",
    urusan: "Kewilayahan",
  },
  {
    id: 41,
    instansi: "Kecamatan Laren",
    kode: "6.01.01",
    urusan: "Kewilayahan",
  },
  {
    id: 42,
    instansi: "Kecamatan Maduran",
    kode: "6.01.01",
    urusan: "Kewilayahan",
  },
  {
    id: 43,
    instansi: "Kecamatan Mantup",
    kode: "6.01.01",
    urusan: "Kewilayahan",
  },
  {
    id: 44,
    instansi: "Kecamatan Modo",
    kode: "6.01.01",
    urusan: "Kewilayahan",
  },
  {
    id: 45,
    instansi: "Kecamatan Ngimbang",
    kode: "6.01.01",
    urusan: "Kewilayahan",
  },
  {
    id: 46,
    instansi: "Kecamatan Paciran",
    kode: "6.01.01",
    urusan: "Kewilayahan",
  },
  {
    id: 47,
    instansi: "Kecamatan Pucuk",
    kode: "6.01.01",
    urusan: "Kewilayahan",
  },
  {
    id: 48,
    instansi: "Kecamatan Sambeng",
    kode: "6.01.01",
    urusan: "Kewilayahan",
  },
  {
    id: 49,
    instansi: "Kecamatan Sarirejo",
    kode: "6.01.01",
    urusan: "Kewilayahan",
  },
  {
    id: 50,
    instansi: "Kecamatan Sekaran",
    kode: "6.01.01",
    urusan: "Kewilayahan",
  },
  {
    id: 51,
    instansi: "Kecamatan Solokuro",
    kode: "6.01.01",
    urusan: "Kewilayahan",
  },
  {
    id: 52,
    instansi: "Kecamatan Sugio",
    kode: "6.01.01",
    urusan: "Kewilayahan",
  },
  {
    id: 53,
    instansi: "Kecamatan Sukodadi",
    kode: "6.01.01",
    urusan: "Kewilayahan",
  },
  {
    id: 54,
    instansi: "Kecamatan Sukorame",
    kode: "6.01.01",
    urusan: "Kewilayahan",
  },
  {
    id: 55,
    instansi: "Kecamatan Tikung",
    kode: "6.01.01",
    urusan: "Kewilayahan",
  },
  {
    id: 56,
    instansi: "Kecamatan Turi",
    kode: "6.01.01",
    urusan: "Kewilayahan",
  },
  {
    id: 58,
    instansi: "DINAS PEMBERDAYAAN MASYARAKAT DAN DESA",
    kode: "1.02.07",
    urusan: "Pemberdayaan Masyarakat dan Desa",
  },
  {
    id: 60,
    instansi: "DINAS KEARSIPAN DAN PERPUSTAKAAN DAERAH",
    kode: "1.02.18",
    urusan: "Kearsipan",
  },
  {
    id: 61,
    instansi: "Dinas Komunikasi dan Informatika",
    kode: "1.02.10",
    urusan: "Komunikasi dan Informatika",
  },
  {
    id: 62,
    instansi: "DINAS KETAHANAN PANGAN DAN PERTANIAN",
    kode: "2.01.03",
    urusan: "Pertanian",
  },
  {
    id: 63,
    instansi: "Dinas Peternakan Dan Kesehatan Hewan",
    kode: "2.01.03",
    urusan: "Pertanian",
  },
  {
    id: 64,
    instansi: "Dinas Perikanan",
    kode: "2.01.01",
    urusan: "Kelautan dan Perikanan",
  },
  {
    id: 65,
    instansi: "Badan Pendapatan Daerah",
    kode: "3.01.03",
    urusan: "Keuangan",
  },
  {
    id: 66,
    instansi: "DINAS PENGENDALIAN PENDUDUK DAN KELUARGA BERENCANA",
    kode: "1.02.08",
    urusan: "Pengendalian Penduduk dan Keluarga Berencana",
  },
  {
    id: 67,
    instansi: "Dinas Perpustakaan dan Kerasipan daerah",
    kode: "1.02.08",
    urusan: "Perspustakaan dan arsip",
  },
  {
    id: 83,
    instansi: "Rumah Sakit Umum Daerah Karangkembang",
    kode: "1.01.02",
    urusan: "Kesehatan",
  },
];

// Beberapa kode duplikat di data asli → tambah suffix agar unique
function makeUniqueCode(kode, instansi, seen) {
  // Ambil singkatan dari nama instansi (3 kata pertama) sebagai pembeda
  const suffix = instansi
    .replace(/[^a-zA-Z0-9 ]/g, "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
  const candidate = `${kode}-${suffix}`;
  if (!seen.has(candidate)) return candidate;
  // fallback: tambah angka
  let i = 2;
  while (seen.has(`${candidate}${i}`)) i++;
  return `${candidate}${i}`;
}

async function main() {
  console.log("🚀 Mulai import data SKPD → OPD...\n");

  const seen = new Set();
  let inserted = 0;
  let skipped = 0;

  for (const row of skpdData) {
    let code = row.kode;

    // Jika kode sudah pernah dipakai pada iterasi ini, buat unik
    if (seen.has(code)) {
      code = makeUniqueCode(row.kode, row.instansi, seen);
    }
    seen.add(code);

    try {
      await prisma.opd.upsert({
        where: { code },
        update: {
          name: row.instansi,
          // kepala, contact, address bisa diisi manual nanti
        },
        create: {
          code,
          name: row.instansi,
          isActive: true,
        },
      });
      console.log(`  ✅ [${code}] ${row.instansi}`);
      inserted++;
    } catch (err) {
      console.error(`  ❌ Gagal [${code}] ${row.instansi}: ${err.message}`);
      skipped++;
    }
  }

  console.log(`\n═══════════════════════════════════════`);
  console.log(`✅  Berhasil: ${inserted} OPD`);
  if (skipped) console.log(`⚠️  Gagal   : ${skipped} OPD`);
  console.log(`═══════════════════════════════════════`);
}

main()
  .catch((e) => {
    console.error("Fatal:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
