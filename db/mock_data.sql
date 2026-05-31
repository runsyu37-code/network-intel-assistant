-- =============================================================================
-- SSM Mock Data — local development / frontend testing
-- Run AFTER SSM_schema_v2.sql
-- To clean: run TRUNCATE script in db/MOCK_DATA_GUIDE.md before re-running this
-- =============================================================================

USE SSM_DB;
GO

-- -----------------------------------------------------------------------------
-- 1. SITES
-- -----------------------------------------------------------------------------
INSERT INTO sites (Site_ID, name, code, location, description, topology_x, topology_y) VALUES
('S001', N'สำนักงานใหญ่', 'HQ', N'กรุงเทพมหานคร', N'อาคารสำนักงานใหญ่', 400, 250);
GO

-- -----------------------------------------------------------------------------
-- 2. BUILDINGS (4 อาคาร — พิกัด mock ย่านกรุงเทพกลาง)
-- -----------------------------------------------------------------------------
INSERT INTO buildings (Building_ID, Site_ID, name, code, floor_count, lat, lng) VALUES
('B001', 'S001', N'อาคาร A',    'BLD-A',  4, 13.7510, 100.5612),
('B002', 'S001', N'อาคารสาขา', 'BLD-SB', 2, 13.7510, 100.5620),
('B003', 'S001', N'อาคาร B',   'BLD-B',  3, 13.7500, 100.5616),
('B004', 'S001', N'อาคาร B',   'BLD-B2', 2, 13.7500, 100.5608);
GO

-- -----------------------------------------------------------------------------
-- 3. FLOORS
-- B001=4ชั้น | B002=2ชั้น | B003=3ชั้น | B004=2ชั้น
-- Floor_ID ใช้ format <building-prefix>-f<number> ตาม frontend floor plan naming
-- -----------------------------------------------------------------------------
INSERT INTO floors (Floor_ID, Site_ID, Building_ID, floor_number, name, [function], has_cctv) VALUES
-- B001 อาคาร A
('a-f1',  'S001', 'B001', 1, N'ชั้น 1', N'ล็อบบี้ / ทางเข้าหลัก', 1),
('a-f2',  'S001', 'B001', 2, N'ชั้น 2', N'สำนักงาน',               1),
('a-f3',  'S001', 'B001', 3, N'ชั้น 3', N'ห้องประชุม',             1),
('a-f4',  'S001', 'B001', 4, N'ชั้น 4', N'ห้องเซิร์ฟเวอร์',       1),
-- B002 อาคารสาขา
('sb-f1', 'S001', 'B002', 1, N'ชั้น 1', N'ล็อบบี้ / บริการลูกค้า',1),
('sb-f2', 'S001', 'B002', 2, N'ชั้น 2', N'สำนักงาน',               1),
-- B003 อาคาร B
('b-f1',  'S001', 'B003', 1, N'ชั้น 1', N'ล็อบบี้',                1),
('b-f2',  'S001', 'B003', 2, N'ชั้น 2', N'สำนักงาน',               1),
('b-f3',  'S001', 'B003', 3, N'ชั้น 3', N'ห้องประชุม',             0),
-- B004 อาคาร B (ส่วนขยาย)
('b2-f1', 'S001', 'B004', 1, N'ชั้น 1', N'โกดัง / คลังสินค้า',    1),
('b2-f2', 'S001', 'B004', 2, N'ชั้น 2', N'สำนักงาน',               0);
GO

-- -----------------------------------------------------------------------------
-- 4. ROOMS (ห้องเซิร์ฟเวอร์ 1 ห้องต่ออาคาร — เก็บ rack/switch/nvr)
-- -----------------------------------------------------------------------------
INSERT INTO rooms (Room_ID, Site_ID, Building_ID, Floor_ID, name, type, has_nvr, has_sw) VALUES
('RM-A',  'S001', 'B001', 'a-f4',  N'ห้องเซิร์ฟเวอร์ A',  'server',  1, 1),
('RM-SB', 'S001', 'B002', 'sb-f2', N'ห้องเน็ตเวิร์ก SB',  'network', 1, 1),
('RM-B',  'S001', 'B003', 'b-f1',  N'ห้องเซิร์ฟเวอร์ B',  'server',  1, 1),
('RM-B2', 'S001', 'B004', 'b2-f1', N'ห้องเน็ตเวิร์ก B2',  'network', 1, 1);
GO

