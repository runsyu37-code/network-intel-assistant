import { useState, useRef, useEffect } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { Video, Eye, Pencil, Plus, X } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { App, Tooltip } from 'antd'
import { getCameras, patchCameraPosition } from '../api/cameras'
import { getFloorById } from '../api/hierarchy'
import type { CameraApi } from '../api/types'
import { useAuthStore } from '../stores/authStore'

const PLAN_EXTS = ['jpg', 'jpeg', 'png', 'svg', 'webp']

type CamStatus = 'ok' | 'warn' | 'alert'

interface Camera {
  id: string; status: CamStatus; left: string; top: string; rot: number; room: string
  ip?: string; model?: string; lastSeen?: string; brand?: string; deviceName?: string
}



function mapApiCamera(a: CameraApi, idx: number): Camera {
  const s = (a.status ?? '').toLowerCase()
  const status: CamStatus = s === 'online' ? 'ok' : s === 'warning' ? 'warn' : 'alert'
  const left = a.position_x != null ? `${a.position_x.toFixed(1)}%` : `${10 + (idx % 4) * 22}%`
  const top  = a.position_y != null ? `${a.position_y.toFixed(1)}%` : `${15 + Math.floor(idx / 4) * 30}%`
  return {
    id: String(a.id),
    status,
    left,
    top,
    rot: 135,
    room: a.install_location ?? '—',
    ip: a.ip_address ?? '—',
    model: a.model ?? '—',
    lastSeen: a.last_seen ?? '—',
    brand: a.brand ?? '—',
    deviceName: a.device_name,
  }
}


// Floor plan images are static files in /public/floorplans/ — unauthenticated by design.
// Accepted for intranet-only deployment. If internet-facing, fetch as blob via:
// client.get(`/floors/${floorId}/floor-plan/image`, { responseType: 'blob' }) → URL.createObjectURL()
function FloorPlanBackground({ floorId }: { floorId: string }) {
  const [imgOk, setImgOk] = useState(false)
  const [extIdx, setExtIdx] = useState(0)
  const tryNext = () => { if (extIdx + 1 < PLAN_EXTS.length) setExtIdx(i => i + 1) }
  const src = `/floorplans/${floorId}.${PLAN_EXTS[extIdx]}`

  return (
    <>
      <img key={src} src={src} alt="" onLoad={() => setImgOk(true)} onError={tryNext} style={{ display: 'none' }} />
      {imgOk ? (
        <img src={src} alt="Floor plan" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', zIndex: 1, pointerEvents: 'none' }} />
      ) : (
        <svg className="plan" viewBox="0 0 1000 600" preserveAspectRatio="none">
          <rect className="room-fill"     x="80"  y="60"  width="280" height="240" />
          <rect className="room-fill alt" x="360" y="60"  width="280" height="240" />
          <rect className="room-fill"     x="640" y="60"  width="280" height="240" />
          <rect className="room-fill alt" x="80"  y="300" width="840" height="40"  />
          <rect className="room-fill"     x="80"  y="340" width="420" height="200" />
          <rect className="room-fill alt" x="500" y="340" width="420" height="200" />
          <rect className="floor-bg" x="80" y="60" width="840" height="480" />
          <line className="wall" x1="360" y1="60"  x2="360" y2="300" />
          <line className="wall" x1="640" y1="60"  x2="640" y2="300" />
          <line className="wall" x1="80"  y1="300" x2="920" y2="300" />
          <line className="wall" x1="80"  y1="340" x2="920" y2="340" />
          <line className="wall" x1="500" y1="340" x2="500" y2="540" />
          <line className="door" x1="200" y1="300" x2="240" y2="300" />
          <line className="door" x1="480" y1="300" x2="520" y2="300" />
          <line className="door" x1="780" y1="300" x2="820" y2="300" />
          <line className="door" x1="200" y1="340" x2="240" y2="340" />
          <line className="door" x1="700" y1="340" x2="740" y2="340" />
          <line className="door" x1="500" y1="430" x2="500" y2="460" />
          <text className="room-label" x="220" y="178">Reception</text>
          <text className="room-sub"   x="220" y="196">301 · pax 4</text>
          <text className="room-label" x="500" y="178">Open Office</text>
          <text className="room-sub"   x="500" y="196">302 · pax 24</text>
          <text className="room-label" x="780" y="178">Manager</text>
          <text className="room-sub"   x="780" y="196">303 · pax 2</text>
          <text className="room-label" x="290" y="438">Meeting Room</text>
          <text className="room-sub"   x="290" y="456">304 · seats 10</text>
          <text className="room-label" x="710" y="438">Break Room</text>
          <text className="room-sub"   x="710" y="456">305 · pax 12</text>
          <text className="room-sub"   x="500" y="325" style={{ fontSize: '9px', letterSpacing: '.18em' }}>— CORRIDOR —</text>
        </svg>
      )}
    </>
  )
}

