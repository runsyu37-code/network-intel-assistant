import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Building2, Layers, MapPin, X, List, Map as MapIcon, Save, Navigation, RotateCcw, Plus } from 'lucide-react'
import { getBuildings, patchBuildingCoordinates, createBuilding } from '../api/hierarchy'
import { useAuthStore } from '../stores/authStore'
import type { BuildingApi } from '../api/types'

type TileMode = 'osm' | 'satellite'
type ViewMode = 'map' | 'list'

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

const VIEWPORT_KEY = 'ssm.map.viewports'

function loadViewport(siteId: string): { lat: number; lng: number; zoom: number } | null {
  try {
    const all = JSON.parse(localStorage.getItem(VIEWPORT_KEY) ?? '{}')
    return all[siteId] ?? null
  } catch { return null }
}

function persistViewport(siteId: string, lat: number, lng: number, zoom: number) {
  try {
    const all = JSON.parse(localStorage.getItem(VIEWPORT_KEY) ?? '{}')
    all[siteId] = { lat, lng, zoom }
    localStorage.setItem(VIEWPORT_KEY, JSON.stringify(all))
  } catch {}
}

function parseCoords(input: string): [number, number] | null {
  const parts = input.trim().split(/[\s,]+/).filter(Boolean)
  if (parts.length < 2) return null
  const lat = parseFloat(parts[0])
  const lng = parseFloat(parts[1])
  if (isNaN(lat) || isNaN(lng)) return null
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null
  return [lat, lng]
}

function buildingIcon(alertCount: number): L.DivIcon {
  const color = alertCount > 0 ? 'var(--alert)' : 'var(--ok)'
  return L.divIcon({
    className: '',
    html: `<div style="width:18px;height:18px;border-radius:50%;background:${color};border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,.35)"></div>`,
    iconSize: [18, 18], iconAnchor: [9, 9], popupAnchor: [0, -12],
  })
}

function newBuildingIcon(): L.DivIcon {
  return L.divIcon({
    className: '',
    html: `<div style="width:22px;height:22px;border-radius:50%;background:var(--accent);border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;color:#fff;line-height:1">+</div>`,
    iconSize: [22, 22], iconAnchor: [11, 11], popupAnchor: [0, -14],
  })
}

function PlacementHandler({ onPlace }: { onPlace: (lat: number, lng: number) => void }) {
  useMapEvents({ click(e) { onPlace(e.latlng.lat, e.latlng.lng) } })
  return null
}

function MapControllerInner({ onReady }: { onReady: (map: L.Map) => void }) {
  const map = useMap()
  useEffect(() => { onReady(map) }, [map, onReady])
  return null
}

interface CreateForm { name: string; siteId: string }
const EMPTY_CREATE: CreateForm = { name: '', siteId: '' }

function genBuildingId(): string {
  return `B${Date.now().toString(36).slice(-6).toUpperCase()}`
}

