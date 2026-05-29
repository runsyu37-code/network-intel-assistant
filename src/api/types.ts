export type DeviceStatus = 'online' | 'offline' | 'warning'

export interface CameraApi {
  id: number
  Site_ID: string
  Building_ID: string
  Floor_ID: string
  device_name: string
  brand: string | null
  model: string | null
  serial_no: string | null
  mac_address: string | null
  camera_type: string | null
  resolution: string | null
  firmware_version: string | null
  ip_address: string | null
  vlan_id: number | null
  NVR_ID: string | null
  nvr_channel: number | null
  install_location: string | null
  status: string | null
  fail_count: number | null
  last_seen: string | null
  notes: string | null
  created_at: string
  updated_at: string
  position_x?: number | null
  position_y?: number | null
}

export interface NvrApi {
  NVR_ID: string
  Site_ID: string
  Building_ID: string
  Floor_ID: string
  Room_ID: string
  Rack_ID: string
  device_name: string
  brand: string | null
  model: string | null
  serial_no: string | null
  mac_address: string | null
  ip_internet: string | null
  ip_cctv: string | null
  total_channels: number | null
  active_channels: number | null
  hdd_total_tb: number | null
  hdd_used_pct: number | null
  recording_res: string | null
  retention_days: number | null
  record_status: string | null
  status: string | null
  fail_count: number | null
  last_seen: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface PoeSwitchApi {
  SW_ID: string
  Site_ID: string
  Building_ID: string
  Floor_ID: string
  Room_ID: string
  Rack_ID: string
  device_name: string
  switch_type: string | null
  brand: string | null
  model: string | null
  serial_no: string | null
  mac_address: string | null
  ip_address: string | null
  total_ports: number | null
  poe_ports: number | null
  poe_budget_w: number | null
  poe_used_w: number | null
  status: string | null
  fail_count: number | null
  last_seen: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface UserApi {
  User_ID: number
  username: string
  display_name: string | null
  role: string
  is_active: boolean
  last_login: string | null
  created_at: string
  updated_at: string
}

export interface LoginResponse {
  token: string
  role: string
  displayName: string
  expiresIn: number
}

export interface FloorTreeDto {
  floorId: string
  buildingId: string
  floorNumber: number
  floorName: string | null
  mainFunction: string | null
  cameraCount: number
  alertCount: number
}

export interface BuildingTreeDto {
  buildingId: string
  siteId: string
  buildingName: string
  buildingCode: string | null
  floorCount: number
  alertCount: number
  cameraCount: number
  nvrCount: number
  floors: FloorTreeDto[]
}

export interface SiteTreeDto {
  siteId: string
  siteName: string
  siteCode: string | null
  location: string | null
  alertCount: number
  totalDevices: number
  buildings: BuildingTreeDto[]
}

export interface DashboardSummaryDto {
  siteId: string
  siteCode: string
  siteName: string
  totalCameras: number
  camerasOnline: number
  camerasOffline: number
  camerasWarning: number
  totalNvrs: number
  nvrsOffline: number
  totalSwitches: number
  switchesOffline: number
  totalBuildings: number
  totalFloors: number
  totalRooms: number
  totalRacks: number
}

export interface DeviceStatusDto {
  id: string
  type: string
  name: string
  status: string
  lastSeen: string | null
  siteId: string
}

export interface PingLogApi {
  id: number
  device_type: string
  device_id: string
  ip_address: string
  is_alive: boolean
  latency_ms: number | null
  pinged_at: string
}

export interface AlertLogApi {
  id: number
  device_type: string | null
  device_id: string | null
  device_name: string | null
  brand: string | null
  ip_address: string | null
  site_name: string | null
  building_name: string | null
  floor_name: string | null
  alert_type: string | null
  message: string
  webhook_sent: boolean
  resolved_at: string | null
  alerted_at: string | null
  updated_at: string
}

export interface RackApi {
  Rack_ID: string
  name: string
  Site_ID: string
  Building_ID: string
  Floor_ID: string
  Room_ID: string
  room_name: string
  site_name: string
  building_name: string
  total_units: number
  used_units: number
  device_count: number
  power_kw: number
  power_budget_kw: number | null
  status: string
}

export interface RackDeviceApi {
  device_id: string
  device_name: string
  device_type: 'nvr' | 'switch'
  model: string | null
  brand: string | null
  status: string
  ip_address: string | null
  rack_unit: number | null
  poe_port_number: number | null
}

export interface RackAlertApi {
  status: string
  device_name: string
  message: string
  alerted_at: string
}

export interface RackDetailApi {
  Rack_ID: string
  name: string
  site_name: string
  building_name: string
  room_name: string
  total_units: number
  used_units: number
  power_kw: number
  power_budget_kw: number | null
  status: string
  devices: RackDeviceApi[]
  alerts: RackAlertApi[]
}