-- -----------------------------------------------------------------------------
-- 5. RACKS (1 ต่ออาคาร)
-- -----------------------------------------------------------------------------
INSERT INTO racks (Rack_ID, Site_ID, Building_ID, Floor_ID, Room_ID, name, total_units, units_per_u, brand, model) VALUES
('RK-A',  'S001', 'B001', 'a-f4',  'RM-A',  N'Rack-A-01',  42, 3, 'APC',        'AR3100'),
('RK-SB', 'S001', 'B002', 'sb-f2', 'RM-SB', N'Rack-SB-01', 24, 3, 'Tripp Lite', 'SR24UB'),
('RK-B',  'S001', 'B003', 'b-f1',  'RM-B',  N'Rack-B-01',  42, 3, 'APC',        'AR3100'),
('RK-B2', 'S001', 'B004', 'b2-f1', 'RM-B2', N'Rack-B2-01', 24, 3, 'Tripp Lite', 'SR24UB');
GO

-- -----------------------------------------------------------------------------
-- 6. POE SWITCHES (1 ต่ออาคาร)
-- VLAN: B001=10, B002=20, B003=30, B004=40
-- -----------------------------------------------------------------------------
INSERT INTO poe_switches (SW_ID, Site_ID, Building_ID, Floor_ID, Room_ID, Rack_ID,
    u_position, u_subposition, u_size,
    device_name, switch_type, brand, model, serial_no, mac_address,
    ip_address, vlan_id, subnet_mask, gateway,
    total_ports, poe_ports, poe_budget_w,
    status, fail_count) VALUES
('SW-A',  'S001','B001','a-f4', 'RM-A', 'RK-A',  2,1,1,
    N'SW-A-01',  'PoE','Cisco',    'SG350-28P',    'FCW2345A001','A0:B1:C2:D3:E4:01',
    '192.168.10.10',10,'255.255.255.0','192.168.10.1', 28,24,375, 'online',0),
('SW-SB', 'S001','B002','sb-f2','RM-SB','RK-SB', 2,1,1,
    N'SW-SB-01', 'PoE','Cisco',    'SG350-28P',    'FCW2345B002','A0:B1:C2:D3:E4:02',
    '192.168.20.10',20,'255.255.255.0','192.168.20.1',28,24,375, 'online',0),
('SW-B',  'S001','B003','b-f1', 'RM-B', 'RK-B',  2,1,1,
    N'SW-B-01',  'PoE','Hikvision','DS-3E0528P-E', 'HKV9876C003','A0:B1:C2:D3:E4:03',
    '192.168.30.10',30,'255.255.255.0','192.168.30.1',28,24,370, 'online',0),
('SW-B2', 'S001','B004','b2-f1','RM-B2','RK-B2', 2,1,1,
    N'SW-B2-01', 'PoE','Hikvision','DS-3E0528P-E', 'HKV9876D004','A0:B1:C2:D3:E4:04',
    '192.168.40.10',40,'255.255.255.0','192.168.40.1',28,24,370, 'warning',1);
GO

-- -----------------------------------------------------------------------------
-- 7. NVRS (1 ต่ออาคาร)
-- -----------------------------------------------------------------------------
INSERT INTO nvrs (NVR_ID, Site_ID, Building_ID, Floor_ID, Room_ID, Rack_ID,
    u_position, u_subposition, u_size,
    device_name, brand, model, serial_no, mac_address,
    ip_internet, ip_cctv, vlan_id, subnet_mask, gateway,
    total_channels, active_channels, hdd_total_tb, hdd_used_pct,
    recording_res, retention_days, record_status,
    status, fail_count) VALUES
('NVR-A',  'S001','B001','a-f4', 'RM-A', 'RK-A',  4,1,2,
    N'NVR-A-01',  'Hikvision','DS-9616NI-I8', 'HKV1234A001','C2:D3:E4:F5:01:01',
    '192.168.10.20','10.10.10.20',10,'255.255.255.0','192.168.10.1',
    16,5, 8.00,42.00, '4K',   30,'normal', 'online',0),
('NVR-SB', 'S001','B002','sb-f2','RM-SB','RK-SB', 4,1,2,
    N'NVR-SB-01', 'Hikvision','DS-9616NI-I8', 'HKV1234B002','C2:D3:E4:F5:02:02',
    '192.168.20.20','10.10.20.20',20,'255.255.255.0','192.168.20.1',
    16,3, 4.00,18.00, '1080p',30,'normal', 'online',0),
('NVR-B',  'S001','B003','b-f1', 'RM-B', 'RK-B',  4,1,2,
    N'NVR-B-01',  'Dahua',    'DHI-NVR4116HS','DHW5678C003','C2:D3:E4:F5:03:03',
    '192.168.30.20','10.10.30.20',30,'255.255.255.0','192.168.30.1',
    16,4, 8.00,67.50, '4K',   14,'normal', 'online',0),
