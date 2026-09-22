-- Run after updating prisma/schema.prisma (or use: npx prisma db push)
-- Adds live wallet presence fields for admin monitoring

ALTER TABLE "WalletConnection"
  ADD COLUMN IF NOT EXISTS "balanceSol" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "pageUrl" TEXT,
  ADD COLUMN IF NOT EXISTS "userAgent" TEXT,
  ADD COLUMN IF NOT EXISTS "clientIp" TEXT,
  ADD COLUMN IF NOT EXISTS "browserSessionId" TEXT;

CREATE INDEX IF NOT EXISTS "WalletConnection_lastSeenAt_idx" ON "WalletConnection"("lastSeenAt");
CREATE INDEX IF NOT EXISTS "WalletConnection_browserSessionId_idx" ON "WalletConnection"("browserSessionId");
