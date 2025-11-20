/*
  Warnings:

  - You are about to drop the `Booking` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ConversationContext` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Inspector` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `InspectorAvailability` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Booking" DROP CONSTRAINT "Booking_customer_id_fkey";

-- DropForeignKey
ALTER TABLE "Booking" DROP CONSTRAINT "Booking_inspector_id_fkey";

-- DropForeignKey
ALTER TABLE "ConversationContext" DROP CONSTRAINT "ConversationContext_customer_id_fkey";

-- DropForeignKey
ALTER TABLE "InspectorAvailability" DROP CONSTRAINT "InspectorAvailability_booking_id_fkey";

-- DropForeignKey
ALTER TABLE "InspectorAvailability" DROP CONSTRAINT "InspectorAvailability_inspector_id_fkey";

-- DropTable
DROP TABLE "Booking";

-- DropTable
DROP TABLE "ConversationContext";

-- DropTable
DROP TABLE "Inspector";

-- DropTable
DROP TABLE "InspectorAvailability";

-- DropEnum
DROP TYPE "BookingStatus";

-- DropEnum
DROP TYPE "PaymentStatus";

-- CreateTable
CREATE TABLE "Conversation" (
    "id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "phone_number" TEXT NOT NULL,
    "message_history" JSONB NOT NULL DEFAULT '[]',
    "last_message_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Conversation_phone_number_key" ON "Conversation"("phone_number");

-- CreateIndex
CREATE INDEX "Conversation_phone_number_idx" ON "Conversation"("phone_number");

-- CreateIndex
CREATE INDEX "Conversation_last_message_at_idx" ON "Conversation"("last_message_at");

-- CreateIndex
CREATE INDEX "Customer_phone_number_idx" ON "Customer"("phone_number");

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
