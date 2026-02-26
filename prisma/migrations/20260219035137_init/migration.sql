-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'OPD', 'VIEWER');

-- CreateEnum
CREATE TYPE "KategoriPaket" AS ENUM ('KONSTRUKSI', 'KONSULTANSI', 'BARANG', 'JASA_LAINNYA');

-- CreateEnum
CREATE TYPE "StatusPaket" AS ENUM ('PENDING', 'ACTIVE', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'VIEWER',
    "opd_id" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "opd" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kepala" TEXT,
    "contact" TEXT,
    "address" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "opd_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "paket" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kategori" "KategoriPaket" NOT NULL,
    "opd_id" TEXT NOT NULL,
    "kegiatan" TEXT NOT NULL,
    "lokasi" TEXT NOT NULL,
    "nilai" DOUBLE PRECISION NOT NULL,
    "nilai_realisasi" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "progres" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tahun" INTEGER NOT NULL,
    "status" "StatusPaket" NOT NULL DEFAULT 'PENDING',
    "tanggal_mulai" TIMESTAMP(3),
    "tanggal_selesai" TIMESTAMP(3),
    "keterangan" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "paket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "paket_progress" (
    "id" TEXT NOT NULL,
    "paket_id" TEXT NOT NULL,
    "progres" DOUBLE PRECISION NOT NULL,
    "nilai_realisasi" DOUBLE PRECISION NOT NULL,
    "keterangan" TEXT,
    "tanggal" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "paket_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents" (
    "id" TEXT NOT NULL,
    "paket_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "filepath" TEXT NOT NULL,
    "filesize" INTEGER NOT NULL,
    "mimetype" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entity_id" TEXT,
    "details" TEXT,
    "ip_address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "opd_code_key" ON "opd"("code");

-- CreateIndex
CREATE UNIQUE INDEX "paket_code_key" ON "paket"("code");

-- CreateIndex
CREATE INDEX "paket_opd_id_idx" ON "paket"("opd_id");

-- CreateIndex
CREATE INDEX "paket_kategori_idx" ON "paket"("kategori");

-- CreateIndex
CREATE INDEX "paket_tahun_idx" ON "paket"("tahun");

-- CreateIndex
CREATE INDEX "paket_status_idx" ON "paket"("status");

-- CreateIndex
CREATE INDEX "paket_progress_paket_id_idx" ON "paket_progress"("paket_id");

-- CreateIndex
CREATE INDEX "documents_paket_id_idx" ON "documents"("paket_id");

-- CreateIndex
CREATE INDEX "audit_logs_user_id_idx" ON "audit_logs"("user_id");

-- CreateIndex
CREATE INDEX "audit_logs_entity_idx" ON "audit_logs"("entity");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_opd_id_fkey" FOREIGN KEY ("opd_id") REFERENCES "opd"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "paket" ADD CONSTRAINT "paket_opd_id_fkey" FOREIGN KEY ("opd_id") REFERENCES "opd"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "paket_progress" ADD CONSTRAINT "paket_progress_paket_id_fkey" FOREIGN KEY ("paket_id") REFERENCES "paket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_paket_id_fkey" FOREIGN KEY ("paket_id") REFERENCES "paket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
