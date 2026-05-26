import { useState, useRef, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Video, Eye, Pencil, Plus, Server } from 'lucide-react'

/*
 * FLOOR PLAN IMAGE SETUP
 * ─────────────────────────────────────────────────────────────────
 * วางไฟล์รูปผังห้องไว้ใน:  public/floorplans/<floorId>.<ext>
 *
 * ตัวอย่าง:
 *   public/floorplans/a-f3.jpg   ← Building A, Floor 3
 *   public/floorplans/a-f2.png
 *   public/floorplans/b-f1.jpg
 *
 * รองรับ: .jpg  .jpeg  .png  .svg  .webp
 *
 * ถ้าไม่มีไฟล์ → code จะ fallback เป็น SVG vector plan อัตโนมัติ
 * ─────────────────────────────────────────────────────────────────
 */
const PLAN_EXTS = ['jpg', 'jpeg', 'png', 'svg', 'webp']

type CamStatus = 'ok' | 'alert'

interface Camera {
  id: string
  status: CamStatus
  left: string
  top: string
  rot: number
  room: string
}

interface RackMarker {
  id: string       // rackId used in navigate
  label: string
  left: string
  top: string
  status: 'ok' | 'warn' | 'alert'
}

interface FloorData {
  title: string
  sub: string
  cameras: Camera[]
  racks?: RackMarker[]
}

const FLOORS: Record<string, FloorData> = {
  'a-f6': {
    title: 'Floor 6 — Executive Office',
    sub: 'Executive workspace · 4 cameras · all online',
    cameras: [
      { id: 'CAM-01', status: 'ok', left: '22%', top: '22%', rot: 130, room: 'Executive Suite' },
      { id: 'CAM-02', status: 'ok', left: '55%', top: '25%', rot: 200, room: 'Board Room' },
      { id: 'CAM-03', status: 'ok', left: '78%', top: '20%', rot: 135, room: 'Director Room' },
      { id: 'CAM-04', status: 'ok', left: '40%', top: '75%', rot: 330, room: 'Lounge' },
    ],
  },
  'a-f5': {
    title: 'Floor 5 — Meeting Rooms',
    sub: 'Conference floors · 5 cameras · 1 warning',
    cameras: [
      { id: 'CAM-01', status: 'ok',    left: '22%', top: '22%', rot: 130, room: 'Conf A' },
      { id: 'CAM-02', status: 'ok',    left: '50%', top: '25%', rot: 180, room: 'Conf B' },
      { id: 'CAM-03', status: 'ok',    left: '78%', top: '20%', rot: 135, room: 'Conf C' },
      { id: 'CAM-04', status: 'ok',    left: '30%', top: '75%', rot: 330, room: 'Break Area' },
      { id: 'CAM-05', status: 'ok',    left: '70%', top: '78%', rot: 300, room: 'Corridor' },
    ],
  },
  'a-f4': {
    title: 'Floor 4 — Office',
    sub: 'Open-plan workspace · 8 cameras · all online',
    cameras: [
      { id: 'CAM-01', status: 'ok', left: '22%', top: '22%', rot: 130, room: 'Reception' },
      { id: 'CAM-02', status: 'ok', left: '50%', top: '28%', rot: 185, room: 'Open Office' },
      { id: 'CAM-03', status: 'ok', left: '78%', top: '18%', rot: 135, room: 'Manager' },
      { id: 'CAM-04', status: 'ok', left: '29%', top: '78%', rot: 325, room: 'Meeting Room' },
      { id: 'CAM-05', status: 'ok', left: '72%', top: '80%', rot: 300, room: 'Break Room' },
    ],
  },
  'a-f3': {
    title: 'Floor 3 — Office',
    sub: 'Open-plan workspace · 5 cameras · 1 offline',
    cameras: [
      { id: 'CAM-01', status: 'ok',    left: '22%', top: '22%', rot: 130, room: 'Reception' },
      { id: 'CAM-02', status: 'ok',    left: '50%', top: '28%', rot: 185, room: 'Open Office' },
      { id: 'CAM-03', status: 'ok',    left: '78%', top: '18%', rot: 135, room: 'Manager' },
      { id: 'CAM-04', status: 'ok',    left: '29%', top: '78%', rot: 325, room: 'Meeting Room' },
      { id: 'CAM-05', status: 'alert', left: '72%', top: '80%', rot: 300, room: 'Break Room — OFFLINE' },
    ],
  },
  'a-f2': {
    title: 'Floor 2 — Server Room',
    sub: 'IT infrastructure · 9 devices · 2 cams offline',
    cameras: [
      { id: 'CAM-01', status: 'ok',    left: '20%', top: '25%', rot: 130, room: 'Server Hall' },
      { id: 'CAM-02', status: 'alert', left: '55%', top: '22%', rot: 180, room: 'Rack A — OFFLINE' },
      { id: 'CAM-03', status: 'ok',    left: '80%', top: '30%', rot: 220, room: 'UPS Room' },
      { id: 'CAM-04', status: 'alert', left: '30%', top: '75%', rot: 0,   room: 'Access Control — OFFLINE' },
      { id: 'CAM-05', status: 'ok',    left: '70%', top: '70%', rot: 315, room: 'Exit' },
    ],
    racks: [
      { id: 'rack-a1', label: 'Rack A1', left: '42%', top: '50%', status: 'alert' },
      { id: 'rack-a2', label: 'Rack A2', left: '58%', top: '50%', status: 'ok'    },
    ],
  },
  'a-f1': {
    title: 'Floor 1 — Lobby · Reception',
    sub: 'Ground floor · 3 cameras · all online',
    cameras: [
      { id: 'CAM-01', status: 'ok', left: '22%', top: '30%', rot: 130, room: 'Main Entrance' },
      { id: 'CAM-02', status: 'ok', left: '55%', top: '25%', rot: 180, room: 'Reception Desk' },
      { id: 'CAM-03', status: 'ok', left: '78%', top: '70%', rot: 300, room: 'Elevator Hall' },
    ],
  },
}

