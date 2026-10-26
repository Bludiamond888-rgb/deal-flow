import type { DealInputs } from './types'

export const DEMO_DEAL: DealInputs = {
  name: '111 First Street',
  address: '111 First Street',
  city: 'St Paul',
  state: 'MN',
  zip: '55101',
  units: 200,
  rentableSf: 175_000,
  purchasePrice: 25_000_000,
  financingBasis: 'LTV',
  ltvLtcPct: 0.65,
  interestRate: 0.0575,
  amortYears: 25,
  loanCostPct: 0.01,
  capex: [
    { id: 'c1', label: 'Working capital', amount: 200_000 },
    { id: 'c2', label: 'Common area carpet', amount: 65_000 },
    { id: 'c3', label: 'Common area paint', amount: 35_000 },
    { id: 'c4', label: 'Signage', amount: 10_000 },
  ],
  avgRentMonthly: 1100,
  rentPremiumMonthly: 125,
  parkingMonthlyPerUnit: 40,
  otherIncomeAnnualPerUnit: 50,
  vacancyPct: 0.055,
  adminPerUnitYr: 175,
  payrollPerUnitYr: 0,
  utilitiesPerUnitYr: 0,
  insurancePerUnitYr: 0,
  rmPerUnitYr: 0,
  marketingPerUnitYr: 0,
  otherOpexPerUnitYr: 0,
  managementFeePctOfEgi: 0.04,
  reservesPerUnitYr: 300,
  currentAssessment: 23_567_000,
  taxesPayableToday: 465_000,
  reassessToPctOfPrice: 1.0,
  historicalNoi: 1_300_000,
  marketCapRate: 0.0525,
  holdYears: 5,
  residualCapRate: 0.0525,
  saleCostPct: 0.03,
}

export function blankDeal(): DealInputs {
  return {
    ...DEMO_DEAL,
    name: 'New Deal',
    address: '',
    city: '',
    state: '',
    zip: '',
    units: 0,
    rentableSf: 0,
    purchasePrice: 0,
    capex: [],
    avgRentMonthly: 0,
    rentPremiumMonthly: 0,
    parkingMonthlyPerUnit: 0,
    otherIncomeAnnualPerUnit: 0,
    historicalNoi: 0,
  }
}

export function uid(): string {
  return `c${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`
}
