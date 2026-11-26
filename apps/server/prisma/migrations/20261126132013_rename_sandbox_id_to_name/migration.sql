/*
  Warnings:

  - You are about to drop the column `sandboxId` on the `Project` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[sandboxName]` on the table `Project` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Project_sandboxId_key";

-- DropIndex
DROP INDEX "Project_status_idx";

-- AlterTable
ALTER TABLE "Project" DROP COLUMN "sandboxId",
ADD COLUMN     "sandboxName" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Project_sandboxName_key" ON "Project"("sandboxName");
