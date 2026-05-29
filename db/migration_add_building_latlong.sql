-- Add GPS coordinates to buildings table for Leaflet map (Task 3 Option B)
-- Nullable — buildings without coordinates are skipped on the map, shown as text list instead
ALTER TABLE [dbo].[buildings]
    ADD [lat] DECIMAL(10,7) NULL,
        [lng] DECIMAL(10,7) NULL;
