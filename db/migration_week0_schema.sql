-- =============================================================
-- Week 0 Schema Migration
-- Run in SSMS against the SSM_Monitor database
-- =============================================================

-- 1. Add camera position columns (percentage-based, 0.0–1.0)
ALTER TABLE cameras
    ADD position_x      DECIMAL(10,4) NULL,
        position_y      DECIMAL(10,4) NULL,
        position_set_at DATETIME      NULL,
        position_set_by INT           NULL;

ALTER TABLE cameras
    ADD CONSTRAINT CHK_cameras_pos_x
        CHECK (position_x IS NULL OR (position_x >= 0 AND position_x <= 1));

ALTER TABLE cameras
    ADD CONSTRAINT CHK_cameras_pos_y
        CHECK (position_y IS NULL OR (position_y >= 0 AND position_y <= 1));

-- 2. Create floor_plans table (one active plan per floor)
CREATE TABLE floor_plans (
    floor_plan_id   INT            IDENTITY(1,1) PRIMARY KEY,
    floor_id        NVARCHAR(10)   NOT NULL
        REFERENCES floors(Floor_ID) ON DELETE CASCADE,
    image_path      NVARCHAR(500)  NOT NULL,
    image_width     INT            NULL,
    image_height    INT            NULL,
    file_size_bytes BIGINT         NULL,
    version         INT            NOT NULL DEFAULT 1,
    uploaded_at     DATETIME       NOT NULL DEFAULT GETDATE(),
    uploaded_by     INT            NULL
        REFERENCES users(User_ID) ON DELETE SET NULL,
    is_active       BIT            NOT NULL DEFAULT 1,
    notes           NVARCHAR(MAX)  NULL
);

-- Only one active floor plan per floor
CREATE UNIQUE INDEX UX_floor_plans_one_active
    ON floor_plans (floor_id)
    WHERE is_active = 1;
