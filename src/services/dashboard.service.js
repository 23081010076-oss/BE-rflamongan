import prisma from "./prisma.js";

export const getStats = async (tahun) => {
  const currentYear = tahun ? parseInt(tahun) : new Date().getFullYear();

  const [
    konstruksi,
    konsultansi,
    barang,
    jasaLainnya,
    totalData,
    avgProgress,
    statusCounts,
  ] = await Promise.all([
    prisma.paket.count({
      where: { kategori: "KONSTRUKSI", tahun: currentYear },
    }),
    prisma.paket.count({
      where: { kategori: "KONSULTANSI", tahun: currentYear },
    }),
    prisma.paket.count({ where: { kategori: "BARANG", tahun: currentYear } }),
    prisma.paket.count({
      where: { kategori: "JASA_LAINNYA", tahun: currentYear },
    }),
    prisma.paket.aggregate({
      where: { tahun: currentYear },
      _sum: { nilai: true, nilaiRealisasi: true },
    }),
    prisma.paket.aggregate({
      where: { tahun: currentYear },
      _avg: { progres: true },
    }),
    prisma.paket.groupBy({
      by: ["status"],
      where: { tahun: currentYear },
      _count: true,
    }),
  ]);

  return {
    tahun: currentYear,
    kategori: {
      konstruksi,
      konsultansi,
      barang,
      jasaLainnya,
      total: konstruksi + konsultansi + barang + jasaLainnya,
    },
    nilai: {
      total: totalData._sum.nilai || 0,
      realisasi: totalData._sum.nilaiRealisasi || 0,
      persentase: totalData._sum.nilai
        ? (
            (totalData._sum.nilaiRealisasi / totalData._sum.nilai) *
            100
          ).toFixed(2)
        : 0,
    },
    progres: {
      average: avgProgress._avg.progres?.toFixed(2) || 0,
    },
    status: statusCounts.reduce((acc, item) => {
      acc[item.status.toLowerCase()] = item._count;
      return acc;
    }, {}),
  };
};

export const getChartData = async (tahun) => {
  const currentYear = tahun ? parseInt(tahun) : new Date().getFullYear();

  const [monthlyData, categoryData, opdDataRaw] = await Promise.all([
    prisma.$queryRaw`
      SELECT
        EXTRACT(MONTH FROM updated_at) as month,
        COUNT(*) as count,
        SUM(nilai_realisasi) as total_realisasi,
        AVG(progres) as avg_progres
      FROM paket
      WHERE tahun = ${currentYear}
      GROUP BY EXTRACT(MONTH FROM updated_at)
      ORDER BY month
    `,
    prisma.paket.groupBy({
      by: ["kategori"],
      where: { tahun: currentYear },
      _count: true,
      _sum: { nilai: true, nilaiRealisasi: true },
    }),
    prisma.paket.groupBy({
      by: ["opdId"],
      where: { tahun: currentYear },
      _count: true,
      _sum: { nilai: true, nilaiRealisasi: true },
      orderBy: { _sum: { nilai: "desc" } },
      take: 10,
    }),
  ]);

  const opdIds = opdDataRaw.map((item) => item.opdId);
  const opds = await prisma.opd.findMany({
    where: { id: { in: opdIds } },
    select: { id: true, name: true, code: true },
  });
  const opdMap = opds.reduce((acc, opd) => {
    acc[opd.id] = opd;
    return acc;
  }, {});

  return {
    monthly: monthlyData.map((item) => ({
      month: parseInt(item.month),
      count: parseInt(item.count),
      totalRealisasi: parseFloat(item.total_realisasi) || 0,
      avgProgres: parseFloat(item.avg_progres) || 0,
    })),
    category: categoryData.map((item) => ({
      kategori: item.kategori,
      count: item._count,
      totalNilai: item._sum.nilai || 0,
      totalRealisasi: item._sum.nilaiRealisasi || 0,
    })),
    opd: opdDataRaw.map((item) => ({
      opd: opdMap[item.opdId],
      count: item._count,
      totalNilai: item._sum.nilai || 0,
      totalRealisasi: item._sum.nilaiRealisasi || 0,
    })),
  };
};

export const getRecentUpdates = async (limit = 10) => {
  return prisma.paket.findMany({
    take: parseInt(limit),
    orderBy: { updatedAt: "desc" },
    include: { opd: { select: { name: true, code: true } } },
  });
};

export const getRekapData = async (tahun) => {
  const currentYear = tahun ? parseInt(tahun) : new Date().getFullYear();

  const data = await prisma.paket.groupBy({
    by: ["opdId"],
    where: { tahun: currentYear },
    _count: true,
    _sum: { pagu: true, nilai: true, nilaiRealisasi: true },
    _avg: { progres: true },
  });

  const opdIds = data.map((d) => d.opdId).filter(Boolean);
  const opds = await prisma.opd.findMany({
    where: { id: { in: opdIds } },
    select: { id: true, name: true, code: true },
  });
  const opdMap = opds.reduce((acc, o) => {
    acc[o.id] = o;
    return acc;
  }, {});

  const rows = data
    .filter((d) => d.opdId)
    .map((d) => ({
      opd: opdMap[d.opdId],
      jumlahKegiatan: d._count,
      paguAnggaran: d._sum.pagu || 0,
      nilaiKontrak: d._sum.nilai || 0,
      realisasiKeuangan: d._sum.nilaiRealisasi || 0,
      realisasiFisik: parseFloat((d._avg.progres || 0).toFixed(2)),
      pctKeuangan:
        d._sum.nilai > 0
          ? parseFloat(
              ((d._sum.nilaiRealisasi / d._sum.nilai) * 100).toFixed(2),
            )
          : 0,
    }))
    .sort((a, b) => b.nilaiKontrak - a.nilaiKontrak);

  const totals = rows.reduce(
    (acc, r) => {
      acc.jumlahKegiatan += r.jumlahKegiatan;
      acc.paguAnggaran += r.paguAnggaran;
      acc.nilaiKontrak += r.nilaiKontrak;
      acc.realisasiKeuangan += r.realisasiKeuangan;
      return acc;
    },
    { jumlahKegiatan: 0, paguAnggaran: 0, nilaiKontrak: 0, realisasiKeuangan: 0 },
  );
  totals.realisasiFisik =
    rows.length > 0
      ? parseFloat(
          (rows.reduce((s, r) => s + r.realisasiFisik, 0) / rows.length).toFixed(2),
        )
      : 0;
  totals.pctKeuangan =
    totals.nilaiKontrak > 0
      ? parseFloat(
          ((totals.realisasiKeuangan / totals.nilaiKontrak) * 100).toFixed(2),
        )
      : 0;

  return { tahun: currentYear, rows, totals };
};
