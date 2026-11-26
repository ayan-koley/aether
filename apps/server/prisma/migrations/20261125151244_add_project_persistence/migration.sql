-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('CREATING', 'INITIALIZING', 'INSTALLING', 'RUNNING', 'STOPPED', 'FAILED', 'DELETED');

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "ProjectStatus" NOT NULL DEFAULT 'CREATING',
    "sandboxId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Project_sandboxId_key" ON "Project"("sandboxId");

-- CreateIndex
CREATE INDEX "Project_status_idx" ON "Project"("status");
