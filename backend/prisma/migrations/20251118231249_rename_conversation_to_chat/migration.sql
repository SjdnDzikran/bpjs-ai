/*
  Warnings:

  - You are about to drop the `Conversation` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Conversation" DROP CONSTRAINT "Conversation_customer_id_fkey";

-- DropTable
DROP TABLE "Conversation";

-- CreateTable
CREATE TABLE "Chat" (
    "id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "phone_number" TEXT NOT NULL,
    "message_history" JSONB NOT NULL DEFAULT '[]',
    "last_message_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Chat_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Chat_phone_number_key" ON "Chat"("phone_number");

-- CreateIndex
CREATE INDEX "Chat_phone_number_idx" ON "Chat"("phone_number");

-- CreateIndex
CREATE INDEX "Chat_last_message_at_idx" ON "Chat"("last_message_at");

-- AddForeignKey
ALTER TABLE "Chat" ADD CONSTRAINT "Chat_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
