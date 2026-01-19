-- ============================================
-- Migration: Add pdf_content column to resumes table
-- Date: 2026-01-19
-- Purpose: Store PDF binary content for resume files
-- ============================================

-- Add the pdf_content BYTEA column to store PDF binary data
ALTER TABLE resumes
ADD COLUMN IF NOT EXISTS pdf_content BYTEA;

-- Add index on filename for faster lookups
CREATE INDEX IF NOT EXISTS idx_resumes_filename_pdf ON resumes(filename);

-- Add comment to document the column
COMMENT ON COLUMN resumes.pdf_content IS 'Binary PDF content for the resume file';

-- Optional: If you want to migrate existing data from another column
-- UPDATE resumes SET pdf_content = DECODE(file_content, 'base64') WHERE pdf_content IS NULL;
