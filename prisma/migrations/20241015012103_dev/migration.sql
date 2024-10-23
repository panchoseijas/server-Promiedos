/*
  Warnings:

  - You are about to drop the column `area` on the `Competition` table. All the data in the column will be lost.
  - Added the required column `country` to the `Competition` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Competition" DROP COLUMN "area",
ADD COLUMN     "country" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Team" ADD COLUMN     "logo" TEXT;