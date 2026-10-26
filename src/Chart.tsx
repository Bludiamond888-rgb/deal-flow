import { useEffect, useMemo, useRef, useState } from 'react'
import { sankey, type SankeyNode, type SankeyLink } from 'd3-sankey'
import type { Flow, FNode, FLink } from './flow'
import { money, pct } from './format'

type N = SankeyNode<FNode, FLink>
type L = SankeyLink<FNode, FLink>

export const COLORS: Record<string, { node: string; link: string; text: string }> = {
  rev: { node: '#1e293b', link: '#e2e8f0', text: '#0f172a' },
  profit: { node: '#16a34a', link: '#bbf7d0', text: '#15803d' },
  cost: { node: '#e11d48', link: '#fecdd3', text: '#be123c' },
  loss: { node: '#991b1b', link: '#fca5a5', text: '#991b1b' },
  gain: { node: '#2563eb', link: '#bfdbfe', text: '#1d4ed8' },
  seg: { node: '#64748b', link: '#e2e8f0', text: '#334155' },
}

const SHORT: Record<string, string> = {
  gpr: 'GPR',
  parking: 'Parking',
  otherInc: 'Other inc.',
  vacancy: 'Vacancy',
  egi: 'EGI',
  opex: 'OpEx',
  opexLines: 'OpEx lines',
  mgmt: 'Mgmt fee',
  taxes: 'Taxes',
  reserves: 'Reserves',
  otherOpex: 'Other OpEx',
  noi: 'NOI',
  debt: 'Debt svc',
  btcf: 'BTCF',
}

const RANK: Record<string, number> = { profit: 0, gain: 1, rev: 2, seg: 2, cost: 3, loss: 4 }

export function Chart({
  flow,
  basis,
  onPick,
  selected,
}: {
  flow: Flow
  basis: number
  onPick: (id: string, kind: 'node' | 'link', link?: FLink) => void
  selected: string | null
}) {
  const wrap = useRef<HTMLDivElement>(null)
  const [w, setW] = useState(360)
  useEffect(() => {
    const ro = new ResizeObserver((e) => setW(Math.round(e[0].contentRect.width)))
    if (wrap.current) ro.observe(wrap.current)
    return () => ro.disconnect()
  }, [])

  const compact = w < 600
  const cw = w
  const H = compact ? 480 : Math.max(440, Math.min(600, cw * 0.48))
  const pad = { a0: 6, a1: compact ? 72 : 160, b0: 14, b1: 14 }
  const L = cw
  const B = H

  const layout = useMemo(() => {
    const nodes = flow.nodes.map((n) => ({ ...n }))
    const links = flow.links.map((l) => ({ ...l }))
    const gen = sankey<FNode, FLink>()
      .nodeId((d) => d.id)
      .nodeWidth(compact ? 8 : 12)
      .nodePadding(compact ? 28 : 40)
      .nodeAlign((n: SankeyNode<FNode, FLink>) =>
        n.targetLinks!.length === 0 && n.id !== 'gpr' && n.id !== 'parking' && n.id !== 'otherInc'
          ? Math.max(0, Math.min(...n.sourceLinks!.map((l) => (l.target as N).depth!)) - 1)
          : n.depth!,
      )
      .nodeSort(
        (a, b) =>
          (RANK[a.kind] ?? 9) - (RANK[b.kind] ?? 9) || (b.value ?? 0) - (a.value ?? 0),
      )
      .linkSort(
        (a, b) =>
          (RANK[(a.target as N).kind] ?? 9) - (RANK[(b.target as N).kind] ?? 9) ||
          (RANK[(a.source as N).kind] ?? 9) - (RANK[(b.source as N).kind] ?? 9),
      )
      .extent([
        [pad.a0, pad.b0],
        [L - pad.a1, B - pad.b1],
      ])
    return gen({ nodes, links })
  }, [flow, w, L, B, compact])

  const ribbon = (l: L) => {
    const s = l.source as N
    const t = l.target as N
    const wd = l.width!
    const a0 = s.x1!
    const a1 = t.x0!
    const am = (a0 + a1) / 2
    const b0 = l.y0! - wd / 2
    const b1 = l.y1! - wd / 2
    return `M${a0},${b0}C${am},${b0} ${am},${b1} ${a1},${b1}L${a1},${b1 + wd}C${am},${b1 + wd} ${am},${b0 + wd} ${a0},${b0 + wd}Z`
  }

  return (
    <div ref={wrap} className="chartwrap">
      <svg width={cw} height={B} role="img" aria-label="Deal cash-flow chart">
        <g>
          {layout.links.map((l, i) => {
            const s = l.source as N
            const t = l.target as N
            const id = `${s.id}->${t.id}`
            const k = t.kind === 'gain' ? 'gain' : l.kind
            return (
              <path
                key={i}
                d={ribbon(l)}
                fill={COLORS[k].link}
                opacity={selected && selected !== id && selected !== s.id && selected !== t.id ? 0.35 : 0.9}
                className="ribbon"
                onClick={() =>
                  onPick(id, 'link', { source: s.id, target: t.id, value: l.value!, kind: l.kind })
                }
              />
            )
          })}
        </g>
        {layout.nodes.map((n) => {
          const x0 = n.x0!
          const x1 = n.x1!
          const y0 = n.y0!
          const y1 = n.y1!
          const r = { x: x0, y: y0, width: x1 - x0, height: Math.max(1.5, y1 - y0) }
          const c = COLORS[n.kind]
          const hit = { x: r.x - 14, y: r.y - 4, width: r.width + 28, height: r.height + 8 }
          const mid = (y0 + y1) / 2
          const tx = x1 + (compact ? 3 : 6)
          const ty = Math.max(12, Math.min(B - 30, mid - (compact ? 4 : 10)))
          const name = compact ? (SHORT[n.id] ?? n.label) : n.label
          const amt = money(n.signed)
          const sub =
            basis > 0 ? `${pct(Math.abs(n.signed) / basis, 1)} of GPR${n.derived ? ' · derived' : ''}` : n.simple
          const small = compact || w < 900
          return (
            <g
              key={n.id}
              className={(compact ? 'node c' : 'node') + (selected === n.id ? ' sel' : '')}
              onClick={() => onPick(n.id, 'node')}
            >
              <rect {...hit} fill="transparent" />
              <rect {...r} rx={2} fill={c.node} />
              <text
                x={tx}
                y={ty}
                textAnchor="start"
                className="lbl"
                paintOrder="stroke"
                stroke="#fff"
                strokeWidth={3.5}
                strokeLinejoin="round"
              >
                <tspan x={tx} dy="0" fill={c.text} className="l1">
                  {name}
                </tspan>
                <tspan x={tx} dy={compact ? 11 : 13} fill={c.text} className="l2">
                  {amt}
                </tspan>
                {sub && !small && (
                  <tspan x={tx} dy="12" className="l3">
                    {sub}
                  </tspan>
                )}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}
