-- CreateEnum
CREATE TYPE "GalleryCategory" AS ENUM ('MARATHON', 'FUN_RUN', 'TRAIL_RUN', 'NIGHT_RUN');

-- CreateTable
CREATE TABLE "gallery_images" (
    "id" TEXT NOT NULL,
    "src" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "category" "GalleryCategory" NOT NULL,
    "description" TEXT,
    "participants" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "eventId" TEXT,
    "uploadedById" TEXT,

    CONSTRAINT "gallery_images_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "gallery_images_category_idx" ON "gallery_images"("category");

-- CreateIndex
CREATE INDEX "gallery_images_year_idx" ON "gallery_images"("year");

-- CreateIndex
CREATE INDEX "gallery_images_eventId_idx" ON "gallery_images"("eventId");

-- AddForeignKey
ALTER TABLE "gallery_images" ADD CONSTRAINT "gallery_images_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gallery_images" ADD CONSTRAINT "gallery_images_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
