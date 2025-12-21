/*
  Warnings:

  - You are about to alter the column `score` on the `GradeRecord` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `DoublePrecision`.

*/
-- CreateEnum
CREATE TYPE "GradeStatus" AS ENUM ('SUBMITTED', 'PENDING', 'REVIEWED', 'REMARK_REQUESTED', 'REMARKED');

-- AlterTable
ALTER TABLE "GradeRecord" ADD COLUMN     "remark" TEXT,
ADD COLUMN     "status" "GradeStatus" NOT NULL DEFAULT 'SUBMITTED',
ALTER COLUMN "score" SET DATA TYPE DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "Period" ADD COLUMN     "classId" TEXT;

-- AlterTable
ALTER TABLE "School" ADD COLUMN     "attendanceConfig" JSONB DEFAULT '{"type": "PERIOD", "lockAfterMinutes": 30, "enableLateMarking": true}',
ADD COLUMN     "logoUrl" TEXT;

-- CreateIndex
CREATE INDEX "Period_classId_idx" ON "Period"("classId");

-- AddForeignKey
ALTER TABLE "Period" ADD CONSTRAINT "Period_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE SET NULL ON UPDATE CASCADE;
