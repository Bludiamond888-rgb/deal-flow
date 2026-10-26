import type { DealResults } from './types'

export type Kind = 'rev' | 'profit' | 'cost' | 'loss' | 'gain' | 'seg'
export type FNode = {
  id: string
  label: string
  simple: string
  value: number
  kind: Kind
  derived?: boolean
  signed: number
}
export type FLink = { source: string; target: string; value: number; kind: Kind }
export type Flow = { nodes: FNode[]; links: FLink[]; notes: string[]; below: FNode[] }

const pos = (n: number) => (Number.isFinite(n) && n > 0 ? n : 0)

/**
 * Multifamily BOE Sankey (Earnings Flow layout):
 *   GPR (+ parking / other) → Vacancy → EGI → OpEx buckets → NOI → Debt → BTCF
 * Capex / equity / exit shown as below-the-line pills to avoid clutter.
 */
export function buildDealFlow(r: DealResults, opts?: { showExit?: boolean }): Flow | null {
  const notes: string[] = []
  const nodes: FNode[] = []
  const links: FLink[] = []
  const below: FNode[] = []

  const gpr = pos(r.grossPotentialRentAnnual)
  const parking = pos(r.parkingAnnual)
  const other = pos(r.otherIncomeAnnual)
  if (gpr + parking + other <= 0) return null

  const add = (n: Omit<FNode, 'signed'> & { signed?: number }) => {
    const x = { signed: n.value, ...n } as FNode
    nodes.push(x)
    return x
  }
  const link = (s: string, t: string, v: number, kind: Kind) => {
    if (v > 0) links.push({ source: s, target: t, value: v, kind })
  }

  // —— Income ——
  if (gpr > 0) {
    add({
      id: 'gpr',
      label: 'Gross Potential Rent',
      simple: 'Rent if 100% occupied',
      value: gpr,
      kind: 'rev',
      signed: gpr,
    })
  }
  if (parking > 0) {
    add({
      id: 'parking',
      label: 'Parking',
      simple: 'Monthly parking income',
      value: parking,
      kind: 'gain',
      signed: parking,
    })
  }
  if (other > 0) {
    add({
      id: 'otherInc',
      label: 'Other income',
      simple: 'Fees & misc',
      value: other,
      kind: 'gain',
      signed: other,
    })
  }

  const vacAbs = pos(-r.vacancyAnnual)
  const egi = pos(r.egi)
  // Vacancy leaves from GPR (BOE: vacancy on rent+parking unit gross)
  if (vacAbs > 0 && gpr > 0) {
    add({
      id: 'vacancy',
      label: 'Vacancy / credit loss',
      simple: 'Empty units & bad debt',
      value: vacAbs,
      kind: 'cost',
      signed: -vacAbs,
    })
    link('gpr', 'vacancy', Math.min(vacAbs, gpr), 'cost')
  }

  if (egi <= 0) {
    notes.push('EGI is zero or negative after vacancy.')
    return { nodes, links, notes, below }
  }

  add({
    id: 'egi',
    label: 'Effective Gross Income',
    simple: 'Collected income',
    value: egi,
    kind: 'profit',
    derived: true,
    signed: egi,
  })

  // Rent after vacancy → EGI; parking & other feed EGI
  const rentAfterVac = Math.max(0, gpr - vacAbs)
  if (gpr > 0) link('gpr', 'egi', Math.min(rentAfterVac, egi), 'profit')
  if (parking > 0) link('parking', 'egi', parking, 'gain')
  if (other > 0) link('otherInc', 'egi', other, 'gain')

  // If vacancy exceeded GPR (rare), note it
  if (vacAbs > gpr && vacAbs > 0) {
    notes.push('Vacancy allowance exceeds Gross Potential Rent; EGI fed mainly by other income.')
  }

  // —— OpEx ——
  const taxes = pos(r.futureTax)
  const mgmt = pos(r.managementFee)
  const reserves = pos(r.reservesTotal)
  const opexLines = pos(r.opexLineTotal)
  const totalExp = pos(r.totalExpenses)
  const noi = r.noi

  if (totalExp > 0) {
    add({
      id: 'opex',
      label: 'Operating expenses',
      simple: 'Cost to run the asset',
      value: totalExp,
      kind: 'cost',
      derived: true,
      signed: -totalExp,
    })
    link('egi', 'opex', Math.min(totalExp, egi), 'cost')

    const parts: { id: string; label: string; simple: string; v: number }[] = []
    if (opexLines > 0)
      parts.push({ id: 'opexLines', label: 'OpEx (per-unit)', simple: 'Admin, payroll, util…', v: opexLines })
    if (mgmt > 0) parts.push({ id: 'mgmt', label: 'Management fee', simple: '% of EGI', v: mgmt })
    if (taxes > 0) parts.push({ id: 'taxes', label: 'Property taxes', simple: 'Reassessed tax', v: taxes })
    if (reserves > 0) parts.push({ id: 'reserves', label: 'Reserves', simple: 'Replacement reserves', v: reserves })

    let scaled = parts
    const sum = parts.reduce((s, p) => s + p.v, 0)
    if (sum > totalExp * 1.001 && sum > 0) {
      const k = totalExp / sum
      scaled = parts.map((p) => ({ ...p, v: p.v * k }))
      notes.push('Expense lines scaled slightly to match total OpEx.')
    }
    const used = scaled.reduce((s, p) => s + p.v, 0)
    if (totalExp - used > totalExp * 0.003) {
      scaled.push({ id: 'otherOpex', label: 'Other OpEx', simple: 'Remainder', v: totalExp - used })
    }
    for (const p of scaled) {
      add({ id: p.id, label: p.label, simple: p.simple, value: p.v, kind: 'cost', signed: -p.v })
      link('opex', p.id, p.v, 'cost')
    }
  }

  // —— NOI ——
  if (noi > 0) {
    add({
      id: 'noi',
      label: 'NOI',
      simple: 'Net operating income',
      value: noi,
      kind: 'profit',
      derived: true,
      signed: noi,
    })
    link('egi', 'noi', Math.min(noi, egi), 'profit')
  } else {
    notes.push('NOI is zero or negative after expenses.')
    if (noi < 0) {
      below.push({
        id: 'noi',
        label: 'NOI (loss)',
        simple: 'Expenses exceed EGI',
        value: Math.abs(noi),
        signed: noi,
        kind: 'loss',
      })
    }
    return { nodes, links, notes, below }
  }

  // —— Debt → BTCF ——
  const ads = pos(r.annualDebtService)
  const btcf = r.btcf
  if (ads > 0) {
    add({
      id: 'debt',
      label: 'Debt service',
      simple: 'Annual mortgage payments',
      value: ads,
      kind: 'cost',
      signed: -ads,
    })
    link('noi', 'debt', Math.min(ads, noi), 'cost')
  }

  if (btcf > 0) {
    add({
      id: 'btcf',
      label: 'Before-Tax Cash Flow',
      simple: 'Cash to equity after debt',
      value: btcf,
      kind: 'profit',
      derived: true,
      signed: btcf,
    })
    link('noi', 'btcf', Math.min(btcf, noi), 'profit')
  } else if (btcf < 0) {
    notes.push('Negative BTCF: debt service exceeds NOI.')
    below.push({
      id: 'btcf',
      label: 'BTCF (shortfall)',
      simple: 'Debt exceeds NOI',
      value: Math.abs(btcf),
      signed: btcf,
      kind: 'loss',
    })
  }

  // —— Capital / exit as pills ——
  below.push({
    id: 'equity',
    label: 'Total equity',
    simple: 'Cash in at close',
    value: pos(r.totalEquity),
    signed: -pos(r.totalEquity),
    kind: 'seg',
  })
  if (pos(r.capexTotal) > 0) {
    below.push({
      id: 'capex',
      label: 'Capex at close',
      simple: 'Upfront improvements',
      value: pos(r.capexTotal),
      signed: -pos(r.capexTotal),
      kind: 'seg',
    })
  }
  if (opts?.showExit !== false && pos(r.grossSale) > 0) {
    below.push({
      id: 'exit',
      label: 'Net sale proceeds',
      simple: 'After sale costs',
      value: pos(r.netSale),
      signed: pos(r.netSale),
      kind: 'gain',
    })
    below.push({
      id: 'reversion',
      label: 'Equity reversion',
      simple: 'Net sale − loan payoff',
      value: Math.abs(r.equityReversion),
      signed: r.equityReversion,
      kind: r.equityReversion >= 0 ? 'profit' : 'loss',
    })
  }

  notes.push('BOE simplification: Year-1 NOI and BTCF held constant over the hold period.')
  return { nodes, links, notes, below }
}
