import { Fragment } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Bell, Settings } from 'lucide-react'

interface Crumb { label: string; to?: string }

const SITE_LABEL: Record<string, string> = {
  'hq':     'HQ Bangkok',
  'site-a': 'Site A — HQ Bangkok',
  'site-b': 'Site B — Chiang Mai DC',
  'site-c': 'Site C — Phuket Branch',
  'site-d': 'Site D — Khon Kaen',
  'site-e': 'Site E — Hat Yai',
  'site-f': 'Site F — Udon Thani',
}

const BUILDING_LABEL: Record<string, string> = {
  a: 'Building A', b: 'Building B', c: 'Building C', d: 'Building D',
}

const BUILDING_SITE: Record<string, string> = {
  a: 'hq', b: 'hq', c: 'hq', d: 'hq',
}

const FLOOR_LABEL: Record<string, string> = {
  'a-f6': 'F6 — Executive Office',
  'a-f5': 'F5 — Meeting Rooms',
  'a-f4': 'F4 — Office',
  'a-f3': 'F3 — Office',
  'a-f2': 'F2 — Server Room',
  'a-f1': 'F1 — Lobby',
  'b-f4': 'F4 — Management',
  'b-f3': 'F3 — Office',
  'b-f2': 'F2 — Office',
  'b-f1': 'F1 — Lobby',
  'c-f1': 'F1 — Warehouse',
  'd-f2': 'F2 — Security Control',
  'd-f1': 'F1 — Gate',
}

const RACK_LABEL: Record<string, string> = {
  'rack-a1': 'Rack A1', 'rack-a2': 'Rack A2', 'rack-b1': 'Rack B1',
  'rack-c1': 'Rack C1', 'rack-p1': 'Rack P1', 'rack-k1': 'Rack K1',
}

const SIMPLE_PAGE: Record<string, string> = {
  nvrs:     'NVRs',
  switches: 'PoE Switches',
  users:    'Users',
}

function useBreadcrumbs(): Crumb[] {
  const { pathname } = useLocation()
  const parts = pathname.split('/').filter(Boolean)
  const page  = parts[1]
  const id    = parts[2]
  const home: Crumb = { label: 'Home', to: '/dashboard/topology' }

  if (!page || page === 'topology') return [home]

  if (page === 'sites' && id) {
    return [home, { label: SITE_LABEL[id] ?? id }]
  }

  if (page === 'buildings' && id) {
    const siteId = BUILDING_SITE[id] ?? 'hq'
    return [
      home,
      { label: SITE_LABEL[siteId], to: `/dashboard/sites/${siteId}` },
      { label: BUILDING_LABEL[id] ?? `Building ${id.toUpperCase()}` },
    ]
  }

  if (page === 'floors' && id) {
    const bId    = id.split('-')[0]
    const siteId = BUILDING_SITE[bId] ?? 'hq'
    return [
      home,
      { label: SITE_LABEL[siteId], to: `/dashboard/sites/${siteId}` },
      { label: BUILDING_LABEL[bId] ?? `Building ${bId.toUpperCase()}`, to: `/dashboard/buildings/${bId}` },
      { label: FLOOR_LABEL[id] ?? id },
    ]
  }

  if (page === 'racks') {
    if (id) return [home, { label: 'Racks', to: '/dashboard/racks' }, { label: RACK_LABEL[id] ?? id }]
    return [home, { label: 'Racks' }]
  }

  if (page === 'cameras') {
    if (id) return [home, { label: 'Cameras', to: '/dashboard/cameras' }, { label: id }]
    return [home, { label: 'Cameras' }]
  }

  const simple = SIMPLE_PAGE[page]
  if (simple) return [home, { label: simple }]

  return [home]
}

export default function Topbar() {
  const crumbs = useBreadcrumbs()

  return (
    <header className="topbar">
      <nav className="crumbs">
        {crumbs.map((c, i) => (
          <Fragment key={i}>
            {i > 0 && <span className="crumb-sep">/</span>}
            {c.to
              ? <Link to={c.to}>{c.label}</Link>
              : <span className="crumb-here">{c.label}</span>
            }
          </Fragment>
        ))}
      </nav>

      <div className="topbar-right">
        <span className="pill pill-poll">
          <i className="pill-dot" style={{ background: 'var(--ok)' }} />
          Polling 30s
        </span>
        <span className="pill pill-alert">
          <i className="pill-dot" />
          2 alerts
        </span>
        <button className="icon-btn"><Bell size={16} /></button>
        <button className="icon-btn"><Settings size={16} /></button>
      </div>
    </header>
  )
}
