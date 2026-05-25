import type { Building } from './types'

interface Props {
  buildings: Building[]
  onClick?: (building: Building) => void
}

// Phase 8 — Three.js isometric view goes here
// For now renders nothing so the renderer prop can be wired up safely
export default function BuildingIsometricView(_props: Props) {
  return (
    <div style={{ padding: 32, textAlign: 'center', color: '#999' }}>
      Isometric view — Phase 8
    </div>
  )
}
