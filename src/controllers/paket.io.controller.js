import * as exportService from "../services/export.service.js";
import * as importService from "../services/import.service.js";

const handleError = (error, res, next) => {
  if (error.statusCode)
    return res.status(error.statusCode).json({ error: error.message });
  next(error);
};

export const exportPaket = async (req, res, next) => {
  try {
    const { tahun, template } = req.query;
    const targetTahun = tahun || new Date().getFullYear();

    if (template === "true") {
      const buffer = await exportService.buildImportTemplate(targetTahun);
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      );
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=template_import_paket_${targetTahun}.xlsx`,
      );
      return res.send(Buffer.from(buffer));
    }

    const result = await exportService.buildExportReport({
      ...req.query,
      userRole: req.user.role,
      userOpdId: req.user.opdId,
    });

    if (!result)
      return res.status(404).json({ error: "Tidak ada data untuk diekspor" });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=${result.filename}`,
    );
    return res.send(Buffer.from(result.buffer));
  } catch (error) {
    handleError(error, res, next);
  }
};

export const importPaket = async (req, res, next) => {
  try {
    if (!req.file)
      return res.status(400).json({ error: "File Excel tidak ditemukan" });

    const result = await importService.importFromBuffer(
      req.file.buffer,
      req.user.id,
    );

    res.json({
      message: `Import selesai: ${result.success} berhasil, ${result.failed} gagal`,
      ...result,
    });
  } catch (error) {
    handleError(error, res, next);
  }
};
