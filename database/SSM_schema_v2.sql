-- =============================================================================
-- SSM v1.0 — Production Schema (SSM_DB)
-- Date   : 2026-05-21
-- Purpose: Reset ตาราง survey 8 ตารางให้เปล่า + column order ตรงกับ Excel
--          ตาราง auth/log (users, sync_logs, audit_logs, ping_logs, alert_logs)
--          ไม่ถูกแตะ — ข้อมูลและ seed users คงอยู่
--
-- วิธีใช้: เปิดไฟล์นี้ใน SSMS แล้วกด F5
--
-- =============================================================================
-- วิธี Copy-Paste จาก Excel → SSMS (Edit Top 200 Rows)
-- ─────────────────────────────────────────────────────
-- 1. ใน SSMS: คลิกขวาที่ตาราง → Edit Top 200 Rows
-- 2. ใน Excel: เลือก row ข้อมูล (ไม่รวม header) แล้ว Copy
-- 3. ใน SSMS: คลิกที่ row ว่าง column แรก แล้ว Paste
--
-- คอลัมน์ที่ต้องเลือกจาก Excel (ไม่รวม # และ Created/Updated):
--
--   1_Site     → sites         : B–F   (5 cols)
--   2_Building → buildings     : B–I   (8 cols รวม H ที่เป็น Image Path — paste cell ว่างได้)
--   3_Floor    → floors        : B–J   (9 cols รวม I ที่เป็น Image Path — paste cell ว่างได้)
--   4_Room     → rooms         : B–K   (10 cols รวม J ที่เป็น Image Path — paste cell ว่างได้)
--   5_Rack     → racks         : B–J   (9 cols)
--   8_Switch   → poe_switches  : B–Z   (25 cols)
--   7_NVR      → nvrs          : B–AB  (27 cols)
--   6_CCTV     → cameras       : B–R, U–W  (ข้าม col S-T ที่ซ้ำกัน)
-- =============================================================================

USE SSM_DB;
GO

-- =============================================================================
-- STEP 1 : DROP ตาราง survey (reverse FK order)
-- ตาราง auth/log ไม่ถูกแตะ
-- =============================================================================

IF OBJECT_ID('cameras',      'U') IS NOT NULL DROP TABLE cameras;
IF OBJECT_ID('nvrs',         'U') IS NOT NULL DROP TABLE nvrs;
IF OBJECT_ID('poe_switches', 'U') IS NOT NULL DROP TABLE poe_switches;
IF OBJECT_ID('racks',        'U') IS NOT NULL DROP TABLE racks;
IF OBJECT_ID('rooms',        'U') IS NOT NULL DROP TABLE rooms;
IF OBJECT_ID('floors',       'U') IS NOT NULL DROP TABLE floors;
IF OBJECT_ID('buildings',    'U') IS NOT NULL DROP TABLE buildings;
IF OBJECT_ID('sites',        'U') IS NOT NULL DROP TABLE sites;
GO

-- =============================================================================
-- STEP 2 : CREATE ตาราง survey (forward FK order)
-- Column order ตรงกับ template_v4_empty.xlsx
-- =============================================================================

-- Sheet 1_Site — paste cols B–F
CREATE TABLE sites (
    -- ── Excel columns (paste order) ──
    Site_ID       NVARCHAR(10)                          NOT NULL,  -- col B
    name          NVARCHAR(100)                         NOT NULL,  -- col C  Site Name
    code          NVARCHAR(20)                          NULL,      -- col D  Site Code
    location      NVARCHAR(255)                         NULL,      -- col E  Location / Address
    description   NVARCHAR(500)                         NULL,      -- col F  Description
    -- ── Auto-fill (DB only) ──
    created_at    DATETIME2(7) DEFAULT SYSUTCDATETIME() NOT NULL,
    updated_at    DATETIME2(7) DEFAULT SYSUTCDATETIME() NOT NULL,

    CONSTRAINT PK_sites      PRIMARY KEY CLUSTERED (Site_ID),
    CONSTRAINT UQ_sites_code UNIQUE (code)
);
GO

-- Sheet 2_Building — paste cols B–I (8 cols รวม cell ว่างของ Image Path)
CREATE TABLE buildings (
    -- ── Excel columns (paste order) ──
    Site_ID       NVARCHAR(10)                          NOT NULL,  -- col B  Site_ID (FK)
    Building_ID   NVARCHAR(10)                          NOT NULL,  -- col C  Building_ID (PK)
    name          NVARCHAR(100)                         NOT NULL,  -- col D  Building Name
    code          NVARCHAR(20)                          NULL,      -- col E  Building Code
    floor_count   INT          DEFAULT 1                NULL,      -- col F  Floor Count
    description   NVARCHAR(500)                         NULL,      -- col G  Description
    image_data    NVARCHAR(MAX)                         NULL,      -- col H  Image Path (paste cell ว่างได้)
    note          NVARCHAR(500)                         NULL,      -- col I  Note
    -- ── DB only ──
    image_type    NVARCHAR(50)                          NULL,
    created_at    DATETIME2(7) DEFAULT SYSUTCDATETIME() NOT NULL,
    updated_at    DATETIME2(7) DEFAULT SYSUTCDATETIME() NOT NULL,

    CONSTRAINT PK_buildings           PRIMARY KEY CLUSTERED (Building_ID),
    CONSTRAINT FK_buildings_site      FOREIGN KEY (Site_ID) REFERENCES sites(Site_ID)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT UQ_buildings_code_site UNIQUE (Site_ID, code)
);
GO

-- Sheet 3_Floor — paste cols B–J (9 cols รวม cell ว่างของ Image Path)
CREATE TABLE floors (
    -- ── Excel columns (paste order) ──
    Site_ID       NVARCHAR(10)                          NOT NULL,  -- col B  Site_ID (FK)
    Building_ID   NVARCHAR(10)                          NOT NULL,  -- col C  Building_ID (FK)
    Floor_ID      NVARCHAR(10)                          NOT NULL,  -- col D  Floor_ID (PK)
    floor_number  INT                                   NULL,      -- col E  Floor Number
    name          NVARCHAR(50)                          NULL,      -- col F  Floor Name
    [function]    NVARCHAR(100)                         NULL,      -- col G  Main Function
    has_cctv      BIT          DEFAULT 0                NULL,      -- col H  Has CCTV?
    image_data    NVARCHAR(MAX)                         NULL,      -- col I  Image Path (paste cell ว่างได้)
    note          NVARCHAR(500)                         NULL,      -- col J  Note
    -- ── DB only ──
    image_type    NVARCHAR(50)                          NULL,
    created_at    DATETIME2(7) DEFAULT SYSUTCDATETIME() NOT NULL,
    updated_at    DATETIME2(7) DEFAULT SYSUTCDATETIME() NOT NULL,

    CONSTRAINT PK_floors          PRIMARY KEY CLUSTERED (Floor_ID),
    CONSTRAINT FK_floors_site     FOREIGN KEY (Site_ID)     REFERENCES sites(Site_ID),
    CONSTRAINT FK_floors_building FOREIGN KEY (Building_ID) REFERENCES buildings(Building_ID)
        ON DELETE CASCADE ON UPDATE CASCADE
);
GO

-- Sheet 4_Room — paste cols B–K (10 cols รวม cell ว่างของ Image Path)
CREATE TABLE rooms (
    -- ── Excel columns (paste order) ──
    Site_ID       NVARCHAR(10)                          NOT NULL,  -- col B  Site_ID (FK)
    Building_ID   NVARCHAR(10)                          NOT NULL,  -- col C  Building_ID (FK)
    Floor_ID      NVARCHAR(10)                          NOT NULL,  -- col D  Floor_ID (FK)
    Room_ID       NVARCHAR(20)                          NOT NULL,  -- col E  Room_ID (PK)
    name          NVARCHAR(100)                         NOT NULL,  -- col F  Room Name
    type          NVARCHAR(50)                          NULL,      -- col G  Room Type
    has_nvr       BIT          DEFAULT 0                NULL,      -- col H  Has NVR
    has_sw        BIT          DEFAULT 0                NULL,      -- col I  Has SW
    image_data    NVARCHAR(MAX)                         NULL,      -- col J  Image Path (paste cell ว่างได้)
    note          NVARCHAR(500)                         NULL,      -- col K  Note
    -- ── Web-only / DB only ──
    image_type    NVARCHAR(50)                          NULL,
    width_m       DECIMAL(6,2)                          NULL,
    length_m      DECIMAL(6,2)                          NULL,
    x             INT          DEFAULT 0                NULL,
    y             INT          DEFAULT 0                NULL,
    w             INT          DEFAULT 100              NULL,
    h             INT          DEFAULT 100              NULL,
    created_at    DATETIME2(7) DEFAULT SYSUTCDATETIME() NOT NULL,
    updated_at    DATETIME2(7) DEFAULT SYSUTCDATETIME() NOT NULL,

    CONSTRAINT PK_rooms          PRIMARY KEY CLUSTERED (Room_ID),
    CONSTRAINT FK_rooms_site     FOREIGN KEY (Site_ID)     REFERENCES sites(Site_ID),
    CONSTRAINT FK_rooms_building FOREIGN KEY (Building_ID) REFERENCES buildings(Building_ID),
    CONSTRAINT FK_rooms_floor    FOREIGN KEY (Floor_ID)    REFERENCES floors(Floor_ID)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT CHK_rooms_type    CHECK (type IS NULL
                                    OR type IN ('server','network','office','power','other'))
);
GO

-- Sheet 5_Rack — paste cols B–J (9 cols)
CREATE TABLE racks (
    -- ── Excel columns (paste order) ──
    Site_ID       NVARCHAR(10)                          NOT NULL,  -- col B  Site_ID (FK)
    Building_ID   NVARCHAR(10)                          NOT NULL,  -- col C  Building_ID (FK)
    Floor_ID      NVARCHAR(10)                          NOT NULL,  -- col D  Floor_ID (FK)
    Room_ID       NVARCHAR(20)                          NOT NULL,  -- col E  Room_ID (FK)
    Rack_ID       NVARCHAR(20)                          NOT NULL,  -- col F  Rack_ID (PK)
    name          NVARCHAR(50)                          NOT NULL,  -- col G  Rack Name
    total_units   INT          DEFAULT 42               NOT NULL,  -- col H  Total U
    units_per_u   TINYINT      DEFAULT 3                NOT NULL,  -- col I  Units per U (slots)
    note          NVARCHAR(500)                         NULL,      -- col J  Note
    -- ── DB only ──
    brand         NVARCHAR(50)                          NULL,
    model         NVARCHAR(50)                          NULL,
    max_power_w   INT                                   NULL,
    image_data    NVARCHAR(MAX)                         NULL,
    image_type    NVARCHAR(50)                          NULL,
    created_at    DATETIME2(7) DEFAULT SYSUTCDATETIME() NOT NULL,
    updated_at    DATETIME2(7) DEFAULT SYSUTCDATETIME() NOT NULL,

    CONSTRAINT PK_racks              PRIMARY KEY CLUSTERED (Rack_ID),
    CONSTRAINT FK_racks_site         FOREIGN KEY (Site_ID)     REFERENCES sites(Site_ID),
    CONSTRAINT FK_racks_building     FOREIGN KEY (Building_ID) REFERENCES buildings(Building_ID),
    CONSTRAINT FK_racks_floor        FOREIGN KEY (Floor_ID)    REFERENCES floors(Floor_ID),
    CONSTRAINT FK_racks_room         FOREIGN KEY (Room_ID)     REFERENCES rooms(Room_ID)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT CHK_racks_total_units CHECK (total_units > 0),
    CONSTRAINT CHK_racks_units_per_u CHECK (units_per_u BETWEEN 1 AND 12)
);
GO

-- Sheet 8_Switch — paste cols B–Z (25 cols)
CREATE TABLE poe_switches (
    -- ── Excel columns (paste order) ──
    Site_ID         NVARCHAR(10)               NOT NULL,  -- col B
    Building_ID     NVARCHAR(10)               NOT NULL,  -- col C
    Floor_ID        NVARCHAR(10)               NOT NULL,  -- col D
    Room_ID         NVARCHAR(20)               NOT NULL,  -- col E
    Rack_ID         NVARCHAR(20)               NOT NULL,  -- col F
    SW_ID           NVARCHAR(20)               NOT NULL,  -- col G  SW_ID(PK)
    u_position      INT                        NULL,      -- col H  U Position
    u_subposition   TINYINT                    NULL,      -- col I  U Sub-pos (1-3)
    device_name     NVARCHAR(100)              NOT NULL,  -- col J  Device Name
    switch_type     NVARCHAR(20)               NULL,      -- col K  Switch Type
    brand           NVARCHAR(100)              NULL,      -- col L
    model           NVARCHAR(100)              NULL,      -- col M
    serial_no       NVARCHAR(100)              NULL,      -- col N  Serial No (S/N)
    mac_address     NVARCHAR(20)               NULL,      -- col O  MAC Address
    os_version      NVARCHAR(50)               NULL,      -- col P  OS / Firmware
    vlan_id         INT                        NULL,      -- col Q  VLAN
    ip_address      NVARCHAR(20)               NULL,      -- col R  IP Address
    total_ports     INT                        NULL,      -- col S  Total Ports
    poe_ports       INT                        NULL,      -- col T  PoE Ports
    poe_budget_w    INT                        NULL,      -- col U  PoE Budget (W)
    poe_used_w      INT                        NULL,      -- col V  PoE Used (W)
    uplink_port     NVARCHAR(100)              NULL,      -- col W  Uplink Port
    status          NVARCHAR(20) DEFAULT N'unknown' NULL, -- col X  Status
    fail_count      INT          DEFAULT 0     NULL,      -- col Y  Fail Count
    notes           NVARCHAR(MAX)              NULL,      -- col Z  Note
    -- ── DB only ──
    u_size          TINYINT      DEFAULT 1     NULL,
    subnet_mask     NVARCHAR(20)               NULL,
    gateway         NVARCHAR(20)               NULL,
    last_seen       DATETIME2(7)               NULL,
    created_at      DATETIME2(7) DEFAULT SYSUTCDATETIME() NOT NULL,
    updated_at      DATETIME2(7) DEFAULT SYSUTCDATETIME() NOT NULL,

    CONSTRAINT PK_poe_switches    PRIMARY KEY CLUSTERED (SW_ID),
    CONSTRAINT UQ_sw_name         UNIQUE (device_name),
    CONSTRAINT CHK_sw_usubpos     CHECK  (u_subposition IS NULL OR u_subposition BETWEEN 1 AND 3),
    CONSTRAINT CHK_sw_status      CHECK  (status IN ('online','offline','warning','unknown')),
    CONSTRAINT CHK_sw_switch_type CHECK  (switch_type IS NULL
                                       OR switch_type IN ('PoE','Non-PoE','Core','Aggregation')),
    CONSTRAINT FK_sw_site         FOREIGN KEY (Site_ID)     REFERENCES sites(Site_ID),
    CONSTRAINT FK_sw_building     FOREIGN KEY (Building_ID) REFERENCES buildings(Building_ID),
    CONSTRAINT FK_sw_floor        FOREIGN KEY (Floor_ID)    REFERENCES floors(Floor_ID),
    CONSTRAINT FK_sw_room         FOREIGN KEY (Room_ID)     REFERENCES rooms(Room_ID),
    CONSTRAINT FK_sw_rack         FOREIGN KEY (Rack_ID)     REFERENCES racks(Rack_ID)
        ON DELETE NO ACTION ON UPDATE CASCADE
);
GO

-- Sheet 7_NVR — paste cols B–AB (27 cols)
CREATE TABLE nvrs (
    -- ── Excel columns (paste order) ──
    Site_ID         NVARCHAR(10)               NOT NULL,  -- col B
    Building_ID     NVARCHAR(10)               NOT NULL,  -- col C
    Floor_ID        NVARCHAR(10)               NOT NULL,  -- col D
    Room_ID         NVARCHAR(20)               NOT NULL,  -- col E
    Rack_ID         NVARCHAR(20)               NOT NULL,  -- col F
    NVR_ID          NVARCHAR(20)               NOT NULL,  -- col G  NVR_ID (PK)
    u_position      INT                        NULL,      -- col H  U Position
    u_subposition   TINYINT                    NULL,      -- col I  U Sub-pos (1-3)
    u_size          TINYINT      DEFAULT 1     NULL,      -- col J  U-Size
    device_name     NVARCHAR(100)              NOT NULL,  -- col K  Device Name
    brand           NVARCHAR(100)              NULL,      -- col L
    model           NVARCHAR(100)              NULL,      -- col M
    serial_no       NVARCHAR(100)              NULL,      -- col N  Serial No (S/N)
    mac_address     NVARCHAR(20)               NULL,      -- col O  MAC Address
    os_version      NVARCHAR(50)               NULL,      -- col P  OS / Firmware
    vlan_id         INT                        NULL,      -- col Q  VLAN
    ip_internet     NVARCHAR(20)               NULL,      -- col R  IP (Internet Port)
    ip_cctv         NVARCHAR(20)               NULL,      -- col S  IP (CCTV Port)
    total_channels  INT                        NULL,      -- col T  Total Channels
    active_channels INT                        NULL,      -- col U  Active Channels
    hdd_total_tb    DECIMAL(6,2)               NULL,      -- col V  HDD Total (TB)
    recording_res   NVARCHAR(20)               NULL,      -- col W  Recording Resolution
    retention_days  INT                        NULL,      -- col X  Retention (days)
    record_status   NVARCHAR(20)               NULL,      -- col Y  Record Status
    status          NVARCHAR(20) DEFAULT N'unknown' NULL, -- col Z  Status
    fail_count      INT          DEFAULT 0     NULL,      -- col AA Fail Count
    notes           NVARCHAR(MAX)              NULL,      -- col AB Note
    -- ── DB only ──
    hdd_used_pct    DECIMAL(5,2)               NULL,
    subnet_mask     NVARCHAR(20)               NULL,
    gateway         NVARCHAR(20)               NULL,
    last_seen       DATETIME2(7)               NULL,
    created_at      DATETIME2(7) DEFAULT SYSUTCDATETIME() NOT NULL,
    updated_at      DATETIME2(7) DEFAULT SYSUTCDATETIME() NOT NULL,

    CONSTRAINT PK_nvrs             PRIMARY KEY CLUSTERED (NVR_ID),
    CONSTRAINT UQ_nvr_name         UNIQUE (device_name),
    CONSTRAINT CHK_nvr_usubpos     CHECK  (u_subposition IS NULL OR u_subposition BETWEEN 1 AND 3),
    CONSTRAINT CHK_nvr_status      CHECK  (status IN ('online','offline','warning','unknown')),
    CONSTRAINT CHK_nvr_hdd_pct     CHECK  (hdd_used_pct IS NULL OR hdd_used_pct BETWEEN 0 AND 100),
    CONSTRAINT CHK_nvr_rec_status  CHECK  (record_status IS NULL
                                        OR record_status IN ('normal','warning','error','stopped')),
    CONSTRAINT FK_nvr_site         FOREIGN KEY (Site_ID)     REFERENCES sites(Site_ID),
    CONSTRAINT FK_nvr_building     FOREIGN KEY (Building_ID) REFERENCES buildings(Building_ID),
    CONSTRAINT FK_nvr_floor        FOREIGN KEY (Floor_ID)    REFERENCES floors(Floor_ID),
    CONSTRAINT FK_nvr_room         FOREIGN KEY (Room_ID)     REFERENCES rooms(Room_ID),
    CONSTRAINT FK_nvr_rack         FOREIGN KEY (Rack_ID)     REFERENCES racks(Rack_ID)
        ON DELETE NO ACTION ON UPDATE CASCADE
);
GO

-- Sheet 6_CCTV — paste 2 ส่วน:
--   ส่วน 1: cols B–R (17 cols)
--   ส่วน 2: cols U–W (3 cols)  ข้าม S-T ที่ซ้ำกัน
CREATE TABLE cameras (
    id              INT          IDENTITY(1,1) NOT NULL,  -- auto (SSMS ข้ามให้)
    -- ── Excel columns ส่วน 1 (paste cols B–R) ──
    Site_ID         NVARCHAR(10)               NOT NULL,  -- col B
    Building_ID     NVARCHAR(10)               NOT NULL,  -- col C
    Floor_ID        NVARCHAR(10)               NOT NULL,  -- col D
    NVR_CH          NVARCHAR(30)               NULL,      -- col E  ID(PK)
    NVR_ID          NVARCHAR(20)               NULL,      -- col F  NVR (FK)
    nvr_channel     INT                        NULL,      -- col G  CH(Port)
    device_name     NVARCHAR(100)              NOT NULL,  -- col H  Device Name
    brand           NVARCHAR(100)              NULL,      -- col I
    model           NVARCHAR(100)              NULL,      -- col J
    serial_no       NVARCHAR(100)              NULL,      -- col K  Serial No (S/N)
    mac_address     NVARCHAR(100)              NULL,      -- col L  MAC Address
    camera_type     NVARCHAR(50)               NULL,      -- col M  Camera Type
    resolution      NVARCHAR(50)               NULL,      -- col N  Resolution
    ip_address      NVARCHAR(20)               NULL,      -- col O  IP Address
    vlan_id         INT                        NULL,      -- col P  VLAN
    SW_ID           NVARCHAR(20)               NULL,      -- col Q  PoE Switch Name (FK)
    poe_port_number INT                        NULL,      -- col R  Switch Port
    -- ── Excel columns ส่วน 2 (paste cols U–W) ──
    status          NVARCHAR(20) DEFAULT N'unknown' NULL, -- col U  Status
    fail_count      INT          DEFAULT 0     NULL,      -- col V  Fail Count
    notes           NVARCHAR(MAX)              NULL,      -- col W  Note
    -- ── DB only ──
    firmware_version NVARCHAR(50)              NULL,
    install_location NVARCHAR(255)             NULL,
    subnet_mask     NVARCHAR(20)               NULL,
    gateway         NVARCHAR(20)               NULL,
    last_seen       DATETIME2(7)               NULL,
    created_at      DATETIME2(7) DEFAULT SYSUTCDATETIME() NOT NULL,
    updated_at      DATETIME2(7) DEFAULT SYSUTCDATETIME() NOT NULL,

    CONSTRAINT PK_cameras        PRIMARY KEY CLUSTERED (id),
    CONSTRAINT UQ_cam_name       UNIQUE (device_name),
    CONSTRAINT CHK_cam_status    CHECK (status IN ('online','offline','warning','unknown')),
    CONSTRAINT FK_cam_site       FOREIGN KEY (Site_ID)     REFERENCES sites(Site_ID),
    CONSTRAINT FK_cam_building   FOREIGN KEY (Building_ID) REFERENCES buildings(Building_ID),
    CONSTRAINT FK_cam_floor      FOREIGN KEY (Floor_ID)    REFERENCES floors(Floor_ID)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT FK_cam_poe_switch FOREIGN KEY (SW_ID)       REFERENCES poe_switches(SW_ID)
        ON DELETE SET NULL ON UPDATE NO ACTION,
    CONSTRAINT FK_cam_nvr        FOREIGN KEY (NVR_ID)      REFERENCES nvrs(NVR_ID)
        ON DELETE SET NULL ON UPDATE NO ACTION
);
GO

-- =============================================================================
-- STEP 3 : FILTERED UNIQUE INDEXES
-- =============================================================================

CREATE UNIQUE INDEX UQ_nvr_serial ON nvrs         (serial_no)   WHERE serial_no   IS NOT NULL;
CREATE UNIQUE INDEX UQ_nvr_mac    ON nvrs         (mac_address) WHERE mac_address IS NOT NULL;
CREATE UNIQUE INDEX UQ_sw_serial  ON poe_switches (serial_no)   WHERE serial_no   IS NOT NULL;
CREATE UNIQUE INDEX UQ_sw_mac     ON poe_switches (mac_address) WHERE mac_address IS NOT NULL;
CREATE UNIQUE INDEX UQ_cam_serial ON cameras      (serial_no)   WHERE serial_no   IS NOT NULL;
CREATE UNIQUE INDEX UQ_cam_mac    ON cameras      (mac_address) WHERE mac_address IS NOT NULL;
CREATE UNIQUE INDEX UQ_cam_nvr_ch ON cameras      (NVR_CH)      WHERE NVR_CH      IS NOT NULL;
GO

-- =============================================================================
-- STEP 4 : INDEXES
-- =============================================================================

CREATE INDEX IX_buildings_site   ON buildings    (Site_ID);
CREATE INDEX IX_floors_building  ON floors       (Building_ID);
CREATE INDEX IX_floors_site      ON floors       (Site_ID);
CREATE INDEX IX_rooms_floor      ON rooms        (Floor_ID);
CREATE INDEX IX_racks_room       ON racks        (Room_ID);

CREATE INDEX IX_cameras_floor    ON cameras      (Floor_ID);
CREATE INDEX IX_cameras_site     ON cameras      (Site_ID);
CREATE INDEX IX_cameras_poe      ON cameras      (SW_ID, poe_port_number);
CREATE INDEX IX_cameras_nvr      ON cameras      (NVR_ID, nvr_channel);
CREATE INDEX IX_cameras_nvr_ch   ON cameras      (NVR_CH);
CREATE INDEX IX_cameras_status   ON cameras      (status, fail_count);
CREATE INDEX IX_cameras_ip       ON cameras      (ip_address);

CREATE INDEX IX_nvrs_room        ON nvrs         (Room_ID);
CREATE INDEX IX_nvrs_rack_slot   ON nvrs         (Rack_ID, u_position, u_subposition);
CREATE INDEX IX_nvrs_status      ON nvrs         (status, fail_count);
CREATE INDEX IX_nvrs_ip_internet ON nvrs         (ip_internet);
CREATE INDEX IX_nvrs_ip_cctv     ON nvrs         (ip_cctv);

CREATE INDEX IX_sw_room          ON poe_switches (Room_ID);
CREATE INDEX IX_sw_rack_slot     ON poe_switches (Rack_ID, u_position, u_subposition);
CREATE INDEX IX_sw_status        ON poe_switches (status, fail_count);
CREATE INDEX IX_sw_ip            ON poe_switches (ip_address);
GO

-- =============================================================================
-- STEP 5 : VIEWS (recreate เพราะ column order เปลี่ยน)
-- =============================================================================

CREATE OR ALTER VIEW vw_camera_full_path AS
SELECT
    c.id AS camera_id, c.device_name AS camera_name,
    c.brand, c.model, c.serial_no, c.mac_address,
    c.ip_address, c.vlan_id, c.camera_type, c.resolution,
    c.install_location, c.status, c.fail_count, c.last_seen,
    s.Site_ID, s.name AS site_name,
    b.Building_ID, b.name AS building_name,
    f.Floor_ID, f.floor_number, f.name AS floor_name,
    c.NVR_CH,
    n.NVR_ID, n.device_name AS nvr_name,
    n.ip_internet AS nvr_ip_internet, n.ip_cctv AS nvr_ip_cctv,
    c.nvr_channel,
    sw.SW_ID, sw.device_name AS poe_switch_name, sw.ip_address AS poe_switch_ip,
    c.poe_port_number, c.created_at, c.updated_at
FROM       cameras      c
INNER JOIN sites        s  ON s.Site_ID     = c.Site_ID
INNER JOIN buildings    b  ON b.Building_ID = c.Building_ID
INNER JOIN floors       f  ON f.Floor_ID    = c.Floor_ID
LEFT  JOIN nvrs         n  ON n.NVR_ID      = c.NVR_ID
LEFT  JOIN poe_switches sw ON sw.SW_ID      = c.SW_ID;
GO

CREATE OR ALTER VIEW vw_nvr_full_path AS
SELECT
    n.NVR_ID, n.device_name AS nvr_name,
    n.brand, n.model, n.serial_no, n.mac_address,
    n.ip_internet, n.ip_cctv, n.vlan_id, n.os_version,
    n.total_channels, n.active_channels, n.hdd_total_tb, n.hdd_used_pct,
    n.retention_days, n.record_status,
    n.u_position, n.u_subposition, n.u_size,
    n.status, n.fail_count, n.last_seen,
    s.Site_ID, s.name AS site_name,
    b.Building_ID, b.name AS building_name,
    f.Floor_ID, f.floor_number, f.name AS floor_name,
    r.Room_ID, r.name AS room_name,
    rk.Rack_ID, rk.name AS rack_name,
    n.created_at, n.updated_at
FROM       nvrs      n
INNER JOIN sites     s  ON s.Site_ID     = n.Site_ID
INNER JOIN buildings b  ON b.Building_ID = n.Building_ID
INNER JOIN floors    f  ON f.Floor_ID    = n.Floor_ID
INNER JOIN rooms     r  ON r.Room_ID     = n.Room_ID
INNER JOIN racks     rk ON rk.Rack_ID   = n.Rack_ID;
GO

CREATE OR ALTER VIEW vw_switch_full_path AS
SELECT
    sw.SW_ID, sw.device_name AS switch_name, sw.switch_type,
    sw.brand, sw.model, sw.serial_no, sw.mac_address,
    sw.ip_address, sw.vlan_id, sw.os_version,
    sw.total_ports, sw.poe_ports, sw.poe_budget_w, sw.poe_used_w, sw.uplink_port,
    sw.u_position, sw.u_subposition, sw.u_size,
    sw.status, sw.fail_count, sw.last_seen,
    s.Site_ID, s.name AS site_name,
    b.Building_ID, b.name AS building_name,
    f.Floor_ID, f.floor_number, f.name AS floor_name,
    r.Room_ID, r.name AS room_name,
    rk.Rack_ID, rk.name AS rack_name,
    sw.created_at, sw.updated_at
FROM       poe_switches sw
INNER JOIN sites        s  ON s.Site_ID     = sw.Site_ID
INNER JOIN buildings    b  ON b.Building_ID = sw.Building_ID
INNER JOIN floors       f  ON f.Floor_ID    = sw.Floor_ID
INNER JOIN rooms        r  ON r.Room_ID     = sw.Room_ID
INNER JOIN racks        rk ON rk.Rack_ID   = sw.Rack_ID;
GO

CREATE OR ALTER VIEW vw_dashboard_summary AS
SELECT
    s.Site_ID, s.code AS site_code, s.name AS site_name,
    (SELECT COUNT(*) FROM cameras      WHERE Site_ID = s.Site_ID)                        AS total_cameras,
    (SELECT COUNT(*) FROM cameras      WHERE Site_ID = s.Site_ID AND status = 'online')  AS cameras_online,
    (SELECT COUNT(*) FROM cameras      WHERE Site_ID = s.Site_ID AND status = 'offline') AS cameras_offline,
    (SELECT COUNT(*) FROM cameras      WHERE Site_ID = s.Site_ID AND status = 'warning') AS cameras_warning,
    (SELECT COUNT(*) FROM nvrs         WHERE Site_ID = s.Site_ID)                        AS total_nvrs,
    (SELECT COUNT(*) FROM nvrs         WHERE Site_ID = s.Site_ID AND status = 'offline') AS nvrs_offline,
    (SELECT COUNT(*) FROM nvrs         WHERE Site_ID = s.Site_ID AND hdd_used_pct > 80)  AS nvrs_hdd_warning,
    (SELECT COUNT(*) FROM poe_switches WHERE Site_ID = s.Site_ID)                        AS total_switches,
    (SELECT COUNT(*) FROM poe_switches WHERE Site_ID = s.Site_ID AND status = 'offline') AS switches_offline,
    (SELECT COUNT(*) FROM buildings    WHERE Site_ID = s.Site_ID)                        AS total_buildings,
    (SELECT COUNT(*) FROM floors       WHERE Site_ID = s.Site_ID)                        AS total_floors,
    (SELECT COUNT(*) FROM rooms        WHERE Site_ID = s.Site_ID)                        AS total_rooms,
    (SELECT COUNT(*) FROM racks        WHERE Site_ID = s.Site_ID)                        AS total_racks
FROM sites s;
GO

CREATE OR ALTER VIEW vw_unresolved_alerts AS
SELECT * FROM alert_logs WHERE resolved_at IS NULL;
GO

-- =============================================================================
-- END — ตาราง survey 8 ตารางถูก reset เปล่าแล้ว
-- ตาราง auth/log ยังคงอยู่ครบ (users, sync_logs, audit_logs, ping_logs, alert_logs)
-- =============================================================================
