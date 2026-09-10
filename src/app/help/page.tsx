'use client'

import { Frame } from '@/components/ui/Frame'
import { Page, PageHead } from '@/components/layout/Page'

const ENTRIES: Array<{ term: string; def: string }> = [
  {
    term: 'Chime',
    def: 'A free public take — Up or Down, no wallet, no stake. One tap rings a two-tone chime, lands on the tape, and joins the chorus. Follow backs a chime with money.',
  },
  {
    term: 'Chorus',
    def: 'All chimed voices on a window, shown as a pewter rail under the book: N Up · M Down, plus the lean (crowd leans Up / Down / split). Crowd vs book divergence is the tension.',
  },
  {
    term: 'Window',
    def: 'A time-bucketed bet on BTC or ETH. Resolves at the timer — Up if the price closes above strike, Down otherwise. The cadence (15m, 1h, 4h, 24h) is the bucket size.',
  },
  {
    term: 'Seat',
    def: 'A personality agent that has taken Up or Down for the current window. There are always two seats, always on opposite sides — if both want Up, the second seat is forced to fade.',
  },
  {
    term: 'Follow',
    def: 'Buy the side your followed seat picked. IOC (immediate-or-cancel), sized by your default on Setup. One tap, one fill.',
  },
  {
    term: 'Fade',
    def: 'Buy the opposite side of your followed seat. Same size, same IOC. The name comes from "fade the favourite."',
  },
  {
    term: 'Allegiance',
    def: 'Which personality\u2019s take you ride by default. Set on Setup. Stored locally per browser. Tap a seat on Floor to switch.',
  },
  {
    term: 'Claim',
    def: 'After a window finalizes (or is voided), redeem your held outcome shares on Desk for collateral. One button scans and redeems every claimable position.',
  },
  {
    term: 'Cents (\u00a2)',
    def: 'Binary options price in 0\u20131, which the UI shows as 0\u2013100 cents. 52\u00a2 Up means the book prices Up at 52% probability.',
  },
  {
    term: 'DEMO · LIVE · LOCKED',
    def: 'DEMO: synthetic book, no on-chain. LIVE: trading open, orders accepted. LOCKED: within 15s of expiry, no new orders, awaits oracle.',
  },
  {
    term: 'tUSDC',
    def: 'Testnet USDC. The collateral on Somnia Testnet. Faucet is on Setup; mainnet collateral is USDso.',
  },
  {
    term: 'Implied-up spark',
    def: 'The polyline under the clock. Plots the implied probability over the last ~40 ticks. Brass when last \u2265 50%, pewter when below, halt-red in the final 30s or when locked.',
  },
  {
    term: 'Pit tape',
    def: 'Six rows under seat 02. Mixes mid-price prints with chimes, follows and fades. Sorted newest first.',
  },
  {
    term: 'Unison · Octave · Carillon',
    def: 'Musical ranks for correct-chime streaks: 2 in a row is Unison, 3 is Octave, 5 is Carillon. Words, not points.',
  },
]

export default function HelpPage() {
  return (
    <Page>
      <PageHead title="Glossary">
        Words the floor uses. Read here for the dictionary.
      </PageHead>
      <div className="max-w-3xl">
        <Frame label="WORDS" meta={`${ENTRIES.length}`}>
          <dl>
            {ENTRIES.map((entry) => (
              <div
                key={entry.term}
                className="py-4 border-t border-[var(--line)] first:border-t-0"
              >
                <dt className="text-[13px] text-[var(--ink)]">{entry.term}</dt>
                <dd className="mt-1 text-[12px] text-[var(--mute)] leading-relaxed">
                  {entry.def}
                </dd>
              </div>
            ))}
          </dl>
        </Frame>
      </div>
    </Page>
  )
}
