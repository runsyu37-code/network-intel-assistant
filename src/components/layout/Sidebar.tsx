import { type ElementType, useMemo, useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Building2, Camera, HardDrive,
  PlugZap, Server, Users, Sun, Moon, ChevronRight, MapPin, Map, ClipboardList,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useThemeStore } from '../../stores/themeStore'
import { useAuthStore } from '../../stores/authStore'
import { getDashboardSummary } from '../../api/hierarchy'

const BUILDING_LABEL: Record<string, string> = {
  a: 'Building A', b: 'Building B', c: 'Building C', d: 'Building D',
}
const FLOOR_SHORT: Record<string, string> = {
  'a-f6': 'F6 — Executive', 'a-f5': 'F5 — Meeting Rooms',
  'a-f4': 'F4 — Office',    'a-f3': 'F3 — Office',
  'a-f2': 'F2 — Server Room','a-f1': 'F1 — Lobby',
  'b-f4': 'F4 — Management', 'b-f3': 'F3 — Office',
  'b-f2': 'F2 — Office',    'b-f1': 'F1 — Lobby',
  'c-f1': 'F1 — Warehouse',  'd-f2': 'F2 — Security',
  'd-f1': 'F1 — Gate',
}

function useLocationCtx(): string | null {
  const { pathname } = useLocation()
  const parts = pathname.split('/').filter(Boolean)
  const page = parts[1]
  const id   = parts[2]
  if (page === 'buildings' && id) return BUILDING_LABEL[id] ?? `Building ${id.toUpperCase()}`
  if (page === 'floors' && id) {
    const bId = id.split('-')[0]
    return `${BUILDING_LABEL[bId] ?? 'Building'} · ${FLOOR_SHORT[id] ?? id}`
  }
  return null
}

interface NavItem {
  to: string
  Icon: ElementType
  label: string
  count?: number
  matchPrefixes?: string[]
  exact?: boolean
}

const SITES_SUB_PATHS = ['/dashboard/sites', '/dashboard/buildings', '/dashboard/floors', '/dashboard/map']

const NAV: { section: string; items: NavItem[] }[] = [
  {
    section: 'Monitor',
    items: [
      { to: '/dashboard',       Icon: LayoutDashboard, label: 'Dashboard', exact: true },
      { to: '/dashboard/audit', Icon: ClipboardList,   label: 'Audit View' },
      {
        to: '/dashboard/sites',
        Icon: Building2,
        label: 'Sites',
        count: 5,
        matchPrefixes: SITES_SUB_PATHS,
      },
    ],
  },
  {
    section: 'Devices',
    items: [
      { to: '/dashboard/cameras',  Icon: Camera,    label: 'Cameras',      count: 142 },
      { to: '/dashboard/nvrs',     Icon: HardDrive, label: 'NVRs',         count: 12  },
      { to: '/dashboard/switches', Icon: PlugZap,   label: 'PoE Switches', count: 8   },
      { to: '/dashboard/racks',    Icon: Server,    label: 'Racks',        count: 6   },
    ],
  },
]

const ADMIN_NAV: NavItem[] = [
  { to: '/dashboard/users', Icon: Users, label: 'Users' },
]