const CAM_STATUS_COLOR: Record<CamStatus, string> = { ok: 'var(--ok)', warn: 'var(--warn)', alert: 'var(--alert)' }
const CAM_STATUS_LABEL: Record<CamStatus, string>  = { ok: 'Online',   warn: 'Warning',     alert: 'Offline'   }


export default function FloorPlanPage() {
  const { floorId }  = useParams<{ floorId: string }>()
  const navigate     = useNavigate()
  const location     = useLocation()
  const [mode, setMode]           = useState<'view' | 'edit'>('view')
  const [zoom, setZoom]           = useState(1.0)
  const [selectedCam, setSelectedCam] = useState<Camera | null>(null)

  const { data: apiFloor } = useQuery({
    queryKey: ['floor', floorId],
    queryFn: () => getFloorById(floorId!),
    enabled: !!floorId,
    staleTime: 60_000,
  })

  const [cameras, setCameras] = useState<Camera[]>([])
  const [positions, setPositions] = useState<Record<string, { left: string; top: string }>>({})

  const { data: apiCameras } = useQuery({
    queryKey: ['cameras', 'floor', floorId],
    queryFn: () => getCameras({ Floor_ID: floorId! }),
    enabled: !!floorId,
  })

  useEffect(() => {
    if (!apiCameras?.length) return
    const mapped = apiCameras.map(mapApiCamera)
    setCameras(mapped)
    setPositions(Object.fromEntries(mapped.map(c => [c.id, { left: c.left, top: c.top }])))
  }, [apiCameras])

  const { message } = App.useApp()
  const isAdmin = useAuthStore(s => s.user?.role === 'admin')

  useEffect(() => {
    if (!isAdmin) setMode('view')
  }, [isAdmin])

  const canvasRef      = useRef<HTMLDivElement>(null)
  const dragging       = useRef<{ id: string; startX: number; startY: number; origLeft: number; origTop: number; origLeftPct: string; origTopPct: string } | null>(null)
  const wasDragged     = useRef(false)
  const zoomRef        = useRef(zoom)
  const positionsRef   = useRef(positions)
  useEffect(() => { zoomRef.current = zoom }, [zoom])
  useEffect(() => { positionsRef.current = positions }, [positions])

  useEffect(() => {
    setCameras([])
    setPositions({})
    setZoom(1.0)
    setMode('view')
    setSelectedCam(null)
  }, [floorId])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (document.activeElement as HTMLElement)?.tagName?.toUpperCase()
      if (tag === 'INPUT' || tag === 'TEXTAREA') return
      if (e.key === 'Escape' && mode === 'edit') {
        e.stopImmediatePropagation(); setMode('view')
      } else if (e.key === '=' || e.key === '+') {
        setZoom(z => Math.min(3.0, parseFloat((z + 0.2).toFixed(2))))
      } else if (e.key === '-') {
        setZoom(z => Math.max(0.4, parseFloat((z - 0.2).toFixed(2))))
      } else if (e.key === '0') {
        setZoom(1.0)
      }
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [mode])

  useEffect(() => {
    const el = canvasRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      setZoom(z => Math.max(0.4, Math.min(3.0, parseFloat((z - e.deltaY * 0.0012).toFixed(3)))))
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [])

  const clamp = (z: number) => Math.max(0.4, Math.min(3.0, z))

  function startDrag(id: string, e: React.MouseEvent) {
    e.preventDefault(); e.stopPropagation()
    wasDragged.current = false
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const pos  = positions[id] ?? { left: '50%', top: '50%' }
    dragging.current = {
      id, startX: e.clientX, startY: e.clientY,
      origLeft: parseFloat(pos.left) / 100 * rect.width,
      origTop:  parseFloat(pos.top)  / 100 * rect.height,
      origLeftPct: pos.left,
      origTopPct:  pos.top,
    }
  }

  function onDragMove(e: React.MouseEvent) {
    if (!dragging.current) return
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const z    = zoomRef.current
    const dx   = (e.clientX - dragging.current.startX) / z
    const dy   = (e.clientY - dragging.current.startY) / z
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) wasDragged.current = true
    const newLeft = Math.max(2, Math.min(98, (dragging.current.origLeft + dx) / rect.width  * 100))
    const newTop  = Math.max(2, Math.min(98, (dragging.current.origTop  + dy) / rect.height * 100))
    setPositions(p => ({ ...p, [dragging.current!.id]: { left: `${newLeft.toFixed(1)}%`, top: `${newTop.toFixed(1)}%` } }))
  }

  function stopDrag() {
    if (dragging.current && wasDragged.current) {
      const { id, origLeftPct, origTopPct } = dragging.current
      const pos = positionsRef.current[id]
      dragging.current = null

      if (pos) {
        const camId = parseInt(id)
        if (!isNaN(camId)) {
          patchCameraPosition(camId, parseFloat(pos.left), parseFloat(pos.top))
            .catch(() => {
              setPositions(prev => ({ ...prev, [id]: { left: origLeftPct, top: origTopPct } }))
              message.error('Failed to save camera position. Please try again.')
            })
        }
      }
    } else {
      dragging.current = null
    }
  }

  function onPlanClick(e: React.MouseEvent<HTMLDivElement>) {
    if (mode !== 'edit') return
    if (wasDragged.current) { wasDragged.current = false; return }
    const target = e.target as HTMLElement
    if (target.closest('.cam') || target.dataset['rack']) return
    const canvas = canvasRef.current
    if (!canvas) return
    const rect    = canvas.getBoundingClientRect()
    const z       = zoomRef.current
    const logX    = (e.clientX - rect.left) / z
    const logY    = (e.clientY - rect.top)  / z
    const leftPct = Math.max(3, Math.min(97, (logX / rect.width)  * 100))
    const topPct  = Math.max(3, Math.min(97, (logY / rect.height) * 100))
    const leftStr = `${leftPct.toFixed(1)}%`
    const topStr  = `${topPct.toFixed(1)}%`
    const newId   = `CAM-${String(cameras.length + 1).padStart(2, '0')}`
    const newCam: Camera = { id: newId, status: 'ok', left: leftStr, top: topStr, rot: 135, room: 'New Camera', ip: '—', model: '—', lastSeen: '—' }
    setCameras(prev => [...prev, newCam])
    setPositions(prev => ({ ...prev, [newId]: { left: leftStr, top: topStr } }))
  }

  const panelCam = selectedCam ? cameras.find(c => c.id === selectedCam.id) ?? selectedCam : null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* Page header */}
      <div className="page-head">
        <div>
          <h1>{apiFloor?.name ?? `Floor ${floorId}`}</h1>
          <p className="page-sub">{apiFloor?.function ?? '—'}</p>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div className="topo-legend">
            <span className="legend-swatch"><i style={{ background: 'var(--ok)'    }} />Online</span>
            <span className="legend-swatch"><i style={{ background: 'var(--warn)'  }} />Warning</span>
            <span className="legend-swatch"><i style={{ background: 'var(--alert)' }} />Offline</span>
          </div>
          {/* Mode toggle pill — admin only */}
          {isAdmin && (
            <div style={{
              display: 'flex', background: 'var(--surface-2)', borderRadius: 999,
              padding: 3, border: '1px solid var(--border)',
            }}>
              {(['view', 'edit'] as const).map(m => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  style={{
                    padding: '5px 14px', fontSize: 12, fontWeight: 600,
                    borderRadius: 999, border: 'none', cursor: 'pointer',
                    background: mode === m ? 'var(--surface)' : 'transparent',
                    color: mode === m ? 'var(--ink)' : 'var(--ink-3)',
                    boxShadow: mode === m ? 'var(--shadow-1)' : 'none',
                    display: 'flex', alignItems: 'center', gap: 6,
                    transition: 'background .15s, color .15s',
                  }}
                >
                  {m === 'view' ? <Eye size={12} /> : <Pencil size={12} />}
                  {m === 'view' ? 'View' : 'Edit'}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main area: canvas + side panel */}
      <div style={{ flex: 1, minHeight: 0, display: 'flex' }}>

        {/* Canvas area */}
        <div className="canvas-wrap" style={{ flex: 1, minWidth: 0 }}>
          <div
            ref={canvasRef}
            className={`canvas${mode === 'edit' ? ' edit' : ''}`}
            style={{ position: 'relative', overflow: 'hidden' }}
            onMouseMove={mode === 'edit' ? onDragMove : undefined}
            onMouseUp={stopDrag}
            onMouseLeave={stopDrag}
            onClick={onPlanClick}
          >
            {/* Zoom layer — floor plan */}
            <div style={{ position: 'absolute', inset: 0, transform: `scale(${zoom})`, transformOrigin: '0 0', pointerEvents: 'none' }}>
              <FloorPlanBackground floorId={floorId ?? ''} />
            </div>

            {/* Camera + rack overlays */}
            <div style={{ position: 'absolute', inset: 0, transform: `scale(${zoom})`, transformOrigin: '0 0', cursor: mode === 'edit' ? 'crosshair' : 'default' }}>
              {cameras.map(cam => (
                <Tooltip
                  key={cam.id}
                  title={
                    <div style={{ fontSize: 12, lineHeight: 1.8 }}>
                      <div><b>{cam.deviceName ?? cam.id}</b></div>
                      <div>IP: {cam.ip}</div>
                      <div>Status: {CAM_STATUS_LABEL[cam.status]}</div>
                      <div>Brand: {cam.brand}</div>
                      <div>Last seen: {cam.lastSeen}</div>
                    </div>
                  }
                  placement="top"
                  mouseEnterDelay={0.4}
                >
                  <div
                    className={`cam ${cam.status}`}
                    style={{
                      left: positions[cam.id]?.left ?? cam.left,
                      top: positions[cam.id]?.top ?? cam.top,
                      cursor: mode === 'view' ? 'pointer' : undefined,
                      outline: panelCam?.id === cam.id ? `3px solid var(--accent)` : undefined,
                      outlineOffset: 2,
                    }}
                    onMouseDown={mode === 'edit' ? (e) => startDrag(cam.id, e) : undefined}
                    onClick={mode === 'view' ? (e) => {
                      e.stopPropagation()
                      setSelectedCam(cam)
                    } : undefined}
                  >
                    <div className="fov" style={{ '--rot': `${cam.rot}deg` } as React.CSSProperties} />
                    <div className="cam-icon" />
                    <span className="cam-name">{cam.id}</span>
                  </div>
                </Tooltip>
              ))}

            </div>

            {/* Edit banner */}
            <div className="edit-banner">
              <span className="eb-dot" />
              Edit mode · click floor plan to add · drag to move · Esc to exit
            </div>

            {/* Add camera button (edit mode) */}
            <button
              className="add-cam-btn"
              onClick={e => {
                e.stopPropagation()
                const leftStr = '50%', topStr = '50%'
                const newId   = `CAM-${String(cameras.length + 1).padStart(2, '0')}`
                const newCam: Camera = { id: newId, status: 'ok', left: leftStr, top: topStr, rot: 135, room: 'New Camera' }
                setCameras(prev => [...prev, newCam])
                setPositions(prev => ({ ...prev, [newId]: { left: leftStr, top: topStr } }))
              }}
            >
              <Plus size={14} /> Add camera
            </button>
            <div className="role-hint">Click on floor plan to place · drag to reposition</div>

            {/* Zoom controls */}
            <div className="canvas-tools">
              <div className="ct-group">
                <button className="icon-btn" title="Zoom in  ( + )" onClick={() => setZoom(z => clamp(parseFloat((z + 0.2).toFixed(2))))}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 15, height: 15 }}>
                    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                </button>
                <div className="ct-label">{Math.round(zoom * 100)}%</div>
                <button className="icon-btn" title="Zoom out  ( - )" onClick={() => setZoom(z => clamp(parseFloat((z - 0.2).toFixed(2))))}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 15, height: 15 }}>
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                </button>
                <button className="icon-btn" title="Reset zoom  ( 0 )" onClick={() => setZoom(1.0)}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 15, height: 15 }}>
                    <path d="M4 9V5a1 1 0 0 1 1-1h4" /><path d="M20 9V5a1 1 0 0 0-1-1h-4" />
                    <path d="M4 15v4a1 1 0 0 0 1 1h4" /><path d="M20 15v4a1 1 0 0 1-1 1h-4" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Side panel — camera detail */}
        <div style={{
          width: 280, flexShrink: 0,
          background: 'var(--surface)',
          borderLeft: '1px solid var(--border)',
          display: 'flex', flexDirection: 'column',
        }}>
          <div style={{
            padding: '14px 16px', borderBottom: '1px solid var(--border)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <span style={{ fontWeight: 700, fontSize: 14 }}>
              {panelCam ? panelCam.id : 'Camera Detail'}
            </span>
            {panelCam && (
              <button
                className="tbl-icon-btn"
                onClick={() => setSelectedCam(null)}
                title="Close"
              >
                <X size={15} />
              </button>
            )}
          </div>

          {panelCam ? (
            <div style={{ padding: 16, flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Thumbnail placeholder */}
              <div style={{
                width: '100%', aspectRatio: '16/9',
                background: 'var(--surface-2)', borderRadius: 8,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--ink-3)', border: '1px solid var(--border)',
              }}>
                <Video size={32} />
              </div>

              {/* Detail rows */}
              {[
                { label: 'Status',    value: CAM_STATUS_LABEL[panelCam.status], isStatus: true },
                { label: 'Room',      value: panelCam.room,                     isStatus: false },
                { label: 'IP',        value: panelCam.ip ?? '—',                isStatus: false, mono: true },
                { label: 'Model',     value: panelCam.model ?? '—',             isStatus: false },
                { label: 'Last Seen', value: panelCam.lastSeen ?? '—',          isStatus: false, mono: true },
              ].map(row => (
                <div key={row.label} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  borderBottom: '1px solid var(--border)', paddingBottom: 10,
                }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '.05em' }}>
                    {row.label}
                  </span>
                  {row.isStatus ? (
                    <span style={{
                      borderRadius: 999, fontSize: 10, fontWeight: 700,
                      textTransform: 'uppercase', padding: '2px 9px',
                      background: `color-mix(in srgb, ${CAM_STATUS_COLOR[panelCam.status]} 14%, transparent)`,
                      color: CAM_STATUS_COLOR[panelCam.status],
                    }}>
                      {row.value}
                    </span>
                  ) : (
                    <span style={{
                      fontSize: 12, fontWeight: 600, color: 'var(--ink)',
                      fontFamily: row.mono ? 'JetBrains Mono, monospace' : undefined,
                    }}>
                      {row.value}
                    </span>
                  )}
                </div>
              ))}

              {/* Open Detail button */}
              <div style={{ marginTop: 'auto' }}>
                <button
                  className="btn-primary"
                  style={{ width: '100%', justifyContent: 'center' }}
                  onClick={() => {
                    const numericId = parseInt(panelCam.id)
                    if (!isNaN(numericId)) {
                      navigate(`/dashboard/cameras/${numericId}`, { state: { from: location.pathname } })
                    } else {
                      const realId = 'CAM-' + panelCam.id.split('-')[1].padStart(3, '0')
                      navigate(`/dashboard/cameras/${realId}`, { state: { from: location.pathname } })
                    }
                  }}
                >
                  Open Detail
                </button>
              </div>
            </div>
          ) : (
            <div style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              color: 'var(--ink-3)', gap: 10, padding: 24,
            }}>
              <Video size={36} style={{ opacity: .3 }} />
              <span style={{ fontSize: 12, textAlign: 'center' }}>
                Click a camera on the floor plan to see details
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
