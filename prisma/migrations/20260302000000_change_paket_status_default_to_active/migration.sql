-- AlterTable: change default value of status column from 'PENDING' to 'ACTIVE'
ALTER TABLE "pakets" ALTER COLUMN "status" SET DEFAULT 'ACTIVE'::"StatusPaket";
