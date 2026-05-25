import { Typography } from 'antd'

const { Title } = Typography

export default function DashboardPage() {
  return (
    <div style={{ padding: 32 }}>
      <Title level={2}>Dashboard</Title>
      <p>Hierarchy tree will go here.</p>
    </div>
  )
}
