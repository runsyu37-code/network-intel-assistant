import type { ElementType } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  Network, Building2, Camera, HardDrive,
  PlugZap, Server, Users, Sun, Moon, ChevronRight,
} from 'lucide-react'
import { useThemeStore } from '../../stores/themeStore'
import { useAuthStore } from '../../stores/authStore'

interface NavItem {
  to: string
  Icon: ElementType
  label: string
  count?: number
  matchPrefixes?: string[]
}

const NAV: { section: string; items: NavItem[] }[] = [
  {
    section: 'Monitor',
    items: [
      { to: '/dashboard/topology', Icon: Network,   label: 'Topology' },
      {
        to: '/dashboard/sites/hq',
        Icon: Building2,
        label: 'Sites',
        count: 6,
        matchPrefixes: ['/dashboard/sites', '/dashboard/buildings', '/dashboard/floors'],
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
  const user = useAuthStore((s) => s.user)

  const initials = user?.username ? user.username.slice(0, 2).toUpperCase() : 'RN'

  function navClass({ to, matchPrefixes }: NavItem) {
    const prefixes = matchPrefixes ?? [to]
    const active = prefixes.some(p => pathname === p || pathname.startsWith(p + '/'))
    return `nav-item${active ? ' active' : ''}`
  }

  function renderItem(item: NavItem) {
    const { to, Icon, label, count } = item
    return (
      <Link key={label} to={to} className={navClass(item)}>
        <Icon className="nav-ico" size={18} />
        {label}
        {count !== undefined && <span className="nav-count">{count}</span>}
      </Link>
    )
  }

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-logo">S</div>
        <div>
          <div className="brand-name">SSM</div>
          <div className="brand-ver">v1.0 Network Intel</div>
        </div>
      </div>

      {NAV.map(({ section, items }) => (
        <nav key={section} className="nav-section">
          <div className="nav-label">{section}</div>
          {items.map(renderItem)}
        </nav>
      ))}

      {user?.role === 'admin' && (
        <nav className="nav-section">
          <div className="nav-label">Admin</div>
          {ADMIN_NAV.map(renderItem)}
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
