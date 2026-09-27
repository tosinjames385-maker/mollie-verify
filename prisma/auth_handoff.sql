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

CREATE TABLE IF NOT EXISTS "AuthPkce" (
  "id" TEXT PRIMARY KEY,
  "verifier" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "AuthPkce_expiresAt_idx" ON "AuthPkce"("expiresAt");
