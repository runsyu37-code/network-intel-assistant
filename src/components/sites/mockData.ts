import type { Node, Edge } from 'reactflow'

export type Status = 'ok' | 'warn' | 'alert'

export interface SiteMapData  { label: string; sub: string; status: Status; alertCount: number; cameraCount: number }
export interface BldgMapData  { label: string; floors: number; cameras: number; status: Status; siteId: string }
export interface HQSiteData   { siteCount: number; cameraCount: number }

const X0 = 0    // HQ
const X1 = 320  // Sites
const X2 = 620  // Buildings

/* ── positions: vertical centre of each group ─────────────────── */
// Site A: 4 bldgs → y = 0,80,160,240  centre = 120
// Site B: 2 bldgs → y = 320,400       centre = 360
// Site C: 2 bldgs → y = 480,560       centre = 520
// Site D: 1 bldg  → y = 640           centre = 640
// HQ centre = avg(120,360,520,640) = 410

export const siteMapNodes: Node[] = [
  { id: 'hq', type: 'hqSiteNode', position: { x: X0, y: 410 },
    data: { siteCount: 4, cameraCount: 155 } as HQSiteData },

  // ── Site A ──────────────────────────────────────────────────
  { id: 's-a', type: 'siteMapNode', position: { x: X1, y: 120 },
    data: { label: 'Site A — HQ Bangkok',    sub: 'Sathorn, BKK',  status: 'alert', alertCount: 3, cameraCount: 71 } as SiteMapData },
  { id: 'b-a1', type: 'bldgMapNode', position: { x: X2, y: 0   },
    data: { label: 'Admin Tower',  floors: 5, cameras: 42, status: 'alert', siteId: 'a' } as BldgMapData },
  { id: 'b-a2', type: 'bldgMapNode', position: { x: X2, y: 80  },
    data: { label: 'Server Room',  floors: 2, cameras: 8,  status: 'ok',    siteId: 'a' } as BldgMapData },
  { id: 'b-a3', type: 'bldgMapNode', position: { x: X2, y: 160 },
    data: { label: 'Parking Deck', floors: 3, cameras: 15, status: 'warn',  siteId: 'a' } as BldgMapData },
  { id: 'b-a4', type: 'bldgMapNode', position: { x: X2, y: 240 },
    data: { label: 'Warehouse A',  floors: 1, cameras: 6,  status: 'ok',    siteId: 'a' } as BldgMapData },

  // ── Site B ──────────────────────────────────────────────────
  { id: 's-b', type: 'siteMapNode', position: { x: X1, y: 360 },
    data: { label: 'Site B — Chiang Mai DC', sub: 'Mueang, CNX',  status: 'ok',    alertCount: 0, cameraCount: 36 } as SiteMapData },
  { id: 'b-b1', type: 'bldgMapNode', position: { x: X2, y: 320 },
    data: { label: 'DC Block A',   floors: 4, cameras: 20, status: 'ok', siteId: 'b' } as BldgMapData },
  { id: 'b-b2', type: 'bldgMapNode', position: { x: X2, y: 400 },
    data: { label: 'Staff House',  floors: 2, cameras: 16, status: 'ok', siteId: 'b' } as BldgMapData },

  // ── Site C ──────────────────────────────────────────────────
  { id: 's-c', type: 'siteMapNode', position: { x: X1, y: 520 },
    data: { label: 'Site C — Phuket Branch', sub: 'Kathu, HKT',   status: 'ok',    alertCount: 0, cameraCount: 28 } as SiteMapData },
  { id: 'b-c1', type: 'bldgMapNode', position: { x: X2, y: 480 },
    data: { label: 'Main Office',  floors: 3, cameras: 18, status: 'ok', siteId: 'c' } as BldgMapData },
  { id: 'b-c2', type: 'bldgMapNode', position: { x: X2, y: 560 },
    data: { label: 'Storage',      floors: 1, cameras: 10, status: 'ok', siteId: 'c' } as BldgMapData },

  // ── Site D ──────────────────────────────────────────────────
  { id: 's-d', type: 'siteMapNode', position: { x: X1, y: 640 },
    data: { label: 'Site D — Khon Kaen',     sub: 'Mueang, KKC',  status: 'warn',  alertCount: 1, cameraCount: 9 } as SiteMapData },
  { id: 'b-d1', type: 'bldgMapNode', position: { x: X2, y: 640 },
    data: { label: 'Branch Office', floors: 2, cameras: 9, status: 'warn', siteId: 'd' } as BldgMapData },
]

const edgeSite = {
  type: 'smoothstep', sourceHandle: 'r', targetHandle: 'l',
  style: { stroke: 'var(--border-2)', strokeWidth: 1.5 },
}
const edgeBldg = {
  type: 'smoothstep', sourceHandle: 'r', targetHandle: 'l',
  style: { stroke: 'var(--border)', strokeWidth: 1 },
}

export const siteMapEdges: Edge[] = [
  // HQ → Sites
  { ...edgeSite, id: 'e-hq-a', source: 'hq', target: 's-a' },
  { ...edgeSite, id: 'e-hq-b', source: 'hq', target: 's-b' },
  { ...edgeSite, id: 'e-hq-c', source: 'hq', target: 's-c' },
  { ...edgeSite, id: 'e-hq-d', source: 'hq', target: 's-d' },
  // Site A → Buildings
  { ...edgeBldg, id: 'e-a-1', source: 's-a', target: 'b-a1' },
  { ...edgeBldg, id: 'e-a-2', source: 's-a', target: 'b-a2' },
  { ...edgeBldg, id: 'e-a-3', source: 's-a', target: 'b-a3' },
  { ...edgeBldg, id: 'e-a-4', source: 's-a', target: 'b-a4' },
  // Site B → Buildings
  { ...edgeBldg, id: 'e-b-1', source: 's-b', target: 'b-b1' },
  { ...edgeBldg, id: 'e-b-2', source: 's-b', target: 'b-b2' },
  // Site C → Buildings
  { ...edgeBldg, id: 'e-c-1', source: 's-c', target: 'b-c1' },
  { ...edgeBldg, id: 'e-c-2', source: 's-c', target: 'b-c2' },
  // Site D → Buildings
  { ...edgeBldg, id: 'e-d-1', source: 's-d', target: 'b-d1' },
]