export default function BuildingMapPage() {
  const navigate        = useNavigate()
  const qc              = useQueryClient()
  const isAdmin         = useAuthStore(s => s.isAdmin())
  const [searchParams]  = useSearchParams()

  const [tile, setTile]             = useState<TileMode>('satellite')
  const [viewMode, setView]         = useState<ViewMode>('map')
  const [siteFilter, setSiteFilter] = useState(searchParams.get('site') ?? 'all')
  const [placing, setPlacing]       = useState<BuildingApi | null>(null)
  const [saving, setSaving]         = useState(false)
  const [coordInput, setCoordInput] = useState('')
  const [coordError, setCoordError] = useState(false)
  const [savedFlash, setSavedFlash] = useState(false)
  const [mapReady, setMapReady]     = useState(false)

  const [createMode, setCreateMode]   = useState(false)
  const [createPos, setCreatePos]     = useState<[number, number] | null>(null)
  const [createForm, setCreateForm]   = useState<CreateForm>(EMPTY_CREATE)
  const [createSaving, setCreateSaving] = useState(false)

  const mapRef = useRef<L.Map | null>(null)

  const handleMapReady = useCallback((map: L.Map) => {
    mapRef.current = map
    setMapReady(true)
  }, [])

  const { data, isPending, isError } = useQuery({
    queryKey: ['buildings-map'],
    queryFn: () => getBuildings(),
  })

  const sites = useMemo(
    () => [...new Set((data ?? []).map(b => b.Site_ID))].sort(),
    [data],
  )

  useEffect(() => {
    if (siteFilter === 'all' && sites.length === 1) setSiteFilter(sites[0])
  }, [sites, siteFilter])

  const filtered = useMemo(
    () => (data ?? []).filter(b => siteFilter === 'all' || b.Site_ID === siteFilter),
    [data, siteFilter],
  )

  const mapped   = filtered.filter(b => b.lat != null && b.lng != null)
  const unmapped = filtered.filter(b => b.lat == null || b.lng == null)

  const computedCenter: [number, number] = mapped.length > 0
    ? [mapped.reduce((s, b) => s + b.lat!, 0) / mapped.length,
       mapped.reduce((s, b) => s + b.lng!, 0) / mapped.length]
    : [13.7563, 100.5018]
  const computedZoom = siteFilter !== 'all' && mapped.length > 0 ? 17 : mapped.length > 1 ? 10 : 13

  useEffect(() => {
    if (!mapReady || isPending) return
    const saved = loadViewport(siteFilter)
    if (saved) {
      mapRef.current?.setView([saved.lat, saved.lng], saved.zoom, { animate: true })
    } else {
      mapRef.current?.setView(computedCenter, computedZoom, { animate: true })
    }
  }, [siteFilter, isPending, mapReady])

  function resetView() {
    const saved = loadViewport(siteFilter)
    if (saved) mapRef.current?.setView([saved.lat, saved.lng], saved.zoom, { animate: true })
    else       mapRef.current?.setView(computedCenter, computedZoom, { animate: true })
  }

  const handlePlace = async (lat: number, lng: number) => {
    if (!placing || saving) return
    setSaving(true)
    try {
      await patchBuildingCoordinates(placing.Building_ID, lat, lng)
      await qc.invalidateQueries({ queryKey: ['buildings-map'] })
      setPlacing(null)
    } finally { setSaving(false) }
  }

  function handleCreateClick(lat: number, lng: number) {
    setCreatePos([lat, lng])
    setCreateForm({ ...EMPTY_CREATE, siteId: siteFilter === 'all' ? '' : siteFilter })
  }

  async function handleCreateSave() {
    if (!createPos || !createForm.name.trim() || !createForm.siteId.trim()) return
    const newId = genBuildingId()
    setCreateSaving(true)
    try {
      await createBuilding({ Building_ID: newId, Site_ID: createForm.siteId.trim(), name: createForm.name.trim() })
      await patchBuildingCoordinates(newId, createPos[0], createPos[1])
      await qc.invalidateQueries({ queryKey: ['buildings-map'] })
      setCreatePos(null)
      setCreateMode(false)
    } catch { /* error handled silently — user sees no update */ }
    finally { setCreateSaving(false) }
  }

  function handleGoToCoords() {
    const coords = parseCoords(coordInput)
    if (!coords) { setCoordError(true); setTimeout(() => setCoordError(false), 1500); return }
    mapRef.current?.flyTo(coords, 17, { duration: 1.2 })
    setCoordError(false)
  }

  function handleSaveView() {
    if (!mapRef.current) return
    const c = mapRef.current.getCenter()
    persistViewport(siteFilter, c.lat, c.lng, mapRef.current.getZoom())
    setSavedFlash(true)
    setTimeout(() => setSavedFlash(false), 2000)
  }

  const hasSavedView = loadViewport(siteFilter) !== null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="page-head">
        <div>
          <h1>Building Map</h1>
          <p className="page-sub">ตำแหน่งอาคารทั้งหมด — คลิก marker เพื่อดูรายละเอียด</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <select className="dl-filter-select" value={siteFilter} onChange={e => setSiteFilter(e.target.value)}>
            <option value="all">ทุก Site</option>
            {sites.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <div className="bldg-view-toggle">
            <button className={viewMode === 'map'  ? 'on' : ''} onClick={() => setView('map')}>
              <MapIcon size={13} /> Map
            </button>
            <button className={viewMode === 'list' ? 'on' : ''} onClick={() => setView('list')}>
              <List size={13} /> List
            </button>
          </div>
          {viewMode === 'map' && (
            <button
              className={tile === 'satellite' ? 'btn-primary' : 'btn-ghost'}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
              onClick={() => setTile(t => t === 'osm' ? 'satellite' : 'osm')}
            >
              <Layers size={14} />
              {tile === 'satellite' ? 'Street Map' : 'Satellite'}
            </button>
          )}
          {isAdmin && viewMode === 'map' && (
            <button
              className={createMode ? 'btn-primary' : 'btn-ghost'}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
              onClick={() => { setCreateMode(m => !m); setPlacing(null) }}
            >
              <Plus size={14} /> เพิ่มตึก
            </button>
          )}
        </div>
      </div>

      {/* Coordinate toolbar */}
      {viewMode === 'map' && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '7px 20px',
          background: 'var(--surface-2)',
          borderBottom: '1px solid var(--border)',
          fontSize: 12.5, flexWrap: 'wrap',
        }}>
          <Navigation size={13} style={{ color: 'var(--ink-3)', flex: 'none' }} />
          <span style={{ color: 'var(--ink-3)', fontWeight: 500, whiteSpace: 'nowrap' }}>ป้อนพิกัด:</span>
          <input
            value={coordInput}
            onChange={e => setCoordInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleGoToCoords()}
            placeholder="13.7563, 100.5018"
            style={{
              width: 185, padding: '4px 10px',
              border: `1px solid ${coordError ? 'var(--alert)' : 'var(--border)'}`,
              borderRadius: 6, background: 'var(--surface)',
              color: 'var(--ink)', fontSize: 12.5,
              fontFamily: 'JetBrains Mono, monospace',
            }}
          />
          <button className="btn-ghost" style={{ padding: '4px 12px', fontSize: 12 }} onClick={handleGoToCoords}>Go</button>
          {coordError && <span style={{ color: 'var(--alert)', fontSize: 12 }}>พิกัดไม่ถูกต้อง</span>}

          <button
            className="icon-btn"
            title="ย้อนกลับมุมมองที่บันทึกไว้"
            onClick={resetView}
            style={{ marginLeft: 4 }}
          >
            <RotateCcw size={14} />
          </button>

          {isAdmin && (
            <>
              <div style={{ width: 1, height: 18, background: 'var(--border)', margin: '0 2px', flex: 'none' }} />
              <button
                className="btn-ghost"
                style={{ padding: '4px 12px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}
                onClick={handleSaveView}
                title="บันทึกมุมมองปัจจุบัน"
              >
                <Save size={13} /> Save View
              </button>
              {savedFlash && <span style={{ color: 'var(--ok)', fontWeight: 600, fontSize: 12 }}>✓ บันทึกแล้ว</span>}
            </>
          )}

          {hasSavedView && !savedFlash && (
            <span style={{ marginLeft: 'auto', color: 'var(--ink-4)', fontSize: 11 }}>● มุมมองบันทึกไว้แล้ว</span>
          )}
        </div>
      )}

      {/* Create mode banner */}
      {createMode && !createPos && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '10px 20px',
          background: 'var(--accent)', color: '#fff', fontSize: 13,
        }}>
          <Plus size={15} />
          <span>โหมดเพิ่มตึก — คลิกบนแผนที่เพื่อวางตำแหน่งอาคารใหม่</span>
          <button
            onClick={() => setCreateMode(false)}
            style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
          >
            <X size={14} /> ยกเลิก
          </button>
        </div>
      )}

      {/* Placing banner */}
      {placing && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '10px 20px',
          background: 'var(--primary)', color: '#fff', fontSize: 13,
        }}>
          <MapPin size={15} />
          <span>คลิกบนแผนที่เพื่อวางพิกัด <strong>{placing.name}</strong></span>
          {saving && <span style={{ opacity: 0.75 }}>กำลังบันทึก...</span>}
          <button
            onClick={() => setPlacing(null)}
            style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
          >
            <X size={14} /> ยกเลิก
          </button>
        </div>
      )}

      {viewMode === 'list' && (
        <div className="dl-table-wrap">
          <table className="dl-table">
            <thead>
              <tr>
                <th>อาคาร</th><th>Site</th><th>ชั้น</th><th>กล้อง</th><th>NVR</th>
                <th>Alerts</th><th>พิกัด GPS</th>
                {isAdmin && <th style={{ width: 60 }}>Pin</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={isAdmin ? 8 : 7} className="dl-empty">ไม่พบอาคาร</td></tr>
              )}
              {filtered.map(b => (
                <tr key={b.Building_ID} onClick={() => navigate(`/dashboard/buildings/${b.Building_ID}`)} style={{ cursor: 'pointer' }}>
                  <td>
                    <div className="td-name">{b.name}</div>
                    {b.code && <div className="td-sub">{b.code}</div>}
                  </td>
                  <td className="td-mono" style={{ fontSize: 12 }}>{b.Site_ID}</td>
                  <td className="td-mono">{b.floor_count}</td>
                  <td className="td-mono">{b.camera_count}</td>
                  <td className="td-mono">{b.nvr_count}</td>
                  <td>
                    {(b.alert_count ?? 0) > 0
                      ? <span className="dl-badge alert">{b.alert_count} alert{b.alert_count! > 1 ? 's' : ''}</span>
                      : <span className="dl-badge ok">OK</span>}
                  </td>
                  <td>
                    {b.lat != null
                      ? <span style={{ fontSize: 11, color: 'var(--ok)', fontFamily: 'JetBrains Mono,monospace' }}>● {b.lat.toFixed(4)}, {b.lng!.toFixed(4)}</span>
                      : <span style={{ fontSize: 11, color: 'var(--ink-4)' }}>—</span>}
                  </td>
                  {isAdmin && (
                    <td onClick={e => e.stopPropagation()}>
                      <button
                        className={placing?.Building_ID === b.Building_ID ? 'btn-primary' : 'btn-ghost'}
                        style={{ fontSize: 11, padding: '3px 8px', display: 'flex', alignItems: 'center', gap: 3 }}
                        onClick={() => { setView('map'); setPlacing(placing?.Building_ID === b.Building_ID ? null : b) }}
                      >
                        <MapPin size={11} /> Pin
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="canvas-wrap" style={{ flex: 1, minHeight: 0, position: 'relative', display: viewMode === 'list' ? 'none' : undefined }}>
        {isPending && <div className="dl-empty" style={{ padding: 40 }}>กำลังโหลด...</div>}
        {isError   && <div className="dl-empty" style={{ padding: 40, color: 'var(--alert)' }}>โหลดข้อมูลไม่สำเร็จ — กรุณารีเฟรช</div>}
        {!isPending && !isError && (
          <>
            <MapContainer
              center={[13.7563, 100.5018]}
              zoom={10}
              style={{
                height: unmapped.length > 0 ? 'calc(100% - 120px)' : '100%',
                width: '100%',
                cursor: (placing || createMode) ? 'crosshair' : undefined,
              }}
              scrollWheelZoom
            >
              <MapControllerInner onReady={handleMapReady} />
              <TileLayer url={TILES[tile].url} attribution={TILES[tile].attribution} />
              {placing && <PlacementHandler onPlace={handlePlace} />}
              {createMode && !placing && <PlacementHandler onPlace={handleCreateClick} />}
              {mapped.map(b => (
                <Marker key={b.Building_ID} position={[b.lat!, b.lng!]} icon={buildingIcon(b.alert_count ?? 0)}>
                  <Popup>
                    <div style={{ minWidth: 180 }}>
                      <div style={{ fontWeight: 700, marginBottom: 4 }}>{b.name}</div>
                      <div style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>Site: {b.Site_ID}</div>
                      <div style={{ fontSize: 12, display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <span>{b.floor_count} floors · {b.camera_count} cameras · {b.nvr_count} NVRs</span>
                        {(b.alert_count ?? 0) > 0 && (
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
              {createPos && (
                <Marker position={createPos} icon={newBuildingIcon()} />
              )}
            </MapContainer>

            {unmapped.length > 0 && (
              <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border)' }}>
                <div style={{ fontSize: 11, color: 'var(--ink-3)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Building2 size={12} />
                  {unmapped.length} อาคารยังไม่มีพิกัด GPS
                  {isAdmin && <span style={{ color: 'var(--primary)' }}>— กด Pin เพื่อวางตำแหน่ง</span>}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {unmapped.map(b => (
                    <div key={b.Building_ID} style={{ display: 'flex', gap: 4 }}>
                      <button className="btn-ghost" style={{ fontSize: 12, padding: '4px 12px' }}
                        onClick={() => navigate(`/dashboard/buildings/${b.Building_ID}`)}>
                        {b.name}
                        {(b.alert_count ?? 0) > 0 && <span style={{ color: 'var(--alert)', marginLeft: 6 }}>●</span>}
                      </button>
                      {isAdmin && (
                        <button
                          className={placing?.Building_ID === b.Building_ID ? 'btn-primary' : 'btn-ghost'}
                          style={{ fontSize: 12, padding: '4px 10px', display: 'flex', alignItems: 'center', gap: 4 }}
                          onClick={() => setPlacing(placing?.Building_ID === b.Building_ID ? null : b)}
                        >
                          <MapPin size={12} /> Pin
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Create building modal */}
      {createPos && (
        <div className="crud-overlay" onClick={() => setCreatePos(null)}>
          <div className="crud-modal" onClick={e => e.stopPropagation()}>
            <div className="crud-modal-hd">
              <h2 className="crud-modal-title">เพิ่มอาคารใหม่</h2>
              <button className="crud-modal-close" onClick={() => setCreatePos(null)}><X size={18} /></button>
            </div>
            <div className="crud-modal-body">
              <div className="form-group">
                <label className="form-label">
                  พิกัด GPS <span style={{ color: 'var(--ok)', fontFamily: 'JetBrains Mono,monospace', fontSize: 12 }}>
                    {createPos[0].toFixed(5)}, {createPos[1].toFixed(5)}
                  </span>
                </label>
              </div>
              <div className="form-group">
                <label className="form-label">ชื่ออาคาร <span style={{ color: 'var(--alert)' }}>*</span></label>
                <input
                  className="form-ctrl"
                  placeholder="e.g. อาคาร A"
                  value={createForm.name}
                  onChange={e => setCreateForm(f => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Site <span style={{ color: 'var(--alert)' }}>*</span></label>
                <select
                  className="form-ctrl"
                  value={createForm.siteId}
                  onChange={e => setCreateForm(f => ({ ...f, siteId: e.target.value }))}
                >
                  <option value="">— เลือก Site —</option>
                  {sites.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div className="crud-modal-ft">
              <button className="btn-ghost" onClick={() => setCreatePos(null)} disabled={createSaving}>ยกเลิก</button>
              <button
                className="btn-primary"
                onClick={handleCreateSave}
                disabled={createSaving || !createForm.name.trim() || !createForm.siteId.trim()}
              >
                {createSaving ? 'กำลังบันทึก...' : 'บันทึก'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
