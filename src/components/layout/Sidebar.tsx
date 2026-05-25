import { NavLink } from 'react-router-dom'
import {
  Network, Building2, Camera, HardDrive,
  PlugZap, Server, Users, Sun, Moon, ChevronRight,
} from 'lucide-react'
import { useThemeStore } from '../../stores/themeStore'
import { useAuthStore } from '../../stores/authStore'

const NAV = [
  {
    section: 'Monitor',
    items: [
      { to: '/dashboard/topology', Icon: Network,    label: 'Topology'      },
      { to: '/dashboard/topology',  Icon: Building2,  label: 'Sites',  count: 6 },
    ],
  },
  {
    section: 'Devices',
    items: [
      { to: '/dashboard/cameras',  Icon: Camera,    label: 'Cameras',       count: 142 },
      { to: '/dashboard/nvrs',     Icon: HardDrive, label: 'NVRs',          count: 12  },
      { to: '/dashboard/switches', Icon: PlugZap,   label: 'PoE Switches',  count: 8   },
      { to: '/dashboard/racks',    Icon: Server,    label: 'Racks',         count: 6   },
    ],
  },
]

const ADMIN_NAV = [
  { to: '/dashboard/users', Icon: Users, label: 'Users' },
]

export default function Sidebar() {
  const { theme, toggle } = useThemeStore()
  const user = useAuthStore((s) => s.user)

  const initials = user?.username
    ? user.username.slice(0, 2).toUpperCase()
    : 'RN'

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
          {items.map(({ to, Icon, label, count }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
            >
              <Icon className="nav-ico" size={18} />
              {label}
              {count !== undefined && <span className="nav-count">{count}</span>}
            </NavLink>
          ))}
        </nav>
      ))}

      {user?.role === 'admin' && (
        <nav className="nav-section">
          <div className="nav-label">Admin</div>
          {ADMIN_NAV.map(({ to, Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
            >
              <Icon className="nav-ico" size={18} />
              {label}
            </NavLink>
          ))}
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
