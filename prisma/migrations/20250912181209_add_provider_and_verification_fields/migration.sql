-- AlterTable
ALTER TABLE "users" ADD COLUMN     "isVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "provider" TEXT NOT NULL DEFAULT 'local',
ADD COLUMN     "verificationToken" TEXT,
ALTER COLUMN "password" DROP NOT NULL;
