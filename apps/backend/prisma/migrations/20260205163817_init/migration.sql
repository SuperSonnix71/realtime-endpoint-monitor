-- CreateTable
CREATE TABLE "endpoints" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "method" TEXT NOT NULL DEFAULT 'GET',
    "headers" JSONB DEFAULT '{}',
    "payload" JSONB,
    "content_type" TEXT,
    "test_file" BYTEA,
    "test_file_name" TEXT,
    "form_field_name" TEXT,
    "timeout_ms" INTEGER NOT NULL DEFAULT 30000,
    "interval_seconds" INTEGER NOT NULL DEFAULT 60,
    "alert_on_failure" BOOLEAN NOT NULL DEFAULT true,
    "alert_threshold_ms" INTEGER,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "endpoints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "checks" (
    "id" TEXT NOT NULL,
    "endpoint_id" TEXT NOT NULL,
    "status_code" INTEGER,
    "success" BOOLEAN NOT NULL,
    "response_time_ms" INTEGER NOT NULL,
    "response_body" JSONB,
    "error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "checks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alerts" (
    "id" TEXT NOT NULL,
    "endpoint_id" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "sent" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "alerts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "endpoints_active_idx" ON "endpoints"("active");

-- CreateIndex
CREATE INDEX "checks_endpoint_id_idx" ON "checks"("endpoint_id");

-- CreateIndex
CREATE INDEX "checks_created_at_idx" ON "checks"("created_at");

-- CreateIndex
CREATE INDEX "checks_endpoint_id_created_at_idx" ON "checks"("endpoint_id", "created_at");

-- CreateIndex
CREATE INDEX "checks_success_idx" ON "checks"("success");

-- CreateIndex
CREATE INDEX "alerts_endpoint_id_idx" ON "alerts"("endpoint_id");

-- CreateIndex
CREATE INDEX "alerts_created_at_idx" ON "alerts"("created_at");

-- AddForeignKey
ALTER TABLE "checks" ADD CONSTRAINT "checks_endpoint_id_fkey" FOREIGN KEY ("endpoint_id") REFERENCES "endpoints"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_endpoint_id_fkey" FOREIGN KEY ("endpoint_id") REFERENCES "endpoints"("id") ON DELETE CASCADE ON UPDATE CASCADE;
