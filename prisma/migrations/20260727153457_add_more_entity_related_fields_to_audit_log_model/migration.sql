/*
  Warnings:

  - Added the required column `entityId` to the `AuditLog` table without a default value. This is not possible if the table is not empty.
  - Added the required column `entityTitle` to the `AuditLog` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "AuditLog" ADD COLUMN     "entityId" TEXT NOT NULL,
ADD COLUMN     "entityTitle" TEXT NOT NULL;
