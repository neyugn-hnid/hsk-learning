-- CreateTable
CREATE TABLE "SentencePracticeProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sentenceIndex" INTEGER NOT NULL DEFAULT 0,
    "results" JSONB,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SentencePracticeProgress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SentencePracticeProgress_userId_key" ON "SentencePracticeProgress"("userId");

-- AddForeignKey
ALTER TABLE "SentencePracticeProgress" ADD CONSTRAINT "SentencePracticeProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
