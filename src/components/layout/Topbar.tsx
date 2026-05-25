import { Link, useLocation } from 'react-router-dom'
import { Bell, Settings } from 'lucide-react'

const PAGE_LABELS: Record<string, string> = {
  topology: 'Topology',
  sites:    'Sites & Buildings',
  cameras:  'Cameras',
  nvrs:     'NVRs',
  switches: 'PoE Switches',
  racks:    'Racks',
  users:    'Users',
}

export default function Topbar() {
  const { pathname } = useLocation()
  const segment = pathname.split('/').filter(Boolean)[1] ?? ''
  const pageLabel = PAGE_LABELS[segment] ?? segment

  return (
    <header className="topbar">
      <nav className="crumbs">
        <Link to="/dashboard/topology">Home</Link>
        {pageLabel && (
          <>
            <span className="crumb-sep">/</span>
            <span className="crumb-here">{pageLabel}</span>
          </>
        )}
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
        <button className="icon-btn">
          <Bell size={16} />
        </button>
        <button className="icon-btn">
          <Settings size={16} />
        </button>
      </div>
    </header>
  )
}
