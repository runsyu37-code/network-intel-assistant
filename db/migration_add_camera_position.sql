-- Migration: add position_x / position_y to cameras table
-- Purpose: store camera placement on floor plan as percentage (0–100)
-- Run once on SSM_DB

ALTER TABLE [dbo].[cameras]
    ADD [position_x]      DECIMAL(5,2) NULL,
        [position_y]      DECIMAL(5,2) NULL,
        [position_set_at] DATETIME2    NULL,
        [position_set_by] INT          NULL;