('NVR-B2', 'S001','B004','b2-f1','RM-B2','RK-B2', 4,1,2,
    N'NVR-B2-01', 'Dahua',    'DHI-NVR4108HS','DHW5678D004','C2:D3:E4:F5:04:04',
    '192.168.40.20','10.10.40.20',40,'255.255.255.0','192.168.40.1',
    8, 2, 4.00,88.00, '1080p',14,'warning','warning',3);
GO

-- -----------------------------------------------------------------------------
-- 8. CAMERAS (12 ตัว — กระจายทุกชั้น)
-- position_x/y: % บน floor plan (0=ซ้ายบน, 100=ขวาล่าง)
-- status: online=ปกติ, offline=ดับ, warning=สัญญาณไม่ดี
-- -----------------------------------------------------------------------------
INSERT INTO cameras (Site_ID, Building_ID, Floor_ID,
    device_name, brand, model, serial_no, mac_address,
    camera_type, resolution, ip_address, vlan_id, subnet_mask, gateway,
    NVR_CH, SW_ID, poe_port_number, NVR_ID, nvr_channel,
    install_location, status, fail_count, position_x, position_y) VALUES
-- B001 อาคาร A — 5 ตัว (NVR-A CH1–CH5)
('S001','B001','a-f1', N'CAM-A-F1-01','Hikvision','DS-2CD2T47G2','SN-A101','E4:F5:01:01:01:01',
 'Dome',  '4MP','10.10.10.101',10,'255.255.255.0','10.10.10.1','NVR-A','SW-A',1,'NVR-A',1,
 N'เพดานทางเข้าหลัก',    'online', 0, 20.0, 15.0),
('S001','B001','a-f1', N'CAM-A-F1-02','Hikvision','DS-2CD2T47G2','SN-A102','E4:F5:01:01:01:02',
 'Bullet','4MP','10.10.10.102',10,'255.255.255.0','10.10.10.1','NVR-A','SW-A',2,'NVR-A',2,
 N'มุมจอดรถ ชั้น 1',      'online', 0, 75.0, 80.0),
('S001','B001','a-f2', N'CAM-A-F2-01','Hikvision','DS-2CD2T47G2','SN-A201','E4:F5:01:02:01:01',
 'Dome',  '4MP','10.10.10.103',10,'255.255.255.0','10.10.10.1','NVR-A','SW-A',3,'NVR-A',3,
 N'โถงสำนักงาน ชั้น 2',   'online', 0, 50.0, 30.0),
('S001','B001','a-f3', N'CAM-A-F3-01','Hikvision','DS-2CD2T47G2','SN-A301','E4:F5:01:03:01:01',
 'Dome',  '4MP','10.10.10.104',10,'255.255.255.0','10.10.10.1','NVR-A','SW-A',4,'NVR-A',4,
 N'หน้าห้องประชุม ชั้น 3', 'online', 0, 30.0, 50.0),
('S001','B001','a-f4', N'CAM-A-F4-01','Hikvision','DS-2CD2T47G2','SN-A401','E4:F5:01:04:01:01',
 'Dome',  '4MP','10.10.10.105',10,'255.255.255.0','10.10.10.1','NVR-A','SW-A',5,'NVR-A',5,
 N'หน้าห้องเซิร์ฟเวอร์',  'online', 0, 60.0, 20.0),
-- B002 อาคารสาขา — 2 ตัว (NVR-SB CH1–CH2)
('S001','B002','sb-f1',N'CAM-SB-F1-01','Dahua','IPC-HDW2849H','SN-SB101','E4:F5:02:01:01:01',
 'Dome',  '8MP','10.10.20.101',20,'255.255.255.0','10.10.20.1','NVR-SB','SW-SB',1,'NVR-SB',1,
 N'ทางเข้าอาคารสาขา',     'online', 0, 25.0, 20.0),
('S001','B002','sb-f2',N'CAM-SB-F2-01','Dahua','IPC-HDW2849H','SN-SB201','E4:F5:02:02:01:01',
 'Bullet','8MP','10.10.20.102',20,'255.255.255.0','10.10.20.1','NVR-SB','SW-SB',2,'NVR-SB',2,
 N'โถงสำนักงานสาขา',      'warning',1, 65.0, 55.0),
-- B003 อาคาร B — 3 ตัว (NVR-B CH1–CH3)
('S001','B003','b-f1', N'CAM-B-F1-01','Dahua','IPC-HDW2849H','SN-B101','E4:F5:03:01:01:01',
 'Dome',  '8MP','10.10.30.101',30,'255.255.255.0','10.10.30.1','NVR-B','SW-B',1,'NVR-B',1,
 N'ล็อบบี้อาคาร B',       'online', 0, 40.0, 25.0),
