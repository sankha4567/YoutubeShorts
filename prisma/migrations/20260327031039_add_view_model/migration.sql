-- CreateTable
CREATE TABLE "View" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "shortId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "View_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "View_shortId_idx" ON "View"("shortId");

-- CreateIndex
CREATE UNIQUE INDEX "View_userId_shortId_key" ON "View"("userId", "shortId");

-- AddForeignKey
ALTER TABLE "View" ADD CONSTRAINT "View_shortId_fkey" FOREIGN KEY ("shortId") REFERENCES "Short"("id") ON DELETE CASCADE ON UPDATE CASCADE;
