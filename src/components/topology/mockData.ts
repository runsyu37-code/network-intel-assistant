import type { Node, Edge } from 'reactflow'

export type NodeStatus = 'ok' | 'warn' | 'alert'

export interface SiteData {
  label: string
  sub: string
  count: number
  status: NodeStatus
}
export interface HQData {
  label: string
  ip: string
  siteCount: number
}

export const HQ_CENTER = { x: 400, y: 280 }
const RADIUS = 360

const SITES: Array<{ id: string; data: SiteData }> = [
  { id: 'site-b', data: { label: 'Site B — Chiang Mai DC', sub: 'Mueang, CNX',  count: 28, status: 'ok'   } },
  { id: 'site-c', data: { label: 'Site C — Phuket Branch', sub: 'Kathu, HKT',   count: 14, status: 'ok'   } },
  { id: 'site-d', data: { label: 'Site D — Khon Kaen',     sub: 'Mueang, KKC',  count: 9,  status: 'warn' } },
  { id: 'site-e', data: { label: 'Site E — Hat Yai',        sub: 'Hat Yai, HDY', count: 6,  status: 'ok'   } },
]

export function radialPos(i: number, total: number) {
  const angle = (2 * Math.PI * i) / total - Math.PI / 2
  return {
    x: Math.round(HQ_CENTER.x + RADIUS * Math.cos(angle)),
    y: Math.round(HQ_CENTER.y + RADIUS * Math.sin(angle)),
  }
}

export function handleFromAngle(deg: number): string {
  if (deg >= -135 && deg < -45) return 't'
  if (deg >= -45  && deg < 45)  return 'r'
  if (deg >= 45   && deg < 135) return 'b'
  return 'l'
}
export const OPPOSITE_HANDLE: Record<string, string> = { t: 'b', b: 't', l: 'r', r: 'l' }

const sitePositions = SITES.map((_, i) => radialPos(i, SITES.length))

export const initialNodes: Node[] = [
  {
    id: 'hq',
    type: 'hqNode',
    position: HQ_CENTER,
    data: { label: 'HQ — Core', ip: '10.0.0.1 · core router', siteCount: SITES.length } as HQData,
  },
  ...SITES.map((s, i) => ({
    id: s.id,
    type: 'siteNode' as const,
    position: sitePositions[i],
    data: s.data,
  })),
]

const EDGE_LABELS: Record<string, { label: string; dash?: boolean }> = {
  'site-b': { label: '1 Gbps · MPLS' },
  'site-c': { label: '500 Mbps' },
  'site-d': { label: '500 Mbps' },
  'site-e': { label: 'VPN', dash: true },
  'site-f': { label: 'VPN', dash: true },
}

const edgeBase = {
  type: 'straight' as const,
  labelStyle:     { fill: 'var(--ink-3)', fontSize: 10, fontFamily: "'JetBrains Mono', monospace" },
  labelBgStyle:   { fill: 'var(--canvas-bg)', fillOpacity: 0.85 },
  labelBgPadding: [4, 6] as [number, number],
}

export const initialEdges: Edge[] = SITES.map((s, i) => {
  const pos   = sitePositions[i]
  const dx    = pos.x - HQ_CENTER.x
  const dy    = pos.y - HQ_CENTER.y
  const deg   = Math.atan2(dy, dx) * (180 / Math.PI)
  const srcH  = handleFromAngle(deg)
  const tgtH  = OPPOSITE_HANDLE[srcH]
  const meta  = EDGE_LABELS[s.id]

  return {
    ...edgeBase,
    id:           `e-${s.id}`,
    source:       'hq',
    target:       s.id,
    sourceHandle: srcH,
    targetHandle: tgtH,
    label:        meta.label,
    style: {
      stroke: 'var(--edge-stroke)', strokeWidth: 1.5,
      strokeLinecap: 'round' as const,
      ...(meta.dash ? { strokeDasharray: '6 4' } : {}),
    },
  }
})
