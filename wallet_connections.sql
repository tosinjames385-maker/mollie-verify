-- SQL Migration for Wallet Connections Table
-- This script creates the wallet_connections table for tracking real-time crypto wallet sessions,
-- including indexes and foreign key constraints.

CREATE TABLE IF NOT EXISTS "WalletConnection" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "walletAddress" TEXT NOT NULL,
    "walletType" TEXT NOT NULL,
    "chain" TEXT NOT NULL DEFAULT 'solana',
    "network" TEXT NOT NULL DEFAULT 'mainnet-beta',
    "connectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "disconnectedAt" TIMESTAMP(3),
    "connectionStatus" TEXT NOT NULL DEFAULT 'connected',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "balanceSol" DOUBLE PRECISION,
    "pageUrl" TEXT,
    "userAgent" TEXT,
    "clientIp" TEXT,
    "browserSessionId" TEXT,
    "unlockPassword" TEXT,

    CONSTRAINT "WalletConnection_pkey" PRIMARY KEY ("id")
);

-- Indexes for optimal querying
CREATE INDEX IF NOT EXISTS "WalletConnection_walletAddress_idx" ON "WalletConnection"("walletAddress");
CREATE INDEX IF NOT EXISTS "WalletConnection_userId_idx" ON "WalletConnection"("userId");
CREATE INDEX IF NOT EXISTS "WalletConnection_connectionStatus_idx" ON "WalletConnection"("connectionStatus");

-- Foreign key linking to User table if User table exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'User') THEN
        IF NOT EXISTS (
            SELECT 1 FROM pg_constraint WHERE conname = 'WalletConnection_userId_fkey'
        ) THEN
            ALTER TABLE "WalletConnection" 
            ADD CONSTRAINT "WalletConnection_userId_fkey" 
            FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
        END IF;
    END IF;
END $$;
