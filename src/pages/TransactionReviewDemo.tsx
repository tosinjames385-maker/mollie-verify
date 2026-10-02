import { useState } from 'react'
import { TransactionReview } from '../components/TransactionReview'
import type { TransactionReviewInput } from '../lib/transactionReview'

const EXPECTED_RECIPIENT = 'ExpectedRecipient111111111111111111111111111'
const SENDER = 'DemoSender11111111111111111111111111111111'

const SCENARIOS: { id: string; label: string; transaction: TransactionReviewInput }[] = [
  {
    id: 'expected-outgoing',
    label: 'Expected send',
    transaction: {
      asset: 'SOL',
      amount: 0.1,
      sender: SENDER,
      recipient: EXPECTED_RECIPIENT,
      network: 'Solana Devnet',
      estimatedNetworkFee: 0.000005,
      feeAsset: 'SOL',
      direction: 'outgoing',
      currentBalance: 2.5,
      expectedAmount: 0.1,
      expectedRecipients: [EXPECTED_RECIPIENT],
    },
  },
  {
    id: 'unexpected-amount',
    label: 'Larger outgoing amount',
    transaction: {
      asset: 'SOL',
      amount: 1.5,
      sender: SENDER,
      recipient: EXPECTED_RECIPIENT,
      network: 'Solana Devnet',
      estimatedNetworkFee: 0.000005,
      feeAsset: 'SOL',
      direction: 'outgoing',
      currentBalance: 2.5,
      expectedAmount: 0.1,
      expectedRecipients: [EXPECTED_RECIPIENT],
    },
  },
  {
    id: 'unknown-recipient',
    label: 'Unknown recipient',
    transaction: {
      asset: 'SOL',
      amount: 0.1,
      sender: SENDER,
      recipient: 'UnknownRecipient111111111111111111111111111',
      network: 'Solana Devnet',
      estimatedNetworkFee: 0.000005,
      feeAsset: 'SOL',
      direction: 'outgoing',
      currentBalance: 2.5,
      expectedAmount: 0.1,
      expectedRecipients: [EXPECTED_RECIPIENT],
    },
  },
  {
    id: 'incoming',
    label: 'Incoming asset',
    transaction: {
      asset: 'USDC',
      amount: 25,
      sender: 'DemoPayer111111111111111111111111111111111',
      recipient: SENDER,
      network: 'Solana Devnet',
      estimatedNetworkFee: 0.000005,
      feeAsset: 'SOL',
      direction: 'incoming',
      currentBalance: 100,
      expectedAmount: 25,
      expectedRecipients: [SENDER],
    },
  },
]

export function TransactionReviewDemo() {
  const [scenarioId, setScenarioId] = useState(SCENARIOS[0].id)
  const [log, setLog] = useState('Choose a mock transaction, then inspect the review before confirming.')
  const scenario = SCENARIOS.find((item) => item.id === scenarioId) ?? SCENARIOS[0]

  return (
    <div className="min-h-screen bg-page px-4 py-10 text-white">
      <div className="mx-auto flex max-w-5xl flex-col gap-8 lg:flex-row lg:items-start">
        <div className="max-w-md flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8ea0ff]">School security demonstration</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-[-0.02em]">Inspect a wallet confirmation</h1>
          <p className="mt-3 text-sm leading-relaxed text-[#9a9a9a]">
            These balances and addresses are mock values. Confirm finishes the demonstration on this page. It does not
            sign a transaction or send funds.
          </p>
          <div className="mt-5 flex flex-col gap-2">
            {SCENARIOS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setScenarioId(item.id)
                  setLog(`Showing “${item.label}”. Review the details before you confirm or cancel.`)
                }}
                className={`rounded-xl border px-4 py-3 text-left text-sm ${
                  item.id === scenario.id
                    ? 'border-white bg-white text-[#111]'
                    : 'border-[#2a2a2a] bg-black text-white hover:bg-[#111]'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
          <p data-testid="transaction-review-log" className="mt-5 text-sm leading-relaxed text-[#c7c7c7]">
            {log}
          </p>
        </div>
        <TransactionReview
          key={scenario.id}
          transaction={scenario.transaction}
          onConfirm={(analysis) => {
            const warningNote = analysis.warnings.length ? ` Warnings: ${analysis.warnings.join(' ')}` : ''
            setLog(
              `Local confirm recorded. Resulting balance ${analysis.resultingBalance} ${scenario.transaction.asset}.${warningNote}`
            )
          }}
          onCancel={() => setLog('Local cancel recorded. Nothing was signed or sent.')}
        />
      </div>
    </div>
  )
}
