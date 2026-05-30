import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Building2, Layers } from 'lucide-react'
import { getBuildings } from '../api/hierarchy'
type TileMode = 'osm' | 'satellite'

const TILES: Record<TileMode, { url: string; attribution: string }> = {
  osm: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '© <a href="https://www.esri.com">Esri</a>',
  },
}

function buildingIcon(alertCount: number): L.DivIcon {
  const color = alertCount > 0 ? 'var(--alert)' : 'var(--ok)'
  return L.divIcon({
    className: '',
    html: `<div style="width:18px;height:18px;border-radius:50%;background:${color};border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,.35)"></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
    popupAnchor: [0, -12],
  })
}

export default function BuildingMapPage() {
  const navigate   = useNavigate()
  const [tile, setTile]           = useState<TileMode>('osm')
  const [siteFilter, setSiteFilter] = useState('all')

  const { data, isPending, isError } = useQuery({
    queryKey: ['buildings-map'],
    queryFn: () => getBuildings(),
  })

  const sites = useMemo(
    () => [...new Set((data ?? []).map(b => b.Site_ID))].sort(),
    [data],
  )

  const filtered = useMemo(
    () => (data ?? []).filter(b => siteFilter === 'all' || b.Site_ID === siteFilter),
    [data, siteFilter],
  )

  const mapped   = filtered.filter(b => b.lat != null && b.lng != null)
  const unmapped = filtered.filter(b => b.lat == null || b.lng == null)

  const center: [number, number] = mapped.length > 0
    ? [mapped.reduce((s, b) => s + b.lat!, 0) / mapped.length,
       mapped.reduce((s, b) => s + b.lng!, 0) / mapped.length]
    : [13.7563, 100.5018]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="page-head">
        <div>
          <h1>Building Map</h1>
          <p className="page-sub">ตำแหน่งอาคารทั้งหมด — คลิก marker เพื่อดูรายละเอียด</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <select
            className="dl-filter-select"
            value={siteFilter}
            onChange={e => setSiteFilter(e.target.value)}
          >
            <option value="all">ทุก Site</option>
            {sites.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <button
            className={tile === 'satellite' ? 'btn-primary' : 'btn-ghost'}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            onClick={() => setTile(t => t === 'osm' ? 'satellite' : 'osm')}
          >
            <Layers size={14} />
            {tile === 'osm' ? 'Satellite' : 'Street Map'}
          </button>
        </div>
      </div>

      <div className="canvas-wrap" style={{ flex: 1, minHeight: 0, position: 'relative' }}>
        {isPending && (
          <div className="dl-empty" style={{ padding: 40 }}>กำลังโหลด...</div>
        )}
        {isError && (
          <div className="dl-empty" style={{ padding: 40, color: 'var(--alert)' }}>โหลดข้อมูลไม่สำเร็จ — กรุณารีเฟรช</div>
        )}
        {!isPending && !isError && (
          <>
            <MapContainer
              center={center}
              zoom={mapped.length > 1 ? 10 : 13}
              style={{ height: unmapped.length > 0 ? 'calc(100% - 140px)' : '100%', width: '100%' }}
              scrollWheelZoom
            >
              <TileLayer url={TILES[tile].url} attribution={TILES[tile].attribution} />
              {mapped.map(b => (
                <Marker key={b.Building_ID} position={[b.lat!, b.lng!]} icon={buildingIcon(b.alert_count)}>
                  <Popup>
                    <div style={{ minWidth: 180 }}>
                      <div style={{ fontWeight: 700, marginBottom: 4 }}>{b.name}</div>
                      <div style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>Site: {b.Site_ID}</div>
                      <div style={{ fontSize: 12, display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <span>{b.floor_count} floors · {b.camera_count} cameras · {b.nvr_count} NVRs</span>
                        {b.alert_count > 0 && (
                          <span style={{ color: '#dc2626', fontWeight: 600 }}>⚠ {b.alert_count} active alerts</span>
                        )}
                      </div>
                      <button
                        style={{ marginTop: 10, padding: '4px 12px', background: '#8B44AA', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}
                        onClick={() => navigate(`/dashboard/buildings/${b.Building_ID}`)}
                      >
                        View Building →
                      </button>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>

            {unmapped.length > 0 && (
              <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)' }}>
                <div style={{ fontSize: 11, color: 'var(--ink-3)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Building2 size={12} />
                  {unmapped.length} อาคารยังไม่มีพิกัด GPS
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {unmapped.map(b => (
                    <button
                      key={b.Building_ID}
                      className="btn-ghost"
                      style={{ fontSize: 12, padding: '4px 12px' }}
                      onClick={() => navigate(`/dashboard/buildings/${b.Building_ID}`)}
                    >
                      {b.name}
                      {b.alert_count > 0 && <span style={{ color: 'var(--alert)', marginLeft: 6 }}>●</span>}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
