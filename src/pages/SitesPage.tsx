import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getHierarchyTree } from '../api/hierarchy'
import type { BuildingTreeDto, FloorTreeDto } from '../api/types'

type Status = 'ok' | 'warn' | 'alert'

interface FloorData {
  id: string
  label: string
  cameras: number
  camerasOnline: number
}

interface BuildingData {
  id: string
  title: string
  status: Status
  floorList: FloorData[]
  cameras: number
  nvrs: number
}

const DOT_COLOR: Record<Status, string> = {
  ok:    'var(--ok)',
  warn:  'var(--warn)',
  alert: 'var(--alert)',
}

function buildingStatus(alertCount: number): Status {
  if (alertCount === 0) return 'ok'
  if (alertCount <= 2)  return 'warn'
  return 'alert'
}

function mapBuilding(b: BuildingTreeDto): BuildingData {
  const totalCameras = b.floors.reduce((s, f) => s + f.cameraCount, 0)
  return {
    id: b.buildingId,
    title: b.buildingName,
    status: buildingStatus(b.alertCount),
    cameras: totalCameras,
    nvrs: 0,
    floorList: [...b.floors]
      .sort((a, b) => b.floorNumber - a.floorNumber)
      .map((f: FloorTreeDto) => ({
        id: f.floorId,
        label: f.floorName ?? `F${f.floorNumber}`,
        cameras: f.cameraCount,
        camerasOnline: Math.max(0, f.cameraCount - f.alertCount),
      })),
  }
}

function IsometricSVG() {
  return (
    <svg viewBox="0 0 100 100" style={{ height: 80, strokeWidth: 1.5, stroke: 'var(--ink-3)', fill: 'none', display: 'block' }}>
      <path d="M50 10 L90 30 L90 70 L50 90 L10 70 L10 30 Z" />
      <path d="M50 10 L50 50 L90 70 M10 70 L50 50 M10 30 L50 50 L90 30" />
      <path d="M20 40 L50 55 L80 40 M20 50 L50 65 L80 50 M20 60 L50 75 L80 60" />
    </svg>
  )
}

interface CardProps {
  building: BuildingData
  onViewBuilding: () => void
  onViewPlan: (floorId: string) => void
}

function BuildingCard({ building, onViewBuilding, onViewPlan }: CardProps) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div
      className={`bldg-card-v2${expanded ? ' expanded' : ''}`}
      onClick={() => setExpanded(e => !e)}
    >
      <div className="bcv2-header" onClick={e => { e.stopPropagation(); onViewBuilding() }}>
        <div className="bcv2-title">
          {building.title}
          <span className="bcv2-dot" style={{ background: DOT_COLOR[building.status] }} />
        </div>
      </div>

      <div className="bcv2-visual">
        <IsometricSVG />
      </div>

      <div className="bcv2-stats">
        <div className="bcv2-stat">
          <div className="bcv2-stat-val">{building.floorList.length}</div>
          <div className="bcv2-stat-lbl">Floors</div>
        </div>
        <div className="bcv2-stat">
          <div className="bcv2-stat-val">{building.cameras}</div>
          <div className="bcv2-stat-lbl">Cameras</div>
        </div>
        <div className="bcv2-stat">
          <div className="bcv2-stat-val">{building.status !== 'ok' ? building.floorList.reduce((s, f) => s + (f.cameras - f.camerasOnline), 0) : 0}</div>
          <div className="bcv2-stat-lbl">Alerts</div>
        </div>
      </div>

      {expanded && (
        <div className="bcv2-floors" onClick={e => e.stopPropagation()}>
          {building.floorList.map(floor => {
            const pct = floor.cameras > 0 ? Math.round((floor.camerasOnline / floor.cameras) * 100) : 100
            return (
              <div key={floor.id} className="bcv2-floor-row">
                <div className="bcv2-floor-info">
                  <span className="bcv2-floor-name">{floor.label}</span>
                  <span className="bcv2-floor-count">{floor.cameras} CAMs</span>
                  <div
                    className="bcv2-bar-wrap"
                    title={`${floor.camerasOnline} Online, ${floor.cameras - floor.camerasOnline} Alert`}
                  >
                    <div className="bcv2-bar-fill" style={{ width: `${pct}%` }} />
                  </div>
                </div>
                <button
                  className="bcv2-btn-view"
                  onClick={e => { e.stopPropagation(); onViewPlan(floor.id) }}
                >
                  View Plan
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function SitesPage() {
  const navigate = useNavigate()
  const { siteId } = useParams<{ siteId: string }>()

  const { data: tree = [], isLoading } = useQuery({
    queryKey: ['hierarchy-tree'],
    queryFn: () => getHierarchyTree(),
    refetchOnWindowFocus: false,
  })

  const siteData = siteId ? tree.find(s => s.siteId === siteId) : null
  const siteLabel = siteData?.siteName ?? (siteId ? siteId : 'All Sites')

  const buildings: BuildingData[] = siteId
    ? (siteData?.buildings ?? []).map(mapBuilding)
    : tree.flatMap(s => s.buildings.map(mapBuilding))

  if (isLoading) return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-3)', height: '100%' }}>
      Loading sites...
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="page-head">
        <div>
          <h1>{siteLabel}</h1>
          <p className="page-sub">Click a card to expand floors — click the title to drill into building detail.</p>
        </div>
      </div>

      <div style={{ padding: '0 24px 32px', overflowY: 'auto', flex: 1 }}>
        {buildings.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--ink-3)' }}>
            ไม่พบอาคารในสาขานี้
          </div>
        ) : (
          <div className="bldg-grid-v2">
            {buildings.map(b => (
              <BuildingCard
                key={b.id}
                building={b}
                onViewBuilding={() => navigate(`/dashboard/buildings/${b.id}`)}
                onViewPlan={floorId => navigate(`/dashboard/floors/${floorId}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
