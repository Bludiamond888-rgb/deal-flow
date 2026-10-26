import { describe, expect, it } from 'vitest'
import {
  compute,
  monthlyPayment,
  capexTotal,
  remainingLoanBalance,
  irr,
  npv,
  holdPeriodCashFlows,
} from './calc'
import { DEMO_DEAL } from './demo'
import type { DealInputs } from './types'

describe('monthlyPayment', () => {
  it('amortizes standard mortgage', () => {
    const m = monthlyPayment(16_250_000, 0.0575, 25)
    expect(m).toBeCloseTo(102_229.79, 0)
    expect(m * 12).toBeCloseTo(1_226_757.48, 0)
  })
  it('handles zero rate', () => {
    expect(monthlyPayment(1200, 0, 1)).toBe(100)
  })
})

describe('remainingLoanBalance', () => {
  it('is principal at month 0 and 0 at full amort', () => {
    expect(remainingLoanBalance(16_250_000, 0.0575, 25, 0)).toBeCloseTo(16_250_000, 0)
    expect(remainingLoanBalance(16_250_000, 0.0575, 25, 25 * 12)).toBe(0)
  })

  it('matches iterative amortization after 60 months', () => {
    const P = 16_250_000
    const rate = 0.0575
    const years = 25
    const pmt = monthlyPayment(P, rate, years)
    const r = rate / 12
    let bal = P
    for (let i = 0; i < 60; i++) bal = bal * (1 + r) - pmt
    expect(remainingLoanBalance(P, rate, years, 60)).toBeCloseTo(bal, 0)
    expect(remainingLoanBalance(P, rate, years, 60)).toBeGreaterThan(14_000_000)
    expect(remainingLoanBalance(P, rate, years, 60)).toBeLessThan(16_250_000)
  })

  it('handles zero interest', () => {
    expect(remainingLoanBalance(1200, 0, 1, 6)).toBe(600)
  })
})

describe('irr', () => {
  it('solves classic equal-cash-flow case', () => {
    // -100, +60, +60 → IRR ≈ 13.066%
    const r = irr([-100, 60, 60])
    expect(r).toBeCloseTo(0.130662, 4)
    expect(npv(r, [-100, 60, 60])).toBeCloseTo(0, 6)
  })

  it('returns NaN when cash flows lack a sign change', () => {
    expect(Number.isNaN(irr([10, 20, 30]))).toBe(true)
  })
})

describe('demo deal BOE', () => {
  const r = compute(DEMO_DEAL)

  it('sums capex list', () => {
    expect(capexTotal(DEMO_DEAL)).toBe(310_000)
    expect(r.capexTotal).toBe(310_000)
  })

  it('prices / unit and / SF', () => {
    expect(r.pricePerUnit).toBe(125_000)
    expect(r.pricePerSf).toBeCloseTo(142.857, 2)
  })

  it('LTV loan, fees, equity, cost basis', () => {
    expect(r.loanAmount).toBe(16_250_000)
    expect(r.loanCost).toBe(162_500)
    expect(r.totalEquity).toBe(25_000_000 - 16_250_000 + 162_500 + 310_000)
    expect(r.totalEquity).toBe(9_222_500)
    expect(r.totalCostBasis).toBe(25_000_000 + 310_000 + 162_500)
  })

  it('LTC finances price + capex', () => {
    const ltc: DealInputs = { ...DEMO_DEAL, financingBasis: 'LTC' }
    const x = compute(ltc)
    expect(x.loanAmount).toBeCloseTo(0.65 * (25_000_000 + 310_000), 4)
  })

  it('builds EGI with vacancy as negative', () => {
    expect(r.grossPotentialRentAnnual).toBe(1225 * 200 * 12)
    expect(r.parkingAnnual).toBe(40 * 200 * 12)
    expect(r.otherIncomeAnnual).toBe(50 * 200)
    expect(r.vacancyAnnual).toBeCloseTo(-(1265 * 0.055 * 200 * 12), 4)
    expect(r.egi).toBeCloseTo(2_879_020, 0)
  })

  it('reassesses property tax into ops', () => {
    expect(r.taxRate).toBeCloseTo(465_000 / 23_567_000, 8)
    expect(r.futureAssessment).toBe(25_000_000)
    expect(r.futureTax).toBeCloseTo(25_000_000 * (465_000 / 23_567_000), 2)
  })

  it('NOI, DSCR, BTCF, returns', () => {
    expect(r.noi).toBeCloseTo(2_175_584.71, 0)
    expect(r.annualDebtService).toBeCloseTo(1_226_757.48, 0)
    expect(r.dscr).toBeGreaterThan(1.7)
    expect(r.btcf).toBeCloseTo(r.noi - r.annualDebtService, 2)
    expect(r.proFormaCap).toBeCloseTo(r.noi / 25_000_000, 6)
    expect(r.cashOnCash).toBeCloseTo(r.btcf / 9_222_500, 6)
    expect(r.yieldOnCost).toBeCloseTo(r.noi / 25_472_500, 6)
    expect(r.impliedExit).toBeCloseTo(r.noi / 0.0525, 0)
    expect(r.profitPotential).toBeCloseTo(r.impliedExit - 25_000_000, 0)
  })

  it('alerts', () => {
    expect(r.warnDscr).toBe(false)
    expect(r.flagCapVsHistorical).toBe(false)
    const weak = compute({
      ...DEMO_DEAL,
      interestRate: 0.12,
      ltvLtcPct: 0.8,
      avgRentMonthly: 400,
      rentPremiumMonthly: 0,
      parkingMonthlyPerUnit: 0,
    })
    expect(weak.warnDscr).toBe(true)
  })

  it('hold-period exit, reversion, IRR, equity multiple', () => {
    expect(DEMO_DEAL.holdYears).toBe(5)
    expect(DEMO_DEAL.residualCapRate).toBe(0.0525)
    expect(DEMO_DEAL.saleCostPct).toBe(0.03)

    expect(r.grossSale).toBeCloseTo(r.noi / 0.0525, 0)
    expect(r.saleCosts).toBeCloseTo(r.grossSale * 0.03, 0)
    expect(r.netSale).toBeCloseTo(r.grossSale - r.saleCosts, 0)
    expect(r.loanBalanceAtExit).toBeCloseTo(
      remainingLoanBalance(16_250_000, 0.0575, 25, 60),
      0,
    )
    expect(r.equityReversion).toBeCloseTo(r.netSale - r.loanBalanceAtExit, 0)

    const cfs = holdPeriodCashFlows({
      totalEquity: r.totalEquity,
      btcf: r.btcf,
      holdYears: 5,
      equityReversion: r.equityReversion,
    })
    expect(cfs).toHaveLength(6)
    expect(cfs[0]).toBeCloseTo(-9_222_500, 0)
    expect(cfs[1]).toBeCloseTo(r.btcf, 2)
    expect(cfs[4]).toBeCloseTo(r.btcf, 2)
    expect(cfs[5]).toBeCloseTo(r.btcf + r.equityReversion, 2)
    expect(r.holdCashFlows).toEqual(cfs)

    expect(r.leveredIrr).toBeGreaterThan(0.15)
    expect(r.leveredIrr).toBeLessThan(0.5)
    expect(npv(r.leveredIrr, r.holdCashFlows)).toBeCloseTo(0, 0)

    const em = (r.btcf * 5 + r.equityReversion) / r.totalEquity
    expect(r.equityMultiple).toBeCloseTo(em, 6)
    expect(r.equityMultiple).toBeGreaterThan(1)
  })
})
