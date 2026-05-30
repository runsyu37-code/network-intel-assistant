-- Migration: add topology_x / topology_y to sites table
-- Purpose: persist React Flow node positions for TopologyPage
-- Run once on SSM_DB

ALTER TABLE [dbo].[sites]
    ADD [topology_x] FLOAT NULL,
        [topology_y] FLOAT NULL;