('S001','B003','b-f2', N'CAM-B-F2-01','Dahua','IPC-HDW2849H','SN-B201','E4:F5:03:02:01:01',
 'Dome',  '8MP','10.10.30.102',30,'255.255.255.0','10.10.30.1','NVR-B','SW-B',2,'NVR-B',2,
 N'สำนักงานชั้น 2',       'online', 0, 55.0, 45.0),
('S001','B003','b-f2', N'CAM-B-F2-02','Dahua','IPC-HDW2849H','SN-B202','E4:F5:03:02:01:02',
 'Bullet','8MP','10.10.30.103',30,'255.255.255.0','10.10.30.1','NVR-B','SW-B',3,'NVR-B',3,
 N'ระเบียงชั้น 2',         'offline',4, 85.0, 70.0),
-- B004 อาคาร B2 — 2 ตัว (NVR-B2 CH1–CH2)
('S001','B004','b2-f1',N'CAM-B2-F1-01','Hikvision','DS-2CD2T47G2','SN-B2101','E4:F5:04:01:01:01',
 'Bullet','4MP','10.10.40.101',40,'255.255.255.0','10.10.40.1','NVR-B2','SW-B2',1,'NVR-B2',1,
 N'ทางเข้าโกดัง',          'online', 0, 15.0, 60.0),
('S001','B004','b2-f2',N'CAM-B2-F2-01','Hikvision','DS-2CD2T47G2','SN-B2201','E4:F5:04:02:01:01',
 'Dome',  '4MP','10.10.40.102',40,'255.255.255.0','10.10.40.1','NVR-B2','SW-B2',2,'NVR-B2',2,
 N'สำนักงานชั้น 2 B2',     'offline',5, 70.0, 35.0);
GO

-- -----------------------------------------------------------------------------
-- 9. PING LOGS (ping ล่าสุดต่ออุปกรณ์)
-- -----------------------------------------------------------------------------
INSERT INTO ping_logs (device_type, device_id, ip_address, is_alive, latency_ms) VALUES
('poe_switch','SW-A',  '192.168.10.10', 1, 1.2),
('poe_switch','SW-SB', '192.168.20.10', 1, 2.1),
('poe_switch','SW-B',  '192.168.30.10', 1, 1.8),
('poe_switch','SW-B2', '192.168.40.10', 1, 3.5),
('nvr',       'NVR-A', '192.168.10.20', 1, 1.5),
('nvr',       'NVR-SB','192.168.20.20', 1, 2.3),
('nvr',       'NVR-B', '192.168.30.20', 1, 1.9),
('nvr',       'NVR-B2','192.168.40.20', 1, 4.2),
('camera',    '1',     '10.10.10.101',  1, 5.2),
('camera',    '2',     '10.10.10.102',  1, 4.9),
('camera',    '7',     '10.10.20.101',  1, 6.1),
('camera',    '10',    '10.10.30.101',  1, 5.8);
GO

-- -----------------------------------------------------------------------------
-- 10. ALERT LOGS
-- -----------------------------------------------------------------------------
INSERT INTO alert_logs (device_type, device_id, device_name, brand, ip_address,
    site_name, building_name, floor_name,
    poe_switch_name, poe_port,
    alert_type, message, webhook_sent, resolved_at) VALUES
('camera','10', N'CAM-B-F2-02',  'Dahua',    '10.10.30.103',
    N'สำนักงานใหญ่', N'อาคาร B',    N'ชั้น 2',
    N'SW-B-01',  3, 'offline', N'Camera offline — ping failed 4 times', 0, NULL),
('camera','12', N'CAM-B2-F2-01', 'Hikvision','10.10.40.102',
    N'สำนักงานใหญ่', N'อาคาร B',    N'ชั้น 2',
    N'SW-B2-01', 2, 'offline', N'Camera offline — ping failed 5 times', 0, NULL),
('nvr',   'NVR-B2',N'NVR-B2-01', 'Dahua',    '192.168.40.20',
    N'สำนักงานใหญ่', N'อาคาร B',    N'ชั้น 1',
    NULL, NULL,    'hdd_warning', N'HDD usage 88% — retention at risk',  0, NULL);
GO

-- -----------------------------------------------------------------------------
-- Done
-- 1 site | 4 buildings | 11 floors | 4 rooms | 4 racks
-- 4 switches | 4 NVRs | 12 cameras | 12 ping logs | 3 alert logs
-- online=9 cameras | warning=1 | offline=2
-- -----------------------------------------------------------------------------
