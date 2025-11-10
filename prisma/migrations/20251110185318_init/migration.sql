/*
  Warnings:

  - You are about to alter the column `value` on the `events` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal`.
  - You are about to drop the column `email` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `password` on the `users` table. All the data in the column will be lost.
  - Made the column `value` on table `events` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterEnum
ALTER TYPE "EventType" ADD VALUE 'share';

-- DropIndex
DROP INDEX "users_email_key";

-- AlterTable
ALTER TABLE "events" ALTER COLUMN "value" SET NOT NULL,
ALTER COLUMN "value" SET DATA TYPE DECIMAL;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "email",
DROP COLUMN "password";
