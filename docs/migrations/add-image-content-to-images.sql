-- ============================================
-- Migration: Add image_content column to images table
-- Date: 2026-01-19
-- Purpose: Store image binary content to support serverless deployment
-- ============================================

-- Add the image_content BYTEA column to store image binary data
ALTER TABLE images
ADD COLUMN IF NOT EXISTS image_content BYTEA;

-- Add index on filename for faster lookups
CREATE INDEX IF NOT EXISTS idx_images_filename_content ON images(filename);

-- Add comment to document the column
COMMENT ON COLUMN images.image_content IS 'Binary image content data (PNG, JPG, WEBP, SVG, etc)';
