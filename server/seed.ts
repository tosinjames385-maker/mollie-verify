import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create demo token - MOLLIE
  const mollie = await prisma.token.upsert({
    where: { mintAddress: 'GPTpump...abc123' },
    update: {},
    create: {
      name: 'Mollie The Runner',
      symbol: 'MOLLIE',
      mintAddress: 'GPTpump...abc123',
      imageUrl: 'https://via.placeholder.com/150/84cc16/ffffff?text=M',
      description: 'Mollie The Runner is a community-driven memecoin on Solana.',
      website: 'https://example.com',
      twitter: '@mollierunner',
      circulatingSupply: '963000000',
      verificationStatus: 'unverified',
      organicActivity: 'low',
    },
  })

  console.log('✅ Created token:', mollie.name)

  // Create risk warnings
  await prisma.riskWarning.createMany({
    data: [
      {
        tokenId: mollie.id,
        warningType: 'unverified_metadata',
        severity: 'medium',
        description: 'Token metadata has not been verified',
      },
      {
        tokenId: mollie.id,
        warningType: 'low_activity',
        severity: 'low',
        description: 'Token shows low organic trading activity',
      },
    ],
    skipDuplicates: true,
  })

  console.log('✅ Created risk warnings')

  // Create additional demo tokens
  const demoTokens = [
    {
      name: 'SolanaMax',
      symbol: 'SMAX',
      mintAddress: '7xK...9aP',
      imageUrl: 'https://via.placeholder.com/150/3b82f6/ffffff?text=S',
      description: 'High-performance DeFi token',
      website: 'https://solanamax.example.com',
      twitter: '@solanamax',
      circulatingSupply: '100000000',
      verificationStatus: 'verified',
      organicActivity: 'high',
    },
    {
      name: 'CryptoRunner',
      symbol: 'CRUN',
      mintAddress: 'ABC...xyz789',
      imageUrl: 'https://via.placeholder.com/150/f59e0b/ffffff?text=C',
      description: 'Fast and secure blockchain token',
      circulatingSupply: '500000000',
      verificationStatus: 'pending',
      organicActivity: 'medium',
    },
  ]

  for (const tokenData of demoTokens) {
    const token = await prisma.token.upsert({
      where: { mintAddress: tokenData.mintAddress },
      update: {},
      create: tokenData,
    })
    console.log('✅ Created token:', token.name)
  }

  console.log('🎉 Seeding completed!')
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
