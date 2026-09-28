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

-- Public one-time store so Safari can pass an X session into Phantom/MetaMask
-- even when the Express API and Prisma DB are not the same process.
CREATE TABLE IF NOT EXISTS vrfd_auth_handoff (
  id text PRIMARY KEY,
  access_token text NOT NULL,
  refresh_token text NOT NULL,
  pending_like text,
  return_path text,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE vrfd_auth_handoff ENABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE vrfd_auth_handoff TO anon, authenticated, service_role;

DO $$ BEGIN
  CREATE POLICY vrfd_auth_handoff_all ON vrfd_auth_handoff
    FOR ALL TO anon, authenticated
    USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
