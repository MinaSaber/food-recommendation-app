/*
  Warnings:

  - You are about to drop the column `address` on the `restaurants` table. All the data in the column will be lost.
  - You are about to drop the column `avg_price` on the `restaurants` table. All the data in the column will be lost.
  - You are about to drop the column `avg_price_level` on the `restaurants` table. All the data in the column will be lost.
  - You are about to drop the column `opening_hours` on the `restaurants` table. All the data in the column will be lost.
  - You are about to drop the column `phone` on the `restaurants` table. All the data in the column will be lost.
  - You are about to drop the column `website` on the `restaurants` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "restaurants" DROP COLUMN "address",
DROP COLUMN "avg_price",
DROP COLUMN "avg_price_level",
DROP COLUMN "opening_hours",
DROP COLUMN "phone",
DROP COLUMN "website";
