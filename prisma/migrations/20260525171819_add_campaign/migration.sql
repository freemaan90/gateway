-- CreateTable
CREATE TABLE "Campaign" (
    "id" SERIAL NOT NULL,
    "sessionId" TEXT NOT NULL,
    "total" INTEGER NOT NULL,
    "sent" INTEGER NOT NULL,
    "failed" INTEGER NOT NULL,
    "failedDetails" JSONB NOT NULL DEFAULT '[]',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "userId" INTEGER NOT NULL,

    CONSTRAINT "Campaign_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
