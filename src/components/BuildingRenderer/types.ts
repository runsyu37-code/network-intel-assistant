export interface Building {
  id: number
  name: string
  floorCount: number
  deviceCount: number
  alertCount: number
  status: 'online' | 'offline' | 'warning'
}

export type RendererType = 'cards' | 'isometric'

export interface BuildingRendererProps {
  buildings: Building[]
  renderer?: RendererType
  onBuildingClick?: (building: Building) => void
}
