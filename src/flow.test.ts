import { describe, expect, it } from 'vitest'
import { compute } from './calc'
import { DEMO_DEAL } from './demo'
import { buildDealFlow } from './flow'

describe('buildDealFlow', () => {
  const r = compute(DEMO_DEAL)
  const flow = buildDealFlow(r)!

  it('builds a non-empty balanced graph for the demo deal', () => {
    expect(flow).toBeTruthy()
    expect(flow.nodes.map((n) => n.id)).toEqual(
      expect.arrayContaining(['gpr', 'parking', 'otherInc', 'vacancy', 'egi', 'opex', 'noi', 'debt', 'btcf']),
    )
    expect(flow.links.length).toBeGreaterThan(5)
  })

  it('keeps EGI / NOI / BTCF values aligned with calc', () => {
    expect(flow.nodes.find((n) => n.id === 'egi')!.value).toBeCloseTo(r.egi, 0)
    expect(flow.nodes.find((n) => n.id === 'noi')!.value).toBeCloseTo(r.noi, 0)
    expect(flow.nodes.find((n) => n.id === 'btcf')!.value).toBeCloseTo(r.btcf, 0)
    expect(flow.nodes.find((n) => n.id === 'debt')!.value).toBeCloseTo(r.annualDebtService, 0)
  })

  it('splits EGI into OpEx + NOI', () => {
    const intoOpex = flow.links.find((l) => l.source === 'egi' && l.target === 'opex')!.value
    const intoNoi = flow.links.find((l) => l.source === 'egi' && l.target === 'noi')!.value
    expect(intoOpex + intoNoi).toBeCloseTo(r.egi, 0)
  })

  it('exposes capital / exit as below-the-line pills', () => {
    const ids = flow.below.map((b) => b.id)
    expect(ids).toEqual(expect.arrayContaining(['equity', 'capex', 'exit', 'reversion']))
  })

  it('returns null when there is no income', () => {
    const empty = compute({ ...DEMO_DEAL, units: 0, avgRentMonthly: 0, rentPremiumMonthly: 0, parkingMonthlyPerUnit: 0, otherIncomeAnnualPerUnit: 0 })
    expect(buildDealFlow(empty)).toBeNull()
  })
})