export default function Sidebar() {
  const { pathname } = useLocation()
  const { theme, toggle } = useThemeStore()
  const user        = useAuthStore((s) => s.user)
  const locationCtx = useLocationCtx()

  const onSitesPath = SITES_SUB_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'))
  const [sitesOpen, setSitesOpen] = useState(onSitesPath)

  useEffect(() => {
    if (onSitesPath) setSitesOpen(true)
  }, [onSitesPath])

  const mapActive = pathname === '/dashboard/map' || pathname.startsWith('/dashboard/map/')

  const { data: summaryData } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: () => getDashboardSummary(),
    refetchInterval: 30_000,
    staleTime: 15_000,
  })

  const dynCounts = useMemo(() => {
    if (!summaryData?.length) return {} as Record<string, number>
    return {
      Cameras:        summaryData.reduce((s, d) => s + d.totalCameras, 0),
      NVRs:           summaryData.reduce((s, d) => s + d.totalNvrs, 0),
      'PoE Switches': summaryData.reduce((s, d) => s + d.totalSwitches, 0),
    }
  }, [summaryData])

  const initials = user?.username ? user.username.slice(0, 2).toUpperCase() : 'RN'

  function navClass({ to, matchPrefixes, exact }: NavItem) {
    if (exact) return `nav-item${pathname === to ? ' active' : ''}`
    const prefixes = matchPrefixes ?? [to]
    const active = prefixes.some(p => pathname === p || pathname.startsWith(p + '/'))
    return `nav-item${active ? ' active' : ''}`
  }

  function renderItem(item: NavItem) {
    const { to, Icon, label, count } = item
    const displayCount = dynCounts[label] ?? count

    if (label === 'Sites') {
      const isActive = SITES_SUB_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'))
      return (
        <div key="sites">
          <div className="nav-item-row">
            <Link to={to} className={`nav-item${isActive ? ' active' : ''}`}>
              <Icon className="nav-ico" size={18} />
              Sites
              {displayCount !== undefined && <span className="nav-count">{displayCount}</span>}
            </Link>
            <button
              className={`nav-expand${isActive ? ' active' : ''}`}
              onClick={() => setSitesOpen(o => !o)}
              title={sitesOpen ? 'ซ่อนเมนูย่อย' : 'แสดงเมนูย่อย'}
            >
              <ChevronRight size={12} style={{ transform: sitesOpen ? 'rotate(90deg)' : 'none', transition: 'transform .2s' }} />
            </button>
          </div>

          {sitesOpen && (
            <Link to="/dashboard/map" className={`nav-sub${mapActive ? ' active' : ''}`}>
              <Map size={14} style={{ flex: 'none' }} />
              Building Map
            </Link>
          )}

          {locationCtx && (
            <div className="nav-ctx">
              <MapPin size={11} style={{ flex: 'none' }} />
              <span>{locationCtx}</span>
            </div>
          )}
        </div>
      )
    }

    return (
      <Link key={label} to={to} className={navClass(item)}>
        <Icon className="nav-ico" size={18} />
        {label}
        {displayCount !== undefined && <span className="nav-count">{displayCount}</span>}
      </Link>
    )
  }

  return (
    <aside className="sidebar">
      <div className="brand">
        <img src="/buono_icon.png" alt="Buono" className="brand-logo" />
        <div>
          <div className="brand-name">SSM</div>
          <div className="brand-ver">v1.0 Network Intel</div>
        </div>
      </div>

      {NAV.map(({ section, items }) => (
        <nav key={section} className="nav-section">
          <div className="nav-label">{section}</div>
          {items.map(item => renderItem(item))}
        </nav>
      ))}

      {user?.role === 'admin' && (
        <nav className="nav-section">
          <div className="nav-label">Admin</div>
          {ADMIN_NAV.map(item => renderItem(item))}
        </nav>
      )}

      <div className="sidebar-spacer" />

      <div className="sidebar-foot">
        <div className="theme-toggle">
          <button
            className={theme === 'light' ? 'on' : ''}
            onClick={() => theme !== 'light' && toggle()}
          >
            <Sun size={13} /> Light
          </button>
          <button
            className={theme === 'dark' ? 'on' : ''}
            onClick={() => theme !== 'dark' && toggle()}
          >
            <Moon size={13} /> Dark
          </button>
        </div>

        <div className="user-chip">
          <div className="user-avatar">{initials}</div>
          <div className="user-who">
            <div className="user-name">{user?.username ?? 'Guest'}</div>
            <div className="user-role">{user?.role ?? 'viewer'}</div>
          </div>
          <ChevronRight size={14} style={{ color: 'var(--ink-3)', flex: 'none' }} />
        </div>
      </div>
    </aside>
  )
}
