import { Activity, AlertCircle, Camera } from 'lucide-react';
import '../styles/SitesPage.css';

interface Building {
  id: string;
  name: string;
  status: 'ok' | 'warn' | 'alert';
  cameraCount: number;
  alertCount: number;
}

const mockBuildings: Building[] = [
  {
    id: '1',
    name: 'Building A — Main Tower',
    status: 'alert',
    cameraCount: 8,
    alertCount: 2,
  },
  {
    id: '2',
    name: 'Building B — Annex',
    status: 'ok',
    cameraCount: 4,
    alertCount: 0,
  },
  {
    id: '3',
    name: 'Building C — Warehouse',
    status: 'ok',
    cameraCount: 6,
    alertCount: 0,
  },
  {
    id: '4',
    name: 'Building D — Security Gate',
    status: 'warn',
    cameraCount: 3,
    alertCount: 1,
  },
];

function getStatusLabel(status: string): string {
  switch (status) {
    case 'ok':
      return 'Online';
    case 'warn':
      return 'Warning';
    case 'alert':
      return 'Offline';
    default:
      return 'Unknown';
  }
}

export default function SitesPage() {
  return (
    <div className="sites-page">
      <header className="sites-header">
        <div className="header-content">
          <h1>All Sites</h1>
          <p className="subtitle">Monitor and manage your facilities</p>
        </div>
        <div className="header-legend">
          <span className="legend-item">
            <span className="legend-dot status-ok"></span>
            <span>Online</span>
          </span>
          <span className="legend-item">
            <span className="legend-dot status-warn"></span>
            <span>Warning</span>
          </span>
          <span className="legend-item">
            <span className="legend-dot status-alert"></span>
            <span>Offline</span>
          </span>
        </div>
      </header>

      <div className="sites-grid-wrapper">
        <div className="sites-grid">
          {mockBuildings.map((building) => (
            <div
              key={building.id}
              className={`building-card building-card--${building.status}`}
            >
              <div className="card-header">
                <div className="status-indicator">
                  <span
                    className={`status-dot status-${building.status}`}
                    title={getStatusLabel(building.status)}
                  ></span>
                </div>
                <h2 className="card-title">{building.name}</h2>
              </div>

              <div className="card-body">
                <p className="card-subtitle">Monitoring system active</p>
              </div>

              <div className="card-footer">
                <div className="card-metric">
                  <Camera size={16} className="metric-icon" />
                  <span className="metric-value">{building.cameraCount}</span>
                  <span className="metric-label">Cameras</span>
                </div>
                <div className="card-divider"></div>
                <div className="card-metric">
                  <AlertCircle size={16} className="metric-icon" />
                  <span className="metric-value">{building.alertCount}</span>
                  <span className="metric-label">Alerts</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
