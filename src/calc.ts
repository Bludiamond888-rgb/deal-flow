import type { DealInputs, DealResults } from './types'

/** Standard amortizing mortgage monthly payment (PMT). */
export function monthlyPayment(principal: number, annualRate: number, amortYears: number): number {
  if (principal <= 0 || amortYears <= 0) return 0
  const n = amortYears * 12
  if (annualRate <= 0) return principal / n
  const r = annualRate / 12
  const factor = Math.pow(1 + r, n)
  return (principal * r * factor) / (factor - 1)
}

/**
 * Remaining principal after `monthsElapsed` payments on a fully amortizing loan.
 * Closed form: B_k = P * ((1+r)^n - (1+r)^k) / ((1+r)^n - 1)
 */
export function remainingLoanBalance(
  principal: number,
  annualRate: number,
  amortYears: number,
  monthsElapsed: number,
): number {
  if (principal <= 0 || amortYears <= 0) return 0
  const n = amortYears * 12
  const k = Math.max(0, Math.min(Math.floor(monthsElapsed), n))
  if (k >= n) return 0
  if (k === 0) return principal
  if (annualRate <= 0) {
    const pmt = principal / n
    return Math.max(0, principal - pmt * k)
  }
  const r = annualRate / 12
  const powN = Math.pow(1 + r, n)
  const powK = Math.pow(1 + r, k)
  return (principal * (powN - powK)) / (powN - 1)
}

/** NPV of cash flows at annual rate r (CF[0] at t=0). */
export function npv(rate: number, cashFlows: number[]): number {
  let total = 0
  for (let t = 0; t < cashFlows.length; t++) {
    total += cashFlows[t] / Math.pow(1 + rate, t)
  }
  return total
}

/** d(NPV)/dr */
function npvDerivative(rate: number, cashFlows: number[]): number {
  let d = 0
  for (let t = 1; t < cashFlows.length; t++) {
    d -= (t * cashFlows[t]) / Math.pow(1 + rate, t + 1)
  }
  return d
}

/**
 * Annual IRR via Newton-Raphson with bisection fallback.
 * Returns NaN if no meaningful root (all same sign, empty, etc.).
 */
export function irr(cashFlows: number[], guess = 0.1): number {
  if (cashFlows.length < 2) return Number.NaN
  const hasPos = cashFlows.some((c) => c > 0)
  const hasNeg = cashFlows.some((c) => c < 0)
  if (!hasPos || !hasNeg) return Number.NaN

  let r = guess
  for (let i = 0; i < 64; i++) {
    const f = npv(r, cashFlows)
    const df = npvDerivative(r, cashFlows)
    if (!Number.isFinite(f) || !Number.isFinite(df) || Math.abs(df) < 1e-14) break
    const next = r - f / df
    if (!Number.isFinite(next) || next <= -0.999999) break
    if (Math.abs(next - r) < 1e-10) return next
    r = next
  }
  if (Number.isFinite(r) && Math.abs(npv(r, cashFlows)) < 1e-6) return r

  // Bisection on (-0.99, 10)
  let lo = -0.99
  let hi = 10
  let flo = npv(lo, cashFlows)
  let fhi = npv(hi, cashFlows)
  if (flo * fhi > 0) {
    // widen / search for a sign change
    for (const tryHi of [1, 2, 5, 20, 50, 100]) {
      hi = tryHi
      fhi = npv(hi, cashFlows)
      if (flo * fhi <= 0) break
    }
    if (flo * fhi > 0) return Number.NaN
  }
  for (let i = 0; i < 128; i++) {
    const mid = (lo + hi) / 2
    const fm = npv(mid, cashFlows)
    if (Math.abs(fm) < 1e-10 || (hi - lo) / 2 < 1e-12) return mid
    if (flo * fm <= 0) {
      hi = mid
      fhi = fm
    } else {
      lo = mid
      flo = fm
    }
  }
  return (lo + hi) / 2
}

export function capexTotal(deal: DealInputs): number {
  return deal.capex.reduce((s, c) => s + (Number(c.amount) || 0), 0)
}

/**
 * Build simple BOE hold-period cash flows.
 * Annual BTCF is held constant at Year-1 BTCF (documented BOE simplification).
 */
export function holdPeriodCashFlows(opts: {
  totalEquity: number
  btcf: number
  holdYears: number
  equityReversion: number
}): number[] {
  const years = Math.max(0, Math.floor(opts.holdYears || 0))
  if (years <= 0) return [-opts.totalEquity]
  const cfs: number[] = [-opts.totalEquity]
  for (let y = 1; y <= years; y++) {
    cfs.push(y === years ? opts.btcf + opts.equityReversion : opts.btcf)
  }
  return cfs
}

