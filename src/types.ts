export type FinancingBasis = 'LTV' | 'LTC'

export type CapexItem = {
  id: string
  label: string
  amount: number
}

export type DealInputs = {
  name: string
  address: string
  city: string
  state: string
  zip: string
  units: number
  rentableSf: number
  purchasePrice: number
  financingBasis: FinancingBasis
  ltvLtcPct: number
  interestRate: number
  amortYears: number
  loanCostPct: number
  capex: CapexItem[]
  avgRentMonthly: number
  rentPremiumMonthly: number
  parkingMonthlyPerUnit: number
  otherIncomeAnnualPerUnit: number
  vacancyPct: number
  adminPerUnitYr: number
  payrollPerUnitYr: number
  utilitiesPerUnitYr: number
  insurancePerUnitYr: number
  rmPerUnitYr: number
  marketingPerUnitYr: number
  otherOpexPerUnitYr: number
  managementFeePctOfEgi: number
  reservesPerUnitYr: number
  currentAssessment: number
  taxesPayableToday: number
  reassessToPctOfPrice: number
  historicalNoi: number
  marketCapRate: number
  /** Hold period for simple BOE IRR (years). */
  holdYears: number
  /** Exit cap; defaults to market cap in demo. */
  residualCapRate: number
  /** Brokerage + closing as % of gross sale. */
  saleCostPct: number
}

export type DealResults = {
  pricePerUnit: number
  pricePerSf: number
  capexTotal: number
  loanAmount: number
  loanCost: number
  totalEquity: number
  totalCostBasis: number
  grossPotentialRentAnnual: number
  parkingAnnual: number
  otherIncomeAnnual: number
  vacancyAnnual: number
  egi: number
  taxRate: number
  futureAssessment: number
  futureTax: number
  opexLineTotal: number
  managementFee: number
  reservesTotal: number
  totalExpenses: number
  noi: number
  monthlyDebtService: number
  annualDebtService: number
  dscr: number
  btcf: number
  expenseRatio: number
  proFormaCap: number
  historicalCap: number
  cashOnCash: number
  yieldOnCost: number
  debtYield: number
  impliedExit: number
  profitPotential: number
  warnDscr: boolean
  flagCapVsHistorical: boolean
  /** Gross sale = NOI / residual cap. */
  grossSale: number
  saleCosts: number
  netSale: number
  loanBalanceAtExit: number
  equityReversion: number
  /** Levered IRR (annual); NaN if undefined. */
  leveredIrr: number
  equityMultiple: number
  holdCashFlows: number[]
}
