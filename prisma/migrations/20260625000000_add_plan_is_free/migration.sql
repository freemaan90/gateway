-- AlterTable: add isFree flag to Plan
ALTER TABLE "Plan" ADD COLUMN "isFree" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex: unique constraint on Plan.name
CREATE UNIQUE INDEX "Plan_name_key" ON "Plan"("name");
