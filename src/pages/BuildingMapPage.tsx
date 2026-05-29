import 'leaflet/dist/leaflet.css'
import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet'
import { Spin, Alert } from 'antd'
import { AlertTriangle } from 'lucide-react'
import { getBuildings, getSites } from '../api/hierarchy'
import type { BuildingApi } from '../api/types'

function markerColor(b: BuildingApi): string {
  if (b.alert_count === 0) return '#16a34a'
  return '#dc2626'
}

function markerBorder(b: BuildingApi): string {
  if (b.alert_count === 0) return '#15803d'
  return '#b91c1c'
}

export default function BuildingMapPage() {
  const navigate = useNavigate()
  const [siteFilter, setSiteFilter] = useState('all')

  const { data: buildings, isPending: bPending, isError: bError } = useQuery({
    queryKey: ['buildings'],
    queryFn: getBuildings,
  })

  const { data: sites } = useQuery({
    queryKey: ['sites'],
    queryFn: getSites,
  })

  const siteNames = useMemo(() => {
    const map: Record<string, string> = {}
    sites?.forEach(s => { map[s.Site_ID] = s.name })
    return map
  }, [sites])

  const filtered = useMemo(() => {
    if (!buildings) return []
    return siteFilter === 'all' ? buildings : buildings.filter(b => b.Site_ID === siteFilter)
  }, [buildings, siteFilter])

  const mapped   = filtered.filter(b => b.lat != null && b.lng != null)
  const unmapped = filtered.filter(b => b.lat == null || b.lng == null)

  const uniqueSites = useMemo(
    () => [...new Set(buildings?.map(b => b.Site_ID) ?? [])],
    [buildings],
  )

  const mapCenter: [number, number] = useMemo(() => {
    if (!mapped.length) return [13.7563, 100.5018]
    const avgLat = mapped.reduce((s, b) => s + b.lat!, 0) / mapped.length
    const avgLng = mapped.reduce((s, b) => s + b.lng!, 0) / mapped.length
    return [avgLat, avgLng]
  }, [mapped])

  if (bPending) return <div className="map-loading"><Spin size="large" /></div>
  if (bError)   return <Alert type="error" message="ไม่สามารถโหลดข้อมูล Buildings ได้" style={{ margin: 24 }} />

  return (
    <div className="map-page">
      <div className="map-header">
        <h2 className="map-title">Building Map</h2>
        <div className="map-filters">
          <button
            className={`map-filter-btn${siteFilter === 'all' ? ' active' : ''}`}
            onClick={() => setSiteFilter('all')}
          >
            All Sites
          </button>
          {uniqueSites.map(sid => (
            <button
              key={sid}
              className={`map-filter-btn${siteFilter === sid ? ' active' : ''}`}
              onClick={() => setSiteFilter(sid)}
            >
              {siteNames[sid] ?? sid}
            </button>
          ))}
        </div>
        <div className="map-legend">
          <span className="map-legend-dot ok" /> Online
          <span className="map-legend-dot alert" /> Alert
        </div>
      </div>

      <div className="map-wrap">
        <MapContainer center={mapCenter} zoom={14} className="map-canvas">
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />
          {mapped.map(b => (
            <CircleMarker
              key={b.Building_ID}
              center={[b.lat!, b.lng!]}
              radius={14}
              pathOptions={{
                color: markerBorder(b),
                fillColor: markerColor(b),
                fillOpacity: 0.88,
                weight: 2,
              }}
              eventHandlers={{ click: () => navigate(`/dashboard/buildings/${b.Building_ID}`) }}
            >
              <Popup className="map-popup">
                <div className="map-popup-name">{b.name}</div>
                <div className="map-popup-site">{siteNames[b.Site_ID] ?? b.Site_ID}</div>
                <div className="map-popup-row">
                  <span>{b.floor_count} ชั้น</span>
                  <span>{b.camera_count} กล้อง</span>
                  <span>{b.nvr_count} NVR</span>
                </div>
                {b.alert_count > 0 && (
                  <div className="map-popup-alert">
                    <AlertTriangle size={12} />
                    {b.alert_count} device แจ้งเตือน
                  </div>
                )}
                <button
                  className="map-popup-link"
                  onClick={() => navigate(`/dashboard/buildings/${b.Building_ID}`)}
                >
                  ดูรายละเอียด →
                </button>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>

      {unmapped.length > 0 && (
        <div className="map-fallback">
          <div className="map-fallback-title">Buildings ที่ยังไม่มีพิกัด ({unmapped.length})</div>
          <div className="map-fallback-list">
            {unmapped.map(b => (
              <button
                key={b.Building_ID}
                className="map-fallback-item"
                onClick={() => navigate(`/dashboard/buildings/${b.Building_ID}`)}
              >
                <span className="map-fallback-name">{b.name}</span>
                <span className="map-fallback-site">{siteNames[b.Site_ID] ?? b.Site_ID}</span>
                {b.alert_count > 0 && (
                  <span className="map-fallback-badge"><AlertTriangle size={11} /> {b.alert_count}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
