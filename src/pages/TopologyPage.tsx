export default function TopologyPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="page-head">
        <div>
          <h1>Network Topology</h1>
          <p className="page-sub">Real-time network map — sites, buildings, and device connections</p>
        </div>
      </div>
      <div className="canvas-wrap" style={{ flex: 1 }}>
        <div className="canvas" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ color: 'var(--ink-3)', fontSize: 13 }}>Topology canvas — React Flow coming soon</span>
        </div>
      </div>
    </div>
  )
}
