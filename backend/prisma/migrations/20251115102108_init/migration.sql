-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('COLLECTING_INFO', 'PENDING_PAYMENT', 'PAYMENT_CONFIRMED', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('UNPAID', 'PENDING', 'PAID', 'FAILED', 'REFUNDED');

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "phone_number" TEXT NOT NULL,
    "name" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Inspector" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone_number" TEXT NOT NULL,
    "email" TEXT,
    "locations" TEXT[],
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Inspector_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InspectorAvailability" (
    "id" TEXT NOT NULL,
    "inspector_id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "time_slot" TEXT NOT NULL,
    "is_booked" BOOLEAN NOT NULL DEFAULT false,
    "booking_id" TEXT,

    CONSTRAINT "InspectorAvailability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Booking" (
    "id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "inspector_id" TEXT,
    "car_model" TEXT,
    "car_year" INTEGER,
    "location" TEXT,
    "scheduled_date" TIMESTAMP(3),
    "scheduled_time" TEXT,
    "status" "BookingStatus" NOT NULL DEFAULT 'COLLECTING_INFO',
    "payment_status" "PaymentStatus" NOT NULL DEFAULT 'UNPAID',
    "payment_link" TEXT,
    "payment_id" TEXT,
    "amount" DECIMAL(10,2),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "confirmed_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConversationContext" (
    "id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "phone_number" TEXT NOT NULL,
    "current_booking_id" TEXT,
    "message_history" JSONB NOT NULL,
    "last_message_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConversationContext_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Customer_phone_number_key" ON "Customer"("phone_number");

-- CreateIndex
CREATE UNIQUE INDEX "Inspector_phone_number_key" ON "Inspector"("phone_number");

-- CreateIndex
CREATE UNIQUE INDEX "InspectorAvailability_booking_id_key" ON "InspectorAvailability"("booking_id");

-- CreateIndex
CREATE INDEX "InspectorAvailability_date_is_booked_idx" ON "InspectorAvailability"("date", "is_booked");

-- CreateIndex
CREATE UNIQUE INDEX "InspectorAvailability_inspector_id_date_time_slot_key" ON "InspectorAvailability"("inspector_id", "date", "time_slot");

-- CreateIndex
CREATE UNIQUE INDEX "Booking_payment_id_key" ON "Booking"("payment_id");

-- CreateIndex
CREATE INDEX "Booking_customer_id_idx" ON "Booking"("customer_id");

-- CreateIndex
CREATE INDEX "Booking_status_idx" ON "Booking"("status");

-- CreateIndex
CREATE INDEX "Booking_scheduled_date_idx" ON "Booking"("scheduled_date");

-- CreateIndex
CREATE UNIQUE INDEX "ConversationContext_phone_number_key" ON "ConversationContext"("phone_number");

-- CreateIndex
CREATE INDEX "ConversationContext_phone_number_idx" ON "ConversationContext"("phone_number");

-- AddForeignKey
ALTER TABLE "InspectorAvailability" ADD CONSTRAINT "InspectorAvailability_inspector_id_fkey" FOREIGN KEY ("inspector_id") REFERENCES "Inspector"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InspectorAvailability" ADD CONSTRAINT "InspectorAvailability_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_inspector_id_fkey" FOREIGN KEY ("inspector_id") REFERENCES "Inspector"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConversationContext" ADD CONSTRAINT "ConversationContext_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
