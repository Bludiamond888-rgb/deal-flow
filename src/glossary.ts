/** Plain-English BOE glossary for Deal Flow (Tactica-style multifamily terms). */
export type GlossaryEntry = {
  id: string
  term: string
  text: string
  tip?: string
  group: 'inputs' | 'metrics' | 'flow'
}

export const GLOSSARY: GlossaryEntry[] = [
  // —— Key inputs ——
  {
    id: 'purchasePrice',
    group: 'inputs',
    term: 'Purchase price',
    text: 'What you expect to pay for the property. Cap rate, equity, and loan size all start from this number.',
  },
  {
    id: 'units',
    group: 'inputs',
    term: 'Units',
    text: 'Number of rentable apartments (or doors). Used to scale rent, many expenses, and price-per-unit.',
  },
  {
    id: 'ltv',
    group: 'inputs',
    term: 'LTV %',
    text: 'Loan-to-value: the mortgage as a percent of purchase price. Higher LTV means less cash down and more debt service.',
    tip: 'This BOE uses LTV on price (not cost). Equity still adds loan costs and capex.',
  },
  {
    id: 'avgRent',
    group: 'inputs',
    term: 'Avg rent / mo',
    text: 'Average monthly rent per unit if the building were full. Annual GPR ≈ rent × units × 12.',
  },
  {
    id: 'vacancy',
    group: 'inputs',
    term: 'Vacancy %',
    text: 'Allowance for empty units and uncollected rent (credit loss). Taken off gross rent before you get to EGI.',
  },
  {
    id: 'holdYears',
    group: 'inputs',
    term: 'Hold years',
    text: 'How many years you keep the deal in this back-of-envelope. IRR and equity multiple assume Year-1 cash flow each year, then an exit.',
  },
  {
    id: 'interestRate',
    group: 'inputs',
    term: 'Interest rate',
    text: 'Annual interest rate on the loan. Together with amortization it sets monthly debt service (PMT).',
  },
  {
    id: 'exitCap',
    group: 'inputs',
    term: 'Market / exit cap',
    text: 'Capitalization rate used to value the property: value ≈ NOI ÷ cap. The same rate is used here for today’s market value and the exit sale.',
    tip: 'A higher exit cap means a lower sale price.',
  },

  // —— Sticky metrics ——
  {
    id: 'capRate',
    group: 'metrics',
    term: 'Cap Rate',
    text: 'Pro forma capitalization rate: NOI ÷ purchase price. Shows the unlevered yield if you bought all-cash at this price.',
  },
  {
    id: 'coc',
    group: 'metrics',
    term: 'CoC (Cash-on-Cash)',
    text: 'Before-tax cash flow ÷ total equity. How much cash the deal throws off each year relative to the cash you put in.',
  },
  {
    id: 'yoc',
    group: 'metrics',
    term: 'YoC (Yield on Cost)',
    text: 'NOI ÷ total cost basis (price + capex + loan costs). Compares income to what you actually spent to own the asset.',
  },
  {
    id: 'dscr',
    group: 'metrics',
    term: 'DSCR',
    text: 'Debt service coverage ratio: NOI ÷ annual debt service. Lenders often want ~1.20x or higher; below that the loan is tight.',
    tip: 'Deal Flow flags DSCR when it falls under a common underwriting floor.',
  },
  {
    id: 'irr',
    group: 'metrics',
    term: 'IRR (levered)',
    text: 'Internal rate of return on the equity cash flows over the hold: cash in at close, annual BTCF, then BTCF plus equity reversion at sale.',
    tip: 'This BOE holds Year-1 BTCF flat (no rent growth or expense inflation).',
  },
  {
    id: 'em',
    group: 'metrics',
    term: 'Equity Multiple',
    text: 'Total cash returned to equity (sum of BTCF over the hold + equity reversion) ÷ equity invested. 2.0x means you doubled your cash.',
  },

  // —— Flow / BOE lines ——
  {
    id: 'gpr',
    group: 'flow',
    term: 'Gross Potential Rent (GPR)',
    text: 'Rent if every unit were occupied at the underwritten rents for a full year. The top of the income stack.',
  },
  {
    id: 'parking',
    group: 'flow',
    term: 'Parking',
    text: 'Income from parking charged to residents (or others), annualized.',
  },
  {
    id: 'otherInc',
    group: 'flow',
    term: 'Other income',
    text: 'Fees and miscellaneous income (laundry, pet fees, storage, and so on), annualized.',
  },
  {
    id: 'vacancyLoss',
    group: 'flow',
    term: 'Vacancy / credit loss',
    text: 'The dollar haircut for empty units and bad debt. GPR minus this (plus other income) leads to EGI.',
  },
  {
    id: 'egi',
    group: 'flow',
    term: 'Effective Gross Income (EGI)',
    text: 'Collected income after vacancy: rent and other income the property is expected to actually take in.',
  },
  {
    id: 'opex',
    group: 'flow',
    term: 'Operating expenses (OpEx)',
    text: 'Costs to run the property: payroll, utilities, R&M, insurance, marketing, management fee, reserves, taxes, and similar lines.',
  },
  {
    id: 'noi',
    group: 'flow',
    term: 'NOI (Net Operating Income)',
    text: 'EGI minus operating expenses. The property’s income before debt. Cap rate and many lender metrics hang off NOI.',
  },
  {
    id: 'debt',
    group: 'flow',
    term: 'Debt service',
    text: 'Annual principal and interest payments on the loan (12 × monthly PMT). Subtracted from NOI to get cash flow.',
  },
  {
    id: 'btcf',
    group: 'flow',
    term: 'BTCF (Before-Tax Cash Flow)',
    text: 'NOI minus debt service. Cash left for the equity investor before income taxes.',
  },
  {
    id: 'equity',
    group: 'flow',
    term: 'Total equity',
    text: 'Cash the buyer must bring: purchase price − loan + loan costs + capex. The denominator for cash-on-cash and equity multiple.',
  },
  {
    id: 'capex',
    group: 'flow',
    term: 'Capex',
    text: 'Upfront capital improvements (renovations, deferred maintenance) added to cost basis and equity at close in this BOE.',
  },
  {
    id: 'netSale',
    group: 'flow',
    term: 'Net sale proceeds',
    text: 'Gross exit sale (NOI ÷ exit cap) minus sale costs. Before paying off the remaining loan.',
  },
  {
    id: 'reversion',
    group: 'flow',
    term: 'Equity reversion',
    text: 'What equity receives at sale: net sale proceeds minus the loan balance still outstanding. Added to the final year’s cash flow for IRR.',
  },
  {
    id: 'debtYield',
    group: 'metrics',
    term: 'Debt yield',
    text: 'NOI ÷ loan amount. A lender screen that ignores interest rate: higher means more income supporting the loan.',
  },
  {
    id: 'expenseRatio',
    group: 'metrics',
    term: 'Expense ratio',
    text: 'Total operating expenses ÷ EGI. Shows how much of collected income is eaten by OpEx.',
  },
  {
    id: 'impliedExit',
    group: 'metrics',
    term: 'Implied exit',
    text: 'Estimated sale price at the exit cap: NOI ÷ residual (market) cap rate, before sale costs.',
  },
]

export const GLOSSARY_GROUPS: { id: GlossaryEntry['group']; title: string }[] = [
  { id: 'inputs', title: 'Key inputs' },
  { id: 'metrics', title: 'Metrics' },
  { id: 'flow', title: 'Income & cash flow' },
]
