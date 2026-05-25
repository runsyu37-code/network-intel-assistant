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

export const initialNodes: Node[] = [
  {
    id: 'hq',
    type: 'hqNode',
    position: { x: 400, y: 270 },
    data: { label: 'HQ — Core', ip: '10.0.0.1 · core router', siteCount: 6 } as HQData,
  },
  {
    id: 'site-a',
    type: 'siteNode',
    position: { x: 60, y: 60 },
    data: { label: 'Site A — HQ Bangkok',    sub: 'Sathorn, BKK',  count: 42, status: 'alert' } as SiteData,
  },
  {
    id: 'site-b',
    type: 'siteNode',
    position: { x: 730, y: 60 },
    data: { label: 'Site B — Chiang Mai DC', sub: 'Mueang, CNX',  count: 28, status: 'ok'    } as SiteData,
  },
  {
    id: 'site-c',
    type: 'siteNode',
    position: { x: 730, y: 480 },
    data: { label: 'Site C — Phuket Branch', sub: 'Kathu, HKT',   count: 14, status: 'ok'    } as SiteData,
  },
  {
    id: 'site-d',
    type: 'siteNode',
    position: { x: 60, y: 480 },
    data: { label: 'Site D — Khon Kaen',     sub: 'Mueang, KKC',  count: 9,  status: 'warn'  } as SiteData,
  },
  {
    id: 'site-e',
    type: 'siteNode',
    position: { x: 400, y: -60 },
    data: { label: 'Site E — Hat Yai',        sub: 'Hat Yai, HDY', count: 6,  status: 'ok'    } as SiteData,
  },
  {
    id: 'site-f',
    type: 'siteNode',
    position: { x: 400, y: 570 },
    data: { label: 'Site F — Udon Thani',     sub: 'Mueang, UTH',  count: 5,  status: 'ok'    } as SiteData,
  },
]

const edgeBase = {
  style:          { stroke: 'var(--edge-stroke)', strokeWidth: 1.5, strokeLinecap: 'round' as const },
  labelStyle:     { fill: 'var(--ink-3)', fontSize: 10, fontFamily: "'JetBrains Mono', monospace" },
  labelBgStyle:   { fill: 'var(--canvas-bg)', fillOpacity: 0.85 },
  labelBgPadding: [4, 6] as [number, number],
}

export const initialEdges: Edge[] = [
  {
    ...edgeBase, id: 'e-a', source: 'hq', target: 'site-a',
    label: '1 Gbps · MPLS',
    style: { ...edgeBase.style, stroke: 'var(--alert)', strokeWidth: 2 },
  },
  { ...edgeBase, id: 'e-b', source: 'hq', target: 'site-b', label: '1 Gbps · MPLS' },
  { ...edgeBase, id: 'e-c', source: 'hq', target: 'site-c', label: '500 Mbps' },
  { ...edgeBase, id: 'e-d', source: 'hq', target: 'site-d', label: '500 Mbps' },
  {
    ...edgeBase, id: 'e-e', source: 'hq', target: 'site-e',
    label: 'VPN',
    style: { ...edgeBase.style, strokeDasharray: '6 4' },
  },
  {
    ...edgeBase, id: 'e-f', source: 'hq', target: 'site-f',
    label: 'VPN',
    style: { ...edgeBase.style, strokeDasharray: '6 4' },
  },
]
