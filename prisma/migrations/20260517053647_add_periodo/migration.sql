/*
  Warnings:

  - Added the required column `periodoId` to the `Asignacion` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Asignacion" ADD COLUMN     "periodoId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "Periodo" (
    "id" TEXT NOT NULL,
    "semestre" TEXT NOT NULL,
    "escuela" TEXT NOT NULL,
    "ciclo" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Periodo_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Asignacion" ADD CONSTRAINT "Asignacion_periodoId_fkey" FOREIGN KEY ("periodoId") REFERENCES "Periodo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
