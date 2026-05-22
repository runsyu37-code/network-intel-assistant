-- =============================================================================
-- SSM Mock Data — สำหรับทดสอบ API ผ่าน Bruno
-- Date   : 2026-05-21
-- วิธีใช้: รันใน SSMS (F5) หลังจากรัน SSM_schema_v2.sql แล้ว
-- =============================================================================

USE SSM_DB;
GO

-- ── 1. Sites ─────────────────────────────────────────────────────────────────
INSERT INTO sites (Site_ID, name, code, location, description) VALUES
('S001', N'สำนักงานใหญ่', 'HQ', N'กรุงเทพมหานคร', N'อาคารสำนักงานหลัก'),
('S002', N'สาขาเหนือ',    'BKK-N', N'นนทบุรี',       N'สาขาภาคเหนือกรุงเทพ');
GO

-- ── 2. Buildings ──────────────────────────────────────────────────────────────
INSERT INTO buildings (Site_ID, Building_ID, name, code, floor_count, description, image_data, note) VALUES
('S001', 'B001', N'อาคาร A', 'BLD-A', 5, N'อาคารหลัก', NULL, NULL),
('S002', 'B002', N'อาคาร B', 'BLD-B', 3, N'อาคารสาขา', NULL, NULL);
GO

-- ── 3. Floors ─────────────────────────────────────────────────────────────────
INSERT INTO floors (Site_ID, Building_ID, Floor_ID, floor_number, name, [function], has_cctv, image_data, note) VALUES
('S001', 'B001', 'F001', 1, N'ชั้น 1', N'Server Room', 1, NULL, NULL),
('S002', 'B002', 'F002', 2, N'ชั้น 2', N'Network Room', 1, NULL, NULL);
GO

-- ── 4. Rooms ──────────────────────────────────────────────────────────────────
INSERT INTO rooms (Site_ID, Building_ID, Floor_ID, Room_ID, name, type, has_nvr, has_sw, image_data, note) VALUES
('S001', 'B001', 'F001', 'R001', N'Server Room 1', 'server',  1, 1, NULL, NULL),
('S002', 'B002', 'F002', 'R002', N'Network Room 2', 'network', 1, 1, NULL, NULL);
GO

-- ── 5. Racks ──────────────────────────────────────────────────────────────────
INSERT INTO racks (Site_ID, Building_ID, Floor_ID, Room_ID, Rack_ID, name, total_units, units_per_u, note) VALUES
('S001', 'B001', 'F001', 'R001', 'RK001', N'Rack A1', 42, 3, NULL),
('S002', 'B002', 'F002', 'R002', 'RK002', N'Rack B1', 42, 3, NULL);
GO

-- ── 6. PoE Switches ──────────────────────────────────────────────────────────
INSERT INTO poe_switches (
    Site_ID, Building_ID, Floor_ID, Room_ID, Rack_ID, SW_ID,
    u_position, u_subposition, device_name, switch_type, brand, model,
    serial_no, mac_address, os_version, vlan_id, ip_address,
    total_ports, poe_ports, poe_budget_w, poe_used_w, uplink_port,
    status, fail_count, notes
) VALUES
('S001','B001','F001','R001','RK001','SW001',
 1, 1, N'Switch-HQ-01', 'PoE', 'Cisco', 'SG350-28P',
 'SN-SW001', 'AA:BB:CC:DD:EE:01', '15.2.7', 10, '192.168.1.1',
 28, 24, 370, 120, N'Gi0/1',
 'online', 0, NULL),
('S002','B002','F002','R002','RK002','SW002',
 1, 1, N'Switch-BKK-01', 'PoE', 'HP', 'JL254A',
 'SN-SW002', 'AA:BB:CC:DD:EE:02', '16.10.0', 20, '192.168.2.1',
 24, 20, 185, 80, N'1/1',
 'online', 0, NULL);
GO

-- ── 7. NVRs ───────────────────────────────────────────────────────────────────
INSERT INTO nvrs (
    Site_ID, Building_ID, Floor_ID, Room_ID, Rack_ID, NVR_ID,
    u_position, u_subposition, u_size, device_name, brand, model,
    serial_no, mac_address, os_version, vlan_id, ip_internet, ip_cctv,
    total_channels, active_channels, hdd_total_tb,
    recording_res, retention_days, record_status,
    status, fail_count, notes
) VALUES
('S001','B001','F001','R001','RK001','NVR001',
 3, 1, 2, N'NVR-HQ-01', 'Hikvision', 'DS-9632NI-I8',
 'SN-NVR001', 'AA:BB:CC:DD:EE:03', 'V4.30.085', 10, '192.168.1.10', '10.10.1.10',
 32, 16, 8.00,
 N'1080P', 30, 'normal',
 'online', 0, NULL),
('S002','B002','F002','R002','RK002','NVR002',
 3, 1, 2, N'NVR-BKK-01', 'Dahua', 'NVR608-64-4KS2',
 'SN-NVR002', 'AA:BB:CC:DD:EE:04', 'V4.001.0000', 20, '192.168.2.10', '10.10.2.10',
 16, 8, 4.00,
 N'4K', 14, 'normal',
 'online', 0, NULL);
GO

-- ── 8. Cameras ────────────────────────────────────────────────────────────────
INSERT INTO cameras (
    Site_ID, Building_ID, Floor_ID,
    NVR_CH, NVR_ID, nvr_channel,
    device_name, brand, model,
    serial_no, mac_address, camera_type, resolution,
    ip_address, vlan_id, SW_ID, poe_port_number,
    status, fail_count, notes
) VALUES
('S001','B001','F001',
 'NVR001_CH1', 'NVR001', 1,
 N'CAM-HQ-01', 'Hikvision', 'DS-2CD2343G2-I',
 'SN-CAM001', 'AA:BB:CC:DD:EE:05', N'Dome', N'4MP',
 '10.10.1.101', 10, 'SW001', 1,
 'online', 0, NULL),
('S001','B001','F001',
 'NVR001_CH2', 'NVR001', 2,
 N'CAM-HQ-02', 'Hikvision', 'DS-2CD2T47G2-L',
 'SN-CAM002', 'AA:BB:CC:DD:EE:06', N'Bullet', N'4MP',
 '10.10.1.102', 10, 'SW001', 2,
 'online', 0, NULL),
('S002','B002','F002',
 'NVR002_CH1', 'NVR002', 1,
 N'CAM-BKK-01', 'Dahua', 'IPC-HDW2831T-AS',
 'SN-CAM003', 'AA:BB:CC:DD:EE:07', N'Dome', N'8MP',
 '10.10.2.101', 20, 'SW002', 1,
 'warning', 1, N'ภาพกระพริบบางครั้ง');
GO

-- =============================================================================
-- ตรวจสอบ
-- =============================================================================
SELECT 'sites'        AS tbl, COUNT(*) AS rows FROM sites
UNION ALL SELECT 'buildings',   COUNT(*) FROM buildings
UNION ALL SELECT 'floors',      COUNT(*) FROM floors
UNION ALL SELECT 'rooms',       COUNT(*) FROM rooms
UNION ALL SELECT 'racks',       COUNT(*) FROM racks
UNION ALL SELECT 'poe_switches',COUNT(*) FROM poe_switches
UNION ALL SELECT 'nvrs',        COUNT(*) FROM nvrs
UNION ALL SELECT 'cameras',     COUNT(*) FROM cameras;
GO
