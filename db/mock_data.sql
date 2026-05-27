-- =============================================================================
-- SSM Mock Data — for local development / API testing
-- Run AFTER SSM_schema_v2.sql
-- =============================================================================

USE SSM_DB;
GO

-- -----------------------------------------------------------------------------
-- 1. SITES (2 sites)
-- -----------------------------------------------------------------------------
INSERT INTO sites (Site_ID, name, code, location, description) VALUES
('S001', N'สำนักงานใหญ่', 'HQ', N'กรุงเทพมหานคร', N'อาคารสำนักงานใหญ่'),
('S002', N'สาขาเชียงใหม่', 'CM', N'เชียงใหม่',      N'สำนักงานสาขาภาคเหนือ');
GO

-- -----------------------------------------------------------------------------
-- 2. BUILDINGS (1 per site)
-- -----------------------------------------------------------------------------
INSERT INTO buildings (Building_ID, Site_ID, name, code, floor_count) VALUES
('B001', 'S001', N'อาคาร A',    'BLD-A', 2),
('B002', 'S002', N'อาคารสาขา', 'BLD-B', 2);
GO

-- -----------------------------------------------------------------------------
-- 3. FLOORS (2 per building)
-- -----------------------------------------------------------------------------
INSERT INTO floors (Floor_ID, Site_ID, Building_ID, floor_number, name, [function], has_cctv) VALUES
('F001', 'S001', 'B001', 1, N'ชั้น 1', N'ล็อบบี้ / ทางเข้า',  1),
('F002', 'S001', 'B001', 2, N'ชั้น 2', N'สำนักงาน',            1),
('F003', 'S002', 'B002', 1, N'ชั้น 1', N'ล็อบบี้ / ทางเข้า',  1),
('F004', 'S002', 'B002', 2, N'ชั้น 2', N'สำนักงาน',            0);
GO

-- -----------------------------------------------------------------------------
-- 4. ROOMS (only rooms that contain racks)
-- -----------------------------------------------------------------------------
INSERT INTO rooms (Room_ID, Site_ID, Building_ID, Floor_ID, name, type, has_nvr, has_sw) VALUES
('R001', 'S001', 'B001', 'F001', N'ห้องเซิร์ฟเวอร์',  'server',  1, 1),
('R002', 'S002', 'B002', 'F003', N'ห้องเน็ตเวิร์ก',   'network', 1, 1);
GO

-- -----------------------------------------------------------------------------
-- 5. RACKS (1 per room)
-- -----------------------------------------------------------------------------
INSERT INTO racks (Rack_ID, Site_ID, Building_ID, Floor_ID, Room_ID, name, total_units, units_per_u, brand, model) VALUES
('RK001', 'S001', 'B001', 'F001', 'R001', N'Rack-HQ-01', 42, 3, 'APC',    'AR3100'),
('RK002', 'S002', 'B002', 'F003', 'R002', N'Rack-CM-01', 24, 3, 'Tripp Lite', 'SR24UB');
GO

-- -----------------------------------------------------------------------------
-- 6. POE SWITCHES (1 per rack)
-- -----------------------------------------------------------------------------
INSERT INTO poe_switches (SW_ID, Site_ID, Building_ID, Floor_ID, Room_ID, Rack_ID,
    u_position, u_subposition, u_size,
    device_name, switch_type, brand, model, serial_no, mac_address,
    ip_address, vlan_id, subnet_mask, gateway,
    total_ports, poe_ports, poe_budget_w,
    status, fail_count) VALUES
('SW001', 'S001', 'B001', 'F001', 'R001', 'RK001',
    2, 1, 1,
    N'SW-HQ-01', 'PoE', 'Cisco', 'SG350-28P', 'FCW2345A001', 'A0:B1:C2:D3:E4:F5',
    '192.168.1.10', 10, '255.255.255.0', '192.168.1.1',
    28, 24, 375,
    'online', 0),
('SW002', 'S002', 'B002', 'F003', 'R002', 'RK002',
    2, 1, 1,
    N'SW-CM-01', 'PoE', 'Hikvision', 'DS-3E0528P-E', 'HKV9876B002', 'B1:C2:D3:E4:F5:A0',
    '192.168.2.10', 20, '255.255.255.0', '192.168.2.1',
    24, 24, 370,
    'online', 0);
GO

-- -----------------------------------------------------------------------------
-- 7. NVRS (1 per rack)
-- -----------------------------------------------------------------------------
INSERT INTO nvrs (NVR_ID, Site_ID, Building_ID, Floor_ID, Room_ID, Rack_ID,
    u_position, u_subposition, u_size,
    device_name, brand, model, serial_no, mac_address,
    ip_internet, ip_cctv, vlan_id, subnet_mask, gateway,
    total_channels, active_channels, hdd_total_tb, hdd_used_pct,
    recording_res, retention_days, record_status,
    status, fail_count) VALUES
