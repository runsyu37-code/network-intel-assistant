import { Fragment, useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Bell, Settings, AlertCircle, AlertTriangle, X, LogOut } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '../../stores/authStore'
import { getAlertLogs, getSites, getBuildingById, getFloorById } from '../../api/hierarchy'
import type { AlertLogApi } from '../../api/types'

interface Crumb { label: string; to?: string }

const SIMPLE_PAGE: Record<string, string> = {
  users: 'Users',
}

function alertLevel(type: string | null): 'alert' | 'warn' {
  if (!type) return 'warn'
  const t = type.toLowerCase()
  if (t.includes('critical') || t.includes('offline') || t.includes('lost') || t.includes('fail') || t.includes('hdd')) return 'alert'
  return 'warn'
}

function timeAgo(ts: string | null): string {
  if (!ts) return '—'
  const d = new Date(ts)
  if (isNaN(d.getTime())) return '—'
  const diff = Date.now() - d.getTime()
  const m = Math.floor(diff / 60_000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

function mapAlert(a: AlertLogApi) {
  const level = alertLevel(a.alert_type)
  const devType = a.device_type?.toLowerCase() ?? ''
  const href = devType === 'camera'
    ? `/dashboard/cameras/${a.device_id ?? ''}`
    : devType === 'nvr'
    ? `/dashboard/nvrs/${a.device_id ?? ''}`
    : `/dashboard/switches/${a.device_id ?? ''}`
  return { id: a.device_id ?? String(a.id), name: a.device_name ?? '—', msg: a.message, level, time: timeAgo(a.alerted_at), href }
}

const MOCK_ALERTS = [
  {
    id: 'SW-HQ-FLOOR3',
    name: 'Floor 3 Switch',
    msg: 'Device unreachable',
    level: 'alert' as const,
    time: '8m ago',
    href: '/dashboard/switches/SW-HQ-FLOOR3',
  },
  {
    id: 'SW-HQ-FLOOR2',
    name: 'Floor 2 Switch',
    msg: 'Chassis temp 62°C',
    level: 'warn' as const,
    time: '22m ago',
    href: '/dashboard/switches/SW-HQ-FLOOR2',
  },
]

function useBreadcrumbs(): Crumb[] {
  const { pathname } = useLocation()
  const parts = pathname.split('/').filter(Boolean)
  const page  = parts[1]
  const id    = parts[2]
  const home: Crumb = { label: 'Home', to: '/dashboard/topology' }

  const { data: apiFloor } = useQuery({
    queryKey: ['floor', id],
    queryFn: () => getFloorById(id!),
    enabled: page === 'floors' && !!id,
    staleTime: 60_000,
  })
  const buildingId = page === 'floors' ? apiFloor?.Building_ID : page === 'buildings' ? id : undefined
  const { data: apiBuilding } = useQuery({
    queryKey: ['buildings', buildingId],
    queryFn: () => getBuildingById(buildingId!),
    enabled: !!buildingId,
    staleTime: 60_000,
  })
  const { data: sites } = useQuery({
    queryKey: ['sites'],
    queryFn: getSites,
    enabled: page === 'floors' || page === 'buildings',
    staleTime: 300_000,
  })

  const siteLabel = (siteId?: string) =>
    sites?.find(s => s.Site_ID === siteId)?.name ?? siteId ?? '—'

  if (!page || page === 'topology') return [home]

  if (page === 'sites' && id) {
    return [home, { label: id }]
  }

  if (page === 'buildings' && id) {
    return [
      home,
      { label: siteLabel(apiBuilding?.Site_ID) },
      { label: apiBuilding?.name ?? `Building ${id.toUpperCase()}` },
    ]
  }

  if (page === 'floors' && id) {
    return [
      home,
      { label: siteLabel(apiBuilding?.Site_ID) },
      { label: apiBuilding?.name ?? '…', to: apiFloor ? `/dashboard/buildings/${apiFloor.Building_ID}` : undefined },
      { label: apiFloor?.name ?? id },
    ]
  }

  if (page === 'racks') {
    if (id) return [home, { label: 'Racks', to: '/dashboard/racks' }, { label: id }]
    return [home, { label: 'Racks' }]
  }

  if (page === 'cameras') {
    if (id) return [home, { label: 'Cameras', to: '/dashboard/cameras' }, { label: id }]
    return [home, { label: 'Cameras' }]
  }

  if (page === 'nvrs') {
    if (id) return [home, { label: 'NVRs', to: '/dashboard/nvrs' }, { label: id }]
    return [home, { label: 'NVRs' }]
  }

  if (page === 'switches') {
    if (id) return [home, { label: 'PoE Switches', to: '/dashboard/switches' }, { label: id }]
    return [home, { label: 'PoE Switches' }]
  }

  const simple = SIMPLE_PAGE[page]
  if (simple) return [home, { label: simple }]

  return [home]
}

export default function Topbar() {
  const crumbs   = useBreadcrumbs()
  const navigate = useNavigate()
  const logout   = useAuthStore(s => s.logout)
  const [alertsOpen, setAlertsOpen] = useState(false)
  const alertRef = useRef<HTMLDivElement>(null)

  const { data: alertData } = useQuery({
    queryKey: ['alert-logs-topbar'],
    queryFn: () => getAlertLogs({ limit: 5 }),
    refetchInterval: 30_000,
  })

  const alerts = alertData?.length
    ? alertData.filter(a => !a.resolved_at).slice(0, 5).map(mapAlert)
    : MOCK_ALERTS
  const alertCount = alerts.length

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  useEffect(() => {
    const parts = crumbs.map(c => c.label)
    const last  = parts[parts.length - 1]
    document.title = last && last !== 'Home' ? `SSM — ${last}` : 'SSM — Network Topology'
  }, [crumbs])

  useEffect(() => {
    if (!alertsOpen) return
    function onMouseDown(e: MouseEvent) {
      if (alertRef.current && !alertRef.current.contains(e.target as Node)) {
        setAlertsOpen(false)
      }
    }
    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [alertsOpen])

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

        <div ref={alertRef} style={{ position: 'relative' }}>
          <button
            className="pill pill-alert"
            style={{ cursor: 'pointer', border: 'none' }}
            onClick={() => setAlertsOpen(o => !o)}
          >
            <i className="pill-dot" />
            {alertCount} alert{alertCount !== 1 ? 's' : ''}
          </button>

          {alertsOpen && (
            <div className="alerts-dropdown">
              <div className="alerts-dd-head">
                <span>Active Alerts</span>
                <button className="alerts-dd-close" onClick={() => setAlertsOpen(false)}>
                  <X size={13} />
                </button>
              </div>
              {alerts.map(a => (
                <div
                  key={a.id}
                  className={`alerts-dd-item ${a.level}`}
                  onClick={() => { setAlertsOpen(false); navigate(a.href) }}
                >
                  <span className="alerts-dd-icon">
                    {a.level === 'alert'
                      ? <AlertCircle size={14} />
                      : <AlertTriangle size={14} />
                    }
                  </span>
                  <div className="alerts-dd-body">
                    <div className="alerts-dd-device">{a.id}</div>
                    <div className="alerts-dd-msg">{a.name} &middot; {a.msg}</div>
                  </div>
                  <span className="alerts-dd-time">{a.time}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <button className="icon-btn"><Bell size={16} /></button>
        <button className="icon-btn"><Settings size={16} /></button>
        <button className="icon-btn" title="Logout" onClick={handleLogout} style={{ color: 'var(--alert)' }}>
          <LogOut size={16} />
        </button>
      </div>
    </header>
  )
}
