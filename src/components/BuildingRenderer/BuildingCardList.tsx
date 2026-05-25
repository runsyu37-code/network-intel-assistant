import { Card, Badge, Row, Col } from 'antd'
import type { Building } from './types'

const statusColor: Record<Building['status'], string> = {
  online: '#52c41a',
  warning: '#faad14',
  offline: '#ff4d4f',
}

interface Props {
  buildings: Building[]
  onClick?: (building: Building) => void
}

export default function BuildingCardList({ buildings, onClick }: Props) {
  return (
    <Row gutter={[16, 16]}>
      {buildings.map((b) => (
        <Col key={b.id} xs={24} sm={12} md={8} lg={6}>
          <Card
            hoverable
            onClick={() => onClick?.(b)}
            styles={{ body: { padding: 16 } }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <span style={{ fontWeight: 600 }}>{b.name}</span>
              <Badge color={statusColor[b.status]} />
            </div>
            <div style={{ color: '#666', fontSize: 12, marginTop: 8 }}>
              <div>{b.floorCount} floors</div>
              <div>{b.deviceCount} devices</div>
              {b.alertCount > 0 && (
                <div style={{ color: '#ff4d4f', marginTop: 4 }}>
                  {b.alertCount} alert{b.alertCount > 1 ? 's' : ''}
                </div>
              )}
            </div>
          </Card>
        </Col>
      ))}
    </Row>
  )
}
