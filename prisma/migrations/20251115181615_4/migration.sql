/*
  Warnings:

  - The `ingredients` column on the `food_items` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "food_items" DROP COLUMN "ingredients",
ADD COLUMN     "ingredients" TEXT[];