export function compute(deal: DealInputs): DealResults {
  const P = deal.purchasePrice || 0
  const U = deal.units || 0
  const sf = deal.rentableSf || 0
  const capex = capexTotal(deal)
  const pct = deal.ltvLtcPct || 0

  const loanAmount =
    deal.financingBasis === 'LTV' ? pct * P : pct * (P + capex)
  const loanCost = (deal.loanCostPct || 0) * loanAmount
  const totalEquity = P - loanAmount + loanCost + capex
  const totalCostBasis = P + capex + loanCost

  const rentMo = (deal.avgRentMonthly || 0) + (deal.rentPremiumMonthly || 0)
  const parkingMo = deal.parkingMonthlyPerUnit || 0
  const grossMoPerUnit = rentMo + parkingMo
  const grossPotentialRentAnnual = rentMo * U * 12
  const parkingAnnual = parkingMo * U * 12
  const otherIncomeAnnual = (deal.otherIncomeAnnualPerUnit || 0) * U
  const vacancyAnnual = -(grossMoPerUnit * (deal.vacancyPct || 0) * U * 12)
  const egi = grossPotentialRentAnnual + parkingAnnual + otherIncomeAnnual + vacancyAnnual

  const taxRate =
    deal.currentAssessment > 0 ? (deal.taxesPayableToday || 0) / deal.currentAssessment : 0
  const futureAssessment = P * (deal.reassessToPctOfPrice || 0)
  const futureTax = futureAssessment * taxRate

  const opexPerUnit =
    (deal.adminPerUnitYr || 0) +
    (deal.payrollPerUnitYr || 0) +
    (deal.utilitiesPerUnitYr || 0) +
    (deal.insurancePerUnitYr || 0) +
    (deal.rmPerUnitYr || 0) +
    (deal.marketingPerUnitYr || 0) +
    (deal.otherOpexPerUnitYr || 0)
  const opexLineTotal = opexPerUnit * U
  const managementFee = (deal.managementFeePctOfEgi || 0) * egi
  const reservesTotal = (deal.reservesPerUnitYr || 0) * U
  const totalExpenses = opexLineTotal + managementFee + futureTax + reservesTotal

  const noi = egi - totalExpenses
  const monthlyDebtService = monthlyPayment(loanAmount, deal.interestRate || 0, deal.amortYears || 0)
  const annualDebtService = monthlyDebtService * 12
  const dscr = annualDebtService > 0 ? noi / annualDebtService : 0
  const btcf = noi - annualDebtService
  const expenseRatio = egi > 0 ? totalExpenses / egi : 0

  const proFormaCap = P > 0 ? noi / P : 0
  const historicalCap = P > 0 ? (deal.historicalNoi || 0) / P : 0
  const cashOnCash = totalEquity > 0 ? btcf / totalEquity : 0
  const yieldOnCost = totalCostBasis > 0 ? noi / totalCostBasis : 0
  const debtYield = loanAmount > 0 ? noi / loanAmount : 0
  const marketCap = deal.marketCapRate || 0
  const impliedExit = marketCap > 0 ? noi / marketCap : 0
  const profitPotential = impliedExit - P

  // Hold-period exit / IRR (simple BOE: constant Year-1 BTCF)
  const holdYears = Math.max(0, Math.floor(deal.holdYears || 0))
  const residualCap =
    deal.residualCapRate > 0 ? deal.residualCapRate : marketCap > 0 ? marketCap : 0
  const saleCostPct = deal.saleCostPct || 0
  const grossSale = residualCap > 0 ? noi / residualCap : 0
  const saleCosts = grossSale * saleCostPct
  const netSale = grossSale - saleCosts
  const loanBalanceAtExit = remainingLoanBalance(
    loanAmount,
    deal.interestRate || 0,
    deal.amortYears || 0,
    holdYears * 12,
  )
  const equityReversion = netSale - loanBalanceAtExit
  const holdCashFlows = holdPeriodCashFlows({
    totalEquity,
    btcf,
    holdYears,
    equityReversion,
  })
  const leveredIrr = holdYears > 0 ? irr(holdCashFlows) : Number.NaN
  const totalDistributions =
    btcf * holdYears + equityReversion
  const equityMultiple = totalEquity > 0 ? totalDistributions / totalEquity : 0

  return {
    pricePerUnit: U > 0 ? P / U : 0,
    pricePerSf: sf > 0 ? P / sf : 0,
    capexTotal: capex,
    loanAmount,
    loanCost,
    totalEquity,
    totalCostBasis,
    grossPotentialRentAnnual,
    parkingAnnual,
    otherIncomeAnnual,
    vacancyAnnual,
    egi,
    taxRate,
    futureAssessment,
    futureTax,
    opexLineTotal,
    managementFee,
    reservesTotal,
    totalExpenses,
    noi,
    monthlyDebtService,
    annualDebtService,
    dscr,
    btcf,
    expenseRatio,
    proFormaCap,
    historicalCap,
    cashOnCash,
    yieldOnCost,
    debtYield,
    impliedExit,
    profitPotential,
    warnDscr: annualDebtService > 0 && dscr < 1.2,
    flagCapVsHistorical: proFormaCap < historicalCap && historicalCap > 0,
    grossSale,
    saleCosts,
    netSale,
    loanBalanceAtExit,
    equityReversion,
    leveredIrr,
    equityMultiple,
    holdCashFlows,
  }
}

export function money(n: number, digits = 0): string {
  if (!Number.isFinite(n)) return '—'
  return n.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  })
}

export function pct(n: number, digits = 2): string {
  if (!Number.isFinite(n)) return '—'
  return `${(n * 100).toFixed(digits)}%`
}

export function num(n: number, digits = 0): string {
  if (!Number.isFinite(n)) return '—'
  return n.toLocaleString('en-US', { maximumFractionDigits: digits, minimumFractionDigits: digits })
}