const DEFAULT_FLOOR: FloorData = {
  title: 'Floor Plan',
  sub: '— cameras · view mode',
  cameras: [
    { id: 'CAM-01', status: 'ok', left: '25%', top: '25%', rot: 130, room: 'Area A' },
    { id: 'CAM-02', status: 'ok', left: '60%', top: '30%', rot: 200, room: 'Area B' },
    { id: 'CAM-03', status: 'ok', left: '75%', top: '70%', rot: 300, room: 'Area C' },
  ],
}

function FloorPlanBackground({ floorId }: { floorId: string }) {
  const [imgOk, setImgOk] = useState(false)
  const [extIdx, setExtIdx] = useState(0)

  const tryNext = () => {
    if (extIdx + 1 < PLAN_EXTS.length) setExtIdx(i => i + 1)
  }

  const src = `/floorplans/${floorId}.${PLAN_EXTS[extIdx]}`

  return (
    <>
      {/* Hidden probe image — tries each extension until one loads */}
      <img
        key={src}
        src={src}
        alt=""
        onLoad={() => setImgOk(true)}
        onError={tryNext}
        style={{ display: 'none' }}
      />

      {imgOk ? (
        /* ── Image floor plan ── */
        <img
          src={src}
          alt="Floor plan"
          style={{
            position: 'absolute', inset: 0,
            width: '100%', height: '100%',
            objectFit: 'contain',
            zIndex: 1, pointerEvents: 'none',
          }}
        />
      ) : (
        /* ── SVG vector fallback ── */
        <svg className="plan" viewBox="0 0 1000 600" preserveAspectRatio="none">
          <rect className="room-fill"     x="80"  y="60"  width="280" height="240" />
          <rect className="room-fill alt" x="360" y="60"  width="280" height="240" />
          <rect className="room-fill"     x="640" y="60"  width="280" height="240" />
          <rect className="room-fill alt" x="80"  y="300" width="840" height="40" />
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

const RACK_STATUS_COLOR = { ok: 'var(--ok)', warn: 'var(--warn)', alert: 'var(--alert)' }

export default function FloorPlanPage() {
  const { floorId } = useParams<{ floorId: string }>()
  const navigate = useNavigate()
  const [mode, setMode] = useState<'view' | 'edit'>('view')

  const floor = FLOORS[floorId ?? ''] ?? DEFAULT_FLOOR

  const [positions, setPositions] = useState<Record<string, { left: string; top: string }>>(() =>
    Object.fromEntries(floor.cameras.map(c => [c.id, { left: c.left, top: c.top }]))
  )
  const canvasRef  = useRef<HTMLDivElement>(null)
  const dragging   = useRef<{ id: string; startX: number; startY: number; origLeft: number; origTop: number } | null>(null)

  useEffect(() => {
    setPositions(Object.fromEntries(floor.cameras.map(c => [c.id, { left: c.left, top: c.top }])))
  }, [floorId])

  function startDrag(id: string, e: React.MouseEvent) {
    e.preventDefault()
    const canvas = canvasRef.current
    if (!canvas) return
    const rect   = canvas.getBoundingClientRect()
    const pos    = positions[id]
    dragging.current = {
      id,
      startX:   e.clientX,
      startY:   e.clientY,
      origLeft: parseFloat(pos.left) / 100 * rect.width,
      origTop:  parseFloat(pos.top)  / 100 * rect.height,
    }
  }

  function onDragMove(e: React.MouseEvent) {
    if (!dragging.current) return
    const canvas = canvasRef.current
    if (!canvas) return
    const rect    = canvas.getBoundingClientRect()
    const dx      = e.clientX - dragging.current.startX
    const dy      = e.clientY - dragging.current.startY
    const newLeft = Math.max(2, Math.min(98, (dragging.current.origLeft + dx) / rect.width  * 100))
    const newTop  = Math.max(2, Math.min(98, (dragging.current.origTop  + dy) / rect.height * 100))
    setPositions(p => ({
      ...p,
      [dragging.current!.id]: { left: `${newLeft.toFixed(1)}%`, top: `${newTop.toFixed(1)}%` },
    }))
  }

  function stopDrag() { dragging.current = null }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="page-head">
        <div>
          <h1>{floor.title}</h1>
          <p className="page-sub">{floor.sub}</p>
        </div>
        <div className="topo-legend">
          <span className="legend-swatch"><i style={{ background: 'var(--ok)'    }} />Online</span>
          <span className="legend-swatch"><i style={{ background: 'var(--alert)' }} />Offline</span>
        </div>
      </div>

      <div className="canvas-wrap" style={{ flex: 1, minHeight: 0 }}>
        <div
          ref={canvasRef}
          className={`canvas${mode === 'edit' ? ' edit' : ''}`}
          style={{ position: 'relative' }}
          onMouseMove={mode === 'edit' ? onDragMove : undefined}
          onMouseUp={stopDrag}
          onMouseLeave={stopDrag}
        >

          {/* Mode toggle */}
          <div className="mode-toggle">
            <button className={mode === 'view' ? 'on' : ''} onClick={() => setMode('view')}>
              <Eye size={13} /> View
            </button>
            <button className={mode === 'edit' ? 'on' : ''} onClick={() => setMode('edit')}>
              <Pencil size={13} /> Edit
            </button>
          </div>

          {/* Edit-mode banner */}
          <div className="edit-banner">
            <span className="eb-dot" />
            Edit mode · drag icons to reposition
          </div>

          {/* Floor plan: image if available, SVG fallback otherwise */}
          <FloorPlanBackground floorId={floorId ?? ''} />

          {/* Camera overlays */}
          {floor.cameras.map(cam => (
            <div
              key={cam.id}
              className={`cam ${cam.status}`}
              style={{ left: positions[cam.id]?.left ?? cam.left, top: positions[cam.id]?.top ?? cam.top }}
              onMouseDown={mode === 'edit' ? (e) => startDrag(cam.id, e) : undefined}
              title={`${cam.id} · ${cam.room}`}
            >
              <div className="fov" style={{ '--rot': `${cam.rot}deg` } as React.CSSProperties} />
              <div className="cam-icon">
                <Video size={16} />
              </div>
              <span className="cam-name">{cam.id}</span>
            </div>
          ))}

          {/* Rack markers */}
          {floor.racks?.map(r => (
            <div
              key={r.id}
              onClick={() => navigate(`/dashboard/racks/${r.id}`)}
              title={`Open ${r.label}`}
              style={{
                position: 'absolute', left: r.left, top: r.top,
                transform: 'translate(-50%,-50%)',
                zIndex: 3, cursor: 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                transition: 'transform .12s ease',
              }}
              onMouseEnter={e => (e.currentTarget.style.transform = 'translate(-50%,-50%) scale(1.08)')}
              onMouseLeave={e => (e.currentTarget.style.transform = 'translate(-50%,-50%)')}
            >
              <div style={{
                width: 32, height: 32, borderRadius: 7,
                background: 'var(--surface)', border: `2px solid ${RACK_STATUS_COLOR[r.status]}`,
                display: 'grid', placeItems: 'center',
                color: RACK_STATUS_COLOR[r.status],
                boxShadow: '0 2px 8px rgba(0,0,0,.18)',
              }}>
                <Server size={16} />
              </div>
              <span style={{
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 5, padding: '2px 7px',
                fontFamily: 'monospace', fontSize: 10, color: 'var(--ink-2)',
                fontWeight: 600, whiteSpace: 'nowrap',
                boxShadow: '0 1px 2px rgba(0,0,0,.06)',
              }}>{r.label}</span>
            </div>
          ))}

          {/* Edit-mode controls */}
          <button className="add-cam-btn">
            <Plus size={14} /> Add camera
          </button>
          <div className="role-hint">Admin · drag to reposition · drop onto plan to add</div>

          {/* Canvas tools (top-right) */}
          <div className="canvas-tools">
            <div className="group">
              <button className="icon-btn" title="Zoom in">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16 }}>
                  <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </button>
              <button className="icon-btn" title="Zoom out">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16 }}>
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </button>
              <button className="icon-btn" title="Fit to view">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16 }}>
                  <path d="M4 9V5a1 1 0 0 1 1-1h4" /><path d="M20 9V5a1 1 0 0 0-1-1h-4" />
                  <path d="M4 15v4a1 1 0 0 0 1 1h4" /><path d="M20 15v4a1 1 0 0 1-1 1h-4" />
                </svg>
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