('NVR001', 'S001', 'B001', 'F001', 'R001', 'RK001',
    4, 1, 2,
    N'NVR-HQ-01', 'Hikvision', 'DS-9616NI-I8', 'HKV1234C001', 'C2:D3:E4:F5:A0:B1',
    '192.168.1.20', '10.10.1.20', 10, '255.255.255.0', '192.168.1.1',
    16, 3, 8.00, 35.50,
    '4K', 30, 'normal',
    'online', 0),
('NVR002', 'S002', 'B002', 'F003', 'R002', 'RK002',
    4, 1, 2,
    N'NVR-CM-01', 'Dahua', 'DHI-NVR4108HS', 'DHW5678D002', 'D3:E4:F5:A0:B1:C2',
    '192.168.2.20', '10.10.2.20', 20, '255.255.255.0', '192.168.2.1',
    8, 1, 4.00, 82.30,
    '1080p', 14, 'warning',
    'warning', 2);
GO

-- -----------------------------------------------------------------------------
-- 8. CAMERAS (3 cameras, linked to floor not room)
-- -----------------------------------------------------------------------------
INSERT INTO cameras (Site_ID, Building_ID, Floor_ID,
    device_name, brand, model, serial_no, mac_address,
    camera_type, resolution, ip_address, vlan_id, subnet_mask, gateway,
    NVR_CH, SW_ID, poe_port_number, NVR_ID, nvr_channel,
    install_location, status, fail_count) VALUES
('S001', 'B001', 'F001',
    N'CAM-HQ-F1-01', 'Hikvision', 'DS-2CD2T47G2', 'CAM001SN', 'E4:F5:A0:B1:C2:D3',
    'Dome', '4MP', '10.10.1.101', 10, '255.255.255.0', '10.10.1.1',
    'NVR001_CH1', 'SW001', 1, 'NVR001', 1,
    N'เพดานทางเข้าหลัก ชั้น 1', 'online', 0),
('S001', 'B001', 'F002',
    N'CAM-HQ-F2-01', 'Hikvision', 'DS-2CD2T47G2', 'CAM002SN', 'F5:A0:B1:C2:D3:E4',
    'Bullet', '4MP', '10.10.1.102', 10, '255.255.255.0', '10.10.1.1',
    'NVR001_CH2', 'SW001', 2, 'NVR001', 2,
    N'โถงสำนักงาน ชั้น 2', 'online', 0),
('S002', 'B002', 'F003',
    N'CAM-CM-F1-01', 'Dahua', 'IPC-HDW2849H', 'CAM003SN', 'A0:B1:C2:D3:E4:F5',
    'Dome', '8MP', '10.10.2.101', 20, '255.255.255.0', '10.10.2.1',
    'NVR002_CH1', 'SW002', 1, 'NVR002', 1,
    N'ทางเข้าสาขาเชียงใหม่', 'offline', 3);
GO

-- -----------------------------------------------------------------------------
-- 9. PING LOGS (sample — last ping per device)
-- -----------------------------------------------------------------------------
INSERT INTO ping_logs (device_type, device_id, ip_address, is_alive, latency_ms) VALUES
('poe_switch', 'SW001',  '192.168.1.10',  1,  1.20),
('poe_switch', 'SW002',  '192.168.2.10',  1,  2.80),
('nvr',        'NVR001', '192.168.1.20',  1,  1.50),
('nvr',        'NVR002', '192.168.2.20',  1,  3.10),
('camera',     '1',      '10.10.1.101',   1,  5.20),
('camera',     '2',      '10.10.1.102',   1,  4.90),
('camera',     '3',      '10.10.2.101',   0,  NULL);
GO

-- -----------------------------------------------------------------------------
-- 10. ALERT LOGS (1 active alert — camera offline)
-- -----------------------------------------------------------------------------
INSERT INTO alert_logs (device_type, device_id, device_name, brand, ip_address,
    site_name, building_name, floor_name,
    poe_switch_name, poe_port,
    alert_type, message, webhook_sent, resolved_at) VALUES
('camera', '3', N'CAM-CM-F1-01', 'Dahua', '10.10.2.101',
    N'สาขาเชียงใหม่', N'อาคารสาขา', N'ชั้น 1',
    N'SW-CM-01', 1,
    'offline', N'Camera offline — ping failed 3 times', 0, NULL);
GO

-- -----------------------------------------------------------------------------
-- Done — ข้อมูลทดสอบ: 2 sites, 2 buildings, 4 floors, 2 rooms,
--        2 racks, 2 switches, 2 NVRs, 3 cameras, 7 ping logs, 1 alert
-- -----------------------------------------------------------------------------
