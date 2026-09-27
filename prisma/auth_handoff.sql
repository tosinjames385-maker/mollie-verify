-- Run on production Postgres so X session handoff works across Chrome ↔ MetaMask/Phantom.
CREATE TABLE IF NOT EXISTS "AuthHandoff" (
  "id" TEXT PRIMARY KEY,
  "code" TEXT NOT NULL UNIQUE,
  "accessToken" TEXT NOT NULL,
  "refreshToken" TEXT NOT NULL,
  "expiresAtTs" INTEGER,
  "pendingLike" TEXT,
  "returnPath" TEXT,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "AuthHandoff_expiresAt_idx" ON "AuthHandoff"("expiresAt");
