-- CreateTable
CREATE TABLE "event_status" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "entity_id" TEXT,
    "error" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "event_status_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "event_status_event_id_key" ON "event_status"("event_id");

-- CreateIndex
CREATE INDEX "event_status_event_id_idx" ON "event_status"("event_id");

-- CreateIndex
CREATE INDEX "event_status_status_idx" ON "event_status"("status");

-- CreateIndex
CREATE INDEX "event_status_entity_id_idx" ON "event_status"("entity_id");
