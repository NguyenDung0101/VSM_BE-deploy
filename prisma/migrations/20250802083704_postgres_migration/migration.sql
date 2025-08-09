-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'EDITOR', 'ADMIN');

-- CreateEnum
CREATE TYPE "EventCategory" AS ENUM ('MARATHON', 'HALF_MARATHON', 'FIVE_K', 'TEN_K', 'FUN_RUN', 'TRAIL_RUN', 'NIGHT_RUN');

-- CreateEnum
CREATE TYPE "EventStatus" AS ENUM ('UPCOMING', 'ONGOING', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ExperienceLevel" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED');

-- CreateEnum
CREATE TYPE "RegistrationStatus" AS ENUM ('PENDING', 'CONFIRMED', 'WAITLIST', 'CANCELLED');

-- CreateEnum
CREATE TYPE "NewsCategory" AS ENUM ('TRAINING', 'NUTRITION', 'EVENTS', 'TIPS');

-- CreateEnum
CREATE TYPE "NewsStatus" AS ENUM ('DRAFT', 'PUBLISHED');

-- CreateEnum
CREATE TYPE "CommentStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "phone" TEXT,
    "avatar" TEXT,
    "avatarId" TEXT,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "homepages" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "homepages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "homepage_sections" (
    "id" TEXT NOT NULL,
    "homepageId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "name" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT,

    CONSTRAINT "homepage_sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hero_sections" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT NOT NULL,
    "subtitle1" TEXT,
    "backgroundImage" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "logo" TEXT,
    "primaryButtonText" TEXT NOT NULL,
    "showAnimations" BOOLEAN NOT NULL DEFAULT true,
    "sectionId" TEXT NOT NULL,

    CONSTRAINT "hero_sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "about_sections" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "title1" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "backgroundColor" TEXT,
    "sectionId" TEXT NOT NULL,

    CONSTRAINT "about_sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "events_sections" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "title1" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "backgroundColor" TEXT,
    "showViewAllButton" BOOLEAN NOT NULL DEFAULT true,
    "sectionId" TEXT NOT NULL,

    CONSTRAINT "events_sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "news_sections" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "title1" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "postsPerRow" INTEGER NOT NULL DEFAULT 3,
    "showViewAllButton" BOOLEAN NOT NULL DEFAULT true,
    "sectionId" TEXT NOT NULL,

    CONSTRAINT "news_sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "team_sections" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "backgroundColor" TEXT,
    "membersPerRow" INTEGER NOT NULL DEFAULT 4,
    "sectionId" TEXT NOT NULL,

    CONSTRAINT "team_sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gallery_sections" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "autoPlay" BOOLEAN NOT NULL DEFAULT false,
    "showControls" BOOLEAN NOT NULL DEFAULT true,
    "sectionId" TEXT NOT NULL,

    CONSTRAINT "gallery_sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cta_sections" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "buttonText" TEXT NOT NULL,
    "backgroundColor" TEXT,
    "sectionId" TEXT NOT NULL,

    CONSTRAINT "cta_sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "about_features" (
    "id" TEXT NOT NULL,
    "features" JSONB NOT NULL,
    "customClasses" TEXT,
    "sectionId" TEXT NOT NULL,

    CONSTRAINT "about_features_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "countdown_timers" (
    "id" TEXT NOT NULL,
    "eventDate" TEXT NOT NULL,
    "customClasses" TEXT,
    "sectionId" TEXT NOT NULL,

    CONSTRAINT "countdown_timers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sports_community_stories" (
    "id" TEXT NOT NULL,
    "subtitle" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "paragraph1" TEXT NOT NULL,
    "paragraph2" TEXT NOT NULL,
    "paragraph3" TEXT NOT NULL,
    "paragraph4" TEXT NOT NULL,
    "image" TEXT NOT NULL,
    "statsValue" TEXT NOT NULL,
    "statsLabel" TEXT NOT NULL,
    "customClasses" TEXT,
    "sectionId" TEXT NOT NULL,

    CONSTRAINT "sports_community_stories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stats_sections" (
    "id" TEXT NOT NULL,
    "stats" JSONB NOT NULL,
    "customClasses" TEXT,
    "sectionId" TEXT NOT NULL,

    CONSTRAINT "stats_sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "images" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "userId" TEXT,
    "eventId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "events" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "location" TEXT NOT NULL,
    "imageEvent" TEXT,
    "maxParticipants" INTEGER NOT NULL,
    "currentParticipants" INTEGER NOT NULL DEFAULT 0,
    "category" "EventCategory" NOT NULL,
    "status" "EventStatus" NOT NULL DEFAULT 'UPCOMING',
    "distance" TEXT,
    "registrationFee" INTEGER DEFAULT 0,
    "requirements" TEXT,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "registrationDeadline" TIMESTAMP(3),
    "organizer" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "authorId" TEXT NOT NULL,
    "imageId" TEXT,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_registrations" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "emergencyContact" TEXT NOT NULL,
    "emergencyPhone" TEXT,
    "medicalConditions" TEXT,
    "experience" "ExperienceLevel" NOT NULL,
    "status" "RegistrationStatus" NOT NULL DEFAULT 'PENDING',
    "registeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "eventId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "event_registrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "news" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "excerpt" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "cover" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "category" "NewsCategory" NOT NULL,
    "views" INTEGER NOT NULL DEFAULT 0,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "status" "NewsStatus" NOT NULL DEFAULT 'DRAFT',
    "tags" TEXT,
    "readingTime" INTEGER DEFAULT 5,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "news_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comments" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "newsId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "CommentStatus" NOT NULL DEFAULT 'PENDING',
    "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "likes" (
    "id" TEXT NOT NULL,
    "newsId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "likes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_avatarId_key" ON "users"("avatarId");

-- CreateIndex
CREATE UNIQUE INDEX "homepages_name_key" ON "homepages"("name");

-- CreateIndex
CREATE INDEX "homepage_sections_homepageId_order_idx" ON "homepage_sections"("homepageId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "hero_sections_sectionId_key" ON "hero_sections"("sectionId");

-- CreateIndex
CREATE UNIQUE INDEX "about_sections_sectionId_key" ON "about_sections"("sectionId");

-- CreateIndex
CREATE UNIQUE INDEX "events_sections_sectionId_key" ON "events_sections"("sectionId");

-- CreateIndex
CREATE UNIQUE INDEX "news_sections_sectionId_key" ON "news_sections"("sectionId");

-- CreateIndex
CREATE UNIQUE INDEX "team_sections_sectionId_key" ON "team_sections"("sectionId");

-- CreateIndex
CREATE UNIQUE INDEX "gallery_sections_sectionId_key" ON "gallery_sections"("sectionId");

-- CreateIndex
CREATE UNIQUE INDEX "cta_sections_sectionId_key" ON "cta_sections"("sectionId");

-- CreateIndex
CREATE UNIQUE INDEX "about_features_sectionId_key" ON "about_features"("sectionId");

-- CreateIndex
CREATE UNIQUE INDEX "countdown_timers_sectionId_key" ON "countdown_timers"("sectionId");

-- CreateIndex
CREATE UNIQUE INDEX "sports_community_stories_sectionId_key" ON "sports_community_stories"("sectionId");

-- CreateIndex
CREATE UNIQUE INDEX "stats_sections_sectionId_key" ON "stats_sections"("sectionId");

-- CreateIndex
CREATE UNIQUE INDEX "images_userId_key" ON "images"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "images_eventId_key" ON "images"("eventId");

-- CreateIndex
CREATE UNIQUE INDEX "events_imageId_key" ON "events"("imageId");

-- CreateIndex
CREATE UNIQUE INDEX "event_registrations_eventId_userId_key" ON "event_registrations"("eventId", "userId");

-- CreateIndex
CREATE INDEX "news_category_featured_idx" ON "news"("category", "featured");

-- CreateIndex
CREATE INDEX "news_authorId_idx" ON "news"("authorId");

-- CreateIndex
CREATE INDEX "comments_newsId_idx" ON "comments"("newsId");

-- CreateIndex
CREATE INDEX "comments_userId_idx" ON "comments"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "likes_newsId_userId_key" ON "likes"("newsId", "userId");

-- AddForeignKey
ALTER TABLE "homepage_sections" ADD CONSTRAINT "homepage_sections_homepageId_fkey" FOREIGN KEY ("homepageId") REFERENCES "homepages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "homepage_sections" ADD CONSTRAINT "homepage_sections_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hero_sections" ADD CONSTRAINT "hero_sections_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "homepage_sections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "about_sections" ADD CONSTRAINT "about_sections_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "homepage_sections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events_sections" ADD CONSTRAINT "events_sections_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "homepage_sections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "news_sections" ADD CONSTRAINT "news_sections_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "homepage_sections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_sections" ADD CONSTRAINT "team_sections_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "homepage_sections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gallery_sections" ADD CONSTRAINT "gallery_sections_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "homepage_sections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cta_sections" ADD CONSTRAINT "cta_sections_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "homepage_sections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "about_features" ADD CONSTRAINT "about_features_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "homepage_sections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "countdown_timers" ADD CONSTRAINT "countdown_timers_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "homepage_sections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sports_community_stories" ADD CONSTRAINT "sports_community_stories_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "homepage_sections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stats_sections" ADD CONSTRAINT "stats_sections_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "homepage_sections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "images" ADD CONSTRAINT "images_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "images" ADD CONSTRAINT "images_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_registrations" ADD CONSTRAINT "event_registrations_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_registrations" ADD CONSTRAINT "event_registrations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "news" ADD CONSTRAINT "news_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_newsId_fkey" FOREIGN KEY ("newsId") REFERENCES "news"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "likes" ADD CONSTRAINT "likes_newsId_fkey" FOREIGN KEY ("newsId") REFERENCES "news"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "likes" ADD CONSTRAINT "likes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
