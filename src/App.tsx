import { useEffect, useMemo, useState } from 'react'
import { Chart, COLORS } from './Chart'
import { compute } from './calc'
import { DEMO_DEAL } from './demo'
import { buildDealFlow, type FLink, type FNode } from './flow'
import {
  money,
  moneyFull,
  pct,
  num,
  sanitizeDraft,
  parseDraft,
  toEditDraft,
  formatGrouped,
  type NumFormat,
} from './format'
import {
  deleteSaved,
  listSaved,
  loadLast,
  resetDemo,
  saveLast,
  saveNamed,
  type SavedDeal,
} from './storage'
import { GLOSSARY, GLOSSARY_GROUPS } from './glossary'
import type { DealInputs } from './types'

type View = 'flow' | 'saved' | 'glossary' | 'about'

function pctInput(raw: number): number {
  return Math.round(raw * 10000) / 100
}
function fromPctInput(v: number): number {
  return v / 100
}

export default function App() {
  const [view, setView] = useState<View>('flow')
  const [deal, setDeal] = useState<DealInputs>(() =>
    typeof localStorage !== 'undefined' ? loadLast() : structuredClone(DEMO_DEAL),
  )
  const [saved, setSaved] = useState<SavedDeal[]>(() =>
    typeof localStorage !== 'undefined' ? listSaved() : [],
  )
  const [toast, setToast] = useState<string | null>(null)
  const [saveId, setSaveId] = useState<string | undefined>()
  const [sel, setSel] = useState<{ id: string; kind: 'node' | 'link'; link?: FLink } | null>(null)
  const [unit, setUnit] = useState<'annual' | 'monthly'>('annual')
  const [showInputs, setShowInputs] = useState(true)
  const [q, setQ] = useState('')

  useEffect(() => {
    saveLast(deal)
  }, [deal])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 1800)
    return () => clearTimeout(t)
  }, [toast])

  const r = useMemo(() => compute(deal), [deal])
  const flow = useMemo(() => buildDealFlow(r), [r])
  const scale = unit === 'monthly' ? 1 / 12 : 1
  const scaledFlow = useMemo(() => {
    if (!flow) return null
    const s = (n: number) => n * scale
    return {
      ...flow,
      nodes: flow.nodes.map((n) => ({ ...n, value: s(n.value), signed: s(n.signed) })),
      links: flow.links.map((l) => ({ ...l, value: s(l.value) })),
      below: flow.below.map((n) => ({ ...n, value: s(n.value), signed: s(n.signed) })),
    }
  }, [flow, scale])

  const patch = <K extends keyof DealInputs>(key: K, value: DealInputs[K]) => {
    setDeal((d) => ({ ...d, [key]: value }))
    setSel(null)
  }

  const allNodes: FNode[] = scaledFlow ? [...scaledFlow.nodes, ...scaledFlow.below] : []
  const selNode = sel
    ? allNodes.find((n) => n.id === (sel.kind === 'node' ? sel.id : sel.link!.target))
    : undefined

  const savedHits = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (!s) return saved
    return saved.filter(
      (x) =>
        x.deal.name.toLowerCase().includes(s) ||
        x.deal.address.toLowerCase().includes(s) ||
        x.deal.city.toLowerCase().includes(s),
    )
  }, [q, saved])

  return (
    <div className="app">
      <header className="top">
        <div className="top-in">
          <button
            className="brand"
            onClick={() => {
              setView('flow')
              window.scrollTo(0, 0)
            }}
          >
            <img src="./icons/icon-192.png" alt="" />
            <span>Deal Flow</span>
          </button>
          <button
            className="icon"
            title="Reset sample"
            onClick={() => {
              setDeal(resetDemo())
              setSaveId(undefined)
              setToast('Sample deal restored')
              setView('flow')
            }}
          >
            ↺
          </button>
          <button className="icon" title="About" onClick={() => setView('about')}>
            ⓘ
          </button>
        </div>
      </header>

      {view === 'flow' && (
        <div className="metrics" data-testid="metrics">
          <Chip k="Cap Rate" v={pct(r.proFormaCap)} />
          <Chip k="CoC" v={pct(r.cashOnCash)} />
          <Chip k="YoC" v={pct(r.yieldOnCost)} />
          <Chip k="DSCR" v={r.dscr ? r.dscr.toFixed(2) + 'x' : '—'} warn={r.warnDscr} />
          <Chip k="IRR" v={Number.isFinite(r.leveredIrr) ? pct(r.leveredIrr, 1) : '—'} />
          <Chip k="Eq. Mult." v={r.equityMultiple ? r.equityMultiple.toFixed(2) + 'x' : '—'} />
        </div>
      )}

      {view === 'flow' && (
        <main className="content" data-testid="flow">
          <div className="search">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onFocus={() => {
                if (saved.length) setView('saved')
              }}
              placeholder="Search saved deals…"
              inputMode="search"
            />
            <button className="ghost" onClick={() => setView('saved')}>
              Saved ({saved.length})
            </button>
          </div>

          <section className="head">
            <div>
              <div className="eyebrow">INCOME / CASH FLOW</div>
              <h2>{deal.name || 'Untitled deal'}</h2>
              <div className="meta">
                {deal.address ? `${deal.address} · ` : ''}
                {deal.city}
                {deal.state ? `, ${deal.state}` : ''} · {num(deal.units)} units ·{' '}
                {moneyFull(deal.purchasePrice)}
              </div>
            </div>
            <button
              className="add"
              onClick={() => {
                const entry = saveNamed(deal, saveId)
                setSaveId(entry.id)
                setSaved(listSaved())
                setToast('Deal saved')
              }}
            >
              Save deal
            </button>
          </section>

          <section className="controls">
            <div className="seg">
              <button className={unit === 'annual' ? 'on' : ''} onClick={() => setUnit('annual')}>
                Annual
              </button>
              <button className={unit === 'monthly' ? 'on' : ''} onClick={() => setUnit('monthly')}>
                Monthly
              </button>
            </div>
            <button className="toggle" onClick={() => setShowInputs((v) => !v)}>
              {showInputs ? 'Hide inputs' : 'Show inputs'}
            </button>
          </section>

          {showInputs && (
            <section className="card inputs" data-testid="inputs">
              <h3>Key inputs</h3>
              <div className="igrid">
                <Field
                  label="Purchase price"
                  prefix="$"
                  format="money"
                  value={deal.purchasePrice}
                  onChange={(v) => patch('purchasePrice', v)}
                />
                <Field
                  label="Units"
                  format="number"
                  value={deal.units}
                  onChange={(v) => patch('units', Math.round(v))}
                />
                <Field
                  label="LTV %"
                  suffix="%"
                  format="percent"
                  value={pctInput(deal.ltvLtcPct)}
                  onChange={(v) => patch('ltvLtcPct', fromPctInput(v))}
                />
                <Field
                  label="Avg rent / mo"
                  prefix="$"
                  format="money"
                  value={deal.avgRentMonthly + deal.rentPremiumMonthly}
                  onChange={(v) => {
                    patch('avgRentMonthly', v)
                    patch('rentPremiumMonthly', 0)
                  }}
                />
                <Field
                  label="Vacancy %"
                  suffix="%"
                  format="percent"
                  value={pctInput(deal.vacancyPct)}
                  onChange={(v) => patch('vacancyPct', fromPctInput(v))}
                />
                <Field
                  label="Hold years"
                  format="number"
                  value={deal.holdYears}
                  onChange={(v) => patch('holdYears', Math.max(0, Math.round(v)))}
                />
                <Field
                  label="Interest rate"
                  suffix="%"
                  format="percent"
                  value={pctInput(deal.interestRate)}
                  onChange={(v) => patch('interestRate', fromPctInput(v))}
                />
                <Field
                  label="Market / exit cap"
                  suffix="%"
                  format="percent"
                  value={pctInput(deal.residualCapRate || deal.marketCapRate)}
                  onChange={(v) => {
                    const x = fromPctInput(v)
                    patch('marketCapRate', x)
                    patch('residualCapRate', x)
                  }}
                />
              </div>
            </section>
          )}

          <section className="card chartcard" data-testid="chart">
            {scaledFlow ? (
              <Chart
                flow={scaledFlow}
                basis={Math.max(1, (r.grossPotentialRentAnnual || 1) * scale)}
                selected={sel?.id ?? null}
                onPick={(id, kind, link) => setSel({ id, kind, link })}
              />
            ) : (
              <p className="center">Enter rent and units to draw the flow.</p>
            )}
            {scaledFlow && scaledFlow.below.length > 0 && (
              <div className="below">
                {scaledFlow.below.map((b) => (
                  <button
                    key={b.id}
                    className="pill"
                    style={{ color: COLORS[b.kind].text }}
                    onClick={() => setSel({ id: b.id, kind: 'node' })}
                  >
                    {b.label} <b>{money(b.signed)}</b>
                  </button>
                ))}
              </div>
            )}
            <p className="tip">Tip: tap any bar or ribbon to see what it means.</p>
            <div className="source">
              {unit === 'annual' ? 'Annual' : 'Monthly'} BOE · hold {deal.holdYears} yrs · LTV{' '}
              {pct(deal.ltvLtcPct, 0)}
            </div>
            {scaledFlow?.notes.map((n, i) => (
              <p key={i} className="fine">
                {n}
              </p>
            ))}
          </section>

          {scaledFlow && (
            <section className="card">
              <table className="items">
                <tbody>
                  {scaledFlow.nodes.map((n) => (
                    <tr key={n.id} onClick={() => setSel({ id: n.id, kind: 'node' })}>
                      <td>
                        <span className="dot" style={{ background: COLORS[n.kind].node }} />
                        {n.label}
                        {n.derived ? <span className="m"> · derived</span> : null}
                      </td>
                      <td className="n">
                        <b>{moneyFull(n.signed)}</b>
                      </td>
                      <td className="n m">
                        {pct(Math.abs(n.signed) / Math.max(1, r.grossPotentialRentAnnual * scale), 1)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}

          <section className="card kpis">
            <Kpi label="NOI" v={moneyFull(r.noi)} />
            <Kpi label="BTCF" v={moneyFull(r.btcf)} />
            <Kpi label="Total equity" v={moneyFull(r.totalEquity)} />
            <Kpi label="Debt yield" v={pct(r.debtYield)} />
            <Kpi label="Expense ratio" v={pct(r.expenseRatio)} />
            <Kpi
              label="Implied exit"
              v={moneyFull(r.impliedExit)}
            />
          </section>
        </main>
      )}

      {view === 'saved' && (
        <main className="content no-metrics" data-testid="saved">
          <div className="search">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Filter saved deals…"
              autoFocus
            />
            <button className="ghost" onClick={() => setView('flow')}>
              Back
            </button>
          </div>
          <h2 className="section-title">Saved deals</h2>
          {savedHits.length === 0 ? (
            <div className="card center muted">No saved deals yet. Open a deal and tap Save.</div>
          ) : (
            <ul className="saved">
              {savedHits.map((s) => (
                <li key={s.id}>
                  <button
                    className="saved-main"
                    onClick={() => {
                      setDeal(structuredClone(s.deal))
                      setSaveId(s.id)
                      setView('flow')
                      setQ('')
                      setToast(`Loaded ${s.deal.name}`)
                    }}
                  >
                    <b>{s.deal.name}</b>
                    <span>
                      {s.deal.city}
                      {s.deal.state ? `, ${s.deal.state}` : ''} · {num(s.deal.units)} u ·{' '}
                      {moneyFull(s.deal.purchasePrice)}
                    </span>
                  </button>
                  <button
                    className="danger"
                    onClick={() => {
                      deleteSaved(s.id)
                      setSaved(listSaved())
                      if (saveId === s.id) setSaveId(undefined)
                    }}
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          )}
        </main>
      )}

      {view === 'glossary' && (
        <main className="content no-metrics" data-testid="glossary">
          <h2 className="section-title">Terms</h2>
          <p className="fine" style={{ margin: '0 0 8px' }}>
            Plain-English definitions for every key input, sticky metric, and income / cash-flow line in this
            back-of-envelope (BOE).
          </p>
          <div className="glossary">
            {GLOSSARY_GROUPS.map((g) => (
              <section key={g.id} className="glossary-group">
                <h3>{g.title}</h3>
                {GLOSSARY.filter((e) => e.group === g.id).map((e) => (
                  <article key={e.id} className="g-item">
                    <b>{e.term}</b>
                    <p>{e.text}</p>
                    {e.tip ? <p className="tip">{e.tip}</p> : null}
                  </article>
                ))}
              </section>
            ))}
          </div>
        </main>
      )}

      {view === 'about' && (
        <main className="content no-metrics about" data-testid="about">
          <button className="ghost" onClick={() => setView('flow')}>
            ← Back
          </button>
          <h2>About Deal Flow</h2>
          <p>
            Chart-first multifamily back-of-envelope pro forma. Same formulas as{' '}
            <b>Deal Pro Forma</b> (including levered IRR), presented as an income / cash-flow Sankey
            like Earnings Flow.
          </p>
          <p>
            Methodology inspired by public <b>Tactica RES</b> tutorials on multifamily
            underwriting (GPR → vacancy → EGI → OpEx → NOI → debt → BTCF; hold-period exit at a
            residual cap).
          </p>
          <ul>
            <li>Preloaded sample: 111 First Street · $25M · 200 units</li>
            <li>Sticky metrics: Cap Rate, CoC, YoC, DSCR, IRR, Equity Multiple</li>
            <li>Deals autosave to this device (localStorage)</li>
            <li>Installable PWA · works offline after first open</li>
          </ul>
          <p className="fine">
            BOE simplification: Year-1 BTCF held constant over the hold; no rent growth or expense
            inflation. Not investment advice.
          </p>
        </main>
      )}

      {selNode && (
        <div className="sheet-bg" onClick={() => setSel(null)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()} data-testid="detail">
            <div className="grab" />
            <button className="close" onClick={() => setSel(null)}>
              ✕
            </button>
            <h3>{selNode.label}</h3>
            <div className="big" style={{ color: COLORS[selNode.kind].text }}>
              {moneyFull(selNode.signed)}
            </div>
            <p>{selNode.simple}</p>
            {selNode.derived && <p className="tipbox">Derived from other lines in the BOE.</p>}
          </div>
        </div>
      )}

      <nav className="tabs" data-testid="tabs">
        <button
          type="button"
          className={view === 'flow' ? 'on' : ''}
          onClick={() => {
            setView('flow')
            window.scrollTo(0, 0)
          }}
        >
          <span className="ic">〰</span>Flow
        </button>
        <button
          type="button"
          className={view === 'saved' ? 'on' : ''}
          onClick={() => {
            setView('saved')
            window.scrollTo(0, 0)
          }}
        >
          <span className="ic">▤</span>Saved
        </button>
        <button
          type="button"
          className={view === 'glossary' ? 'on' : ''}
          onClick={() => {
            setView('glossary')
            window.scrollTo(0, 0)
          }}
        >
          <span className="ic">☰</span>Terms
        </button>
        <button
          type="button"
          className={view === 'about' ? 'on' : ''}
          onClick={() => {
            setView('about')
            window.scrollTo(0, 0)
          }}
        >
          <span className="ic">ⓘ</span>About
        </button>
      </nav>

      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}

function Chip({ k, v, warn }: { k: string; v: string; warn?: boolean }) {
  return (
    <div className="chip">
      <div className="k">{k}</div>
      <div className={`v${warn ? ' warn' : ''}`}>{v}</div>
    </div>
  )
}

function Kpi({ label, v }: { label: string; v: string }) {
  return (
    <div className="kpi">
      <div className="k">{label}</div>
      <div className="v">{v}</div>
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  prefix,
  suffix,
  format = 'number',
}: {
  label: string
  value: number
  onChange: (v: number) => void
  prefix?: string
  suffix?: string
  format?: NumFormat
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const allowDec = true

  const shown = editing ? draft : formatGrouped(Number.isFinite(value) ? value : 0, format)

  return (
    <label className="field">
      {label}
      <span className="fin">
        {prefix ? <em>{prefix}</em> : null}
        <input
          type="text"
          inputMode="decimal"
          autoComplete="off"
          enterKeyHint="done"
          value={shown}
          onFocus={(e) => {
            setEditing(true)
            setDraft(toEditDraft(Number.isFinite(value) ? value : 0, allowDec))
            requestAnimationFrame(() => e.target.select())
          }}
          onBlur={() => {
            setEditing(false)
            const n = parseDraft(draft)
            onChange(n)
            setDraft('')
          }}
          onChange={(e) => {
            const next = sanitizeDraft(e.target.value, allowDec)
            setDraft(next)
            onChange(parseDraft(next))
          }}
        />
        {suffix ? <em>{suffix}</em> : null}
      </span>
    </label>
  )
}
