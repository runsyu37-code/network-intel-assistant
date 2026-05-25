import BuildingCardList from './BuildingCardList'
import BuildingIsometricView from './BuildingIsometricView'
import type { BuildingRendererProps } from './types'

export default function BuildingRenderer({
  buildings,
  renderer = 'cards',
  onBuildingClick,
}: BuildingRendererProps) {
  switch (renderer) {
    case 'isometric':
      return <BuildingIsometricView buildings={buildings} onClick={onBuildingClick} />
    case 'cards':
    default:
      return <BuildingCardList buildings={buildings} onClick={onBuildingClick} />
  }
}

export type { Building, RendererType } from './types'
