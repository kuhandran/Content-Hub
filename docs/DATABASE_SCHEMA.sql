-- ============================================
-- Admin Dashboard Database Schema
-- For Content Hub Application
-- Comprehensive Schema with Safe Cleanup
-- ============================================

-- ============================================
-- STEP 1: DROP EXISTING TABLES (with CASCADE)
-- ============================================
-- Keep menu_config for existing dashboard
-- Drop only the old admin tables if they exist
DROP TABLE IF EXISTS sync_manifest CASCADE;
DROP TABLE IF EXISTS collections CASCADE;
DROP TABLE IF EXISTS config_files CASCADE;
DROP TABLE IF EXISTS data_files CASCADE;
DROP TABLE IF EXISTS static_files CASCADE;
DROP TABLE IF EXISTS images CASCADE;
DROP TABLE IF EXISTS javascript_files CASCADE;
DROP TABLE IF EXISTS resumes CASCADE;

-- Note: menu_config, dashboard_status, file_content remain if they exist
-- Uncomment below only if you want to completely reset
-- DROP TABLE IF EXISTS menu_config CASCADE;
-- DROP TABLE IF EXISTS dashboard_status CASCADE;
-- DROP TABLE IF EXISTS file_content CASCADE;

-- ============================================
-- STEP 2: CREATE EXISTING MENU TABLE (if not exists)
-- ============================================

-- MENU_CONFIG TABLE - for dashboard navigation menus
CREATE TABLE IF NOT EXISTS menu_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_name VARCHAR(100) NOT NULL,
  display_name VARCHAR(255) NOT NULL,
  icon VARCHAR(50),
  folder_path TEXT,
  menu_order INTEGER DEFAULT 0,
  has_submenu BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT menu_config_unique UNIQUE(menu_name)
);

CREATE INDEX IF NOT EXISTS idx_menu_config_name ON menu_config(menu_name);
CREATE INDEX IF NOT EXISTS idx_menu_config_order ON menu_config(menu_order);

-- ============================================
-- STEP 3: CREATE NEW OPTIMIZED ADMIN TABLES
-- ============================================

-- 1. COLLECTIONS TABLE (Multi-language content)
-- Stores language-specific configurations and data
CREATE TABLE collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  language VARCHAR(10) NOT NULL,
  type VARCHAR(50) NOT NULL,
  filename VARCHAR(255),
  file_path TEXT,
  file_hash VARCHAR(64),
  content JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT collections_unique UNIQUE(language, type, filename)
);

CREATE INDEX idx_collections_language ON collections(language);
CREATE INDEX idx_collections_type ON collections(type);
CREATE INDEX idx_collections_file_path ON collections(file_path);
CREATE INDEX idx_collections_created ON collections(created_at DESC);
CREATE INDEX idx_collections_hash ON collections(file_hash);

-- 2. CONFIG_FILES TABLE
-- Stores configuration files (apiRouting, languages, pageLayout, urlConfig, etc.)
CREATE TABLE config_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename VARCHAR(255) NOT NULL,
  file_path TEXT NOT NULL,
  file_hash VARCHAR(64),
  content JSONB,
  file_size INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT config_files_unique UNIQUE(file_path)
);

CREATE INDEX idx_config_files_filename ON config_files(filename);
CREATE INDEX idx_config_files_hash ON config_files(file_hash);
CREATE INDEX idx_config_files_created ON config_files(created_at DESC);
CREATE INDEX idx_config_files_path ON config_files(file_path);

-- 3. DATA_FILES TABLE
-- Stores core data files (achievements, caseStudies, education, experience, projects, skills, etc.)
CREATE TABLE data_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename VARCHAR(255) NOT NULL,
  file_path TEXT NOT NULL,
  file_hash VARCHAR(64),
  content JSONB,
  file_size INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT data_files_unique UNIQUE(file_path)
);

CREATE INDEX idx_data_files_filename ON data_files(filename);
CREATE INDEX idx_data_files_hash ON data_files(file_hash);
CREATE INDEX idx_data_files_created ON data_files(created_at DESC);
CREATE INDEX idx_data_files_path ON data_files(file_path);

-- 4. STATIC_FILES TABLE
-- Stores static web files (robots.txt, sitemap.xml, manifest.json, browserconfig.xml, etc.)
CREATE TABLE static_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename VARCHAR(255) NOT NULL,
  file_path TEXT NOT NULL,
  file_hash VARCHAR(64),
  file_type VARCHAR(50),
  file_size INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT static_files_unique UNIQUE(file_path)
);

CREATE INDEX idx_static_files_filename ON static_files(filename);
CREATE INDEX idx_static_files_type ON static_files(file_type);
CREATE INDEX idx_static_files_created ON static_files(created_at DESC);
CREATE INDEX idx_static_files_path ON static_files(file_path);
CREATE INDEX idx_static_files_hash ON static_files(file_hash);

-- 5. IMAGES TABLE
-- Stores image file metadata and references
CREATE TABLE images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename VARCHAR(255) NOT NULL,
  file_path TEXT NOT NULL,
  file_hash VARCHAR(64),
  image_url TEXT,
  alt_text TEXT,
  dimensions VARCHAR(50),
  file_size INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT images_unique UNIQUE(file_path)
);

CREATE INDEX idx_images_filename ON images(filename);
CREATE INDEX idx_images_hash ON images(file_hash);
CREATE INDEX idx_images_created ON images(created_at DESC);
CREATE INDEX idx_images_path ON images(file_path);

-- 6. JAVASCRIPT_FILES TABLE
-- Stores JavaScript bundle and asset files
CREATE TABLE javascript_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename VARCHAR(255) NOT NULL,
  file_path TEXT NOT NULL,
  file_hash VARCHAR(64),
  content TEXT,
  file_size INTEGER,
  minified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT javascript_files_unique UNIQUE(file_path)
);

CREATE INDEX idx_javascript_files_filename ON javascript_files(filename);
CREATE INDEX idx_javascript_files_hash ON javascript_files(file_hash);
CREATE INDEX idx_javascript_files_created ON javascript_files(created_at DESC);
CREATE INDEX idx_javascript_files_path ON javascript_files(file_path);
CREATE INDEX idx_javascript_files_minified ON javascript_files(minified);

-- 7. RESUMES TABLE
-- Stores resume file data
CREATE TABLE resumes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename VARCHAR(255) NOT NULL,
  file_path TEXT NOT NULL,
  file_hash VARCHAR(64),
  content JSONB,
  file_size INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT resumes_unique UNIQUE(file_path)
);

CREATE INDEX idx_resumes_filename ON resumes(filename);
CREATE INDEX idx_resumes_hash ON resumes(file_hash);
CREATE INDEX idx_resumes_created ON resumes(created_at DESC);
CREATE INDEX idx_resumes_path ON resumes(file_path);

-- 8. SYNC_MANIFEST TABLE
-- Tracks all sync/pump operations for audit and monitoring
CREATE TABLE sync_manifest (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name VARCHAR(100) NOT NULL,
  status VARCHAR(50) NOT NULL,
  message TEXT,
  files_count INTEGER DEFAULT 0,
  hash_mismatches INTEGER DEFAULT 0,
  missing_files INTEGER DEFAULT 0,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sync_manifest_table ON sync_manifest(table_name);
CREATE INDEX idx_sync_manifest_status ON sync_manifest(status);
CREATE INDEX idx_sync_manifest_created ON sync_manifest(created_at DESC);
CREATE INDEX idx_sync_manifest_compound ON sync_manifest(table_name, status, created_at DESC);

-- ============================================
-- STEP 4: ENABLE ROW LEVEL SECURITY
-- ============================================
ALTER TABLE menu_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE config_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE static_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE images ENABLE ROW LEVEL SECURITY;
ALTER TABLE javascript_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_manifest ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 5: SET UP PERMISSIONS
-- ============================================
GRANT ALL ON menu_config TO authenticated;
GRANT ALL ON collections TO authenticated;
GRANT ALL ON config_files TO authenticated;
GRANT ALL ON data_files TO authenticated;
GRANT ALL ON static_files TO authenticated;
GRANT ALL ON images TO authenticated;
GRANT ALL ON javascript_files TO authenticated;
GRANT ALL ON resumes TO authenticated;
GRANT ALL ON sync_manifest TO authenticated;

-- ============================================
-- STEP 6: POPULATE MENU_CONFIG TABLE
-- ============================================
INSERT INTO menu_config (menu_name, display_name, icon, folder_path, menu_order, has_submenu)
VALUES
  ('overview', 'Overview', '📊', NULL, 1, false),
  ('collections', 'Collections', '📚', 'public/collections', 2, true),
  ('analytics', 'Analytics', '📈', NULL, 3, false),
  ('control', 'Control Panel', '🎛️', NULL, 4, false),
  ('datamanager', 'Data Manager', '💾', NULL, 5, false),
  ('config', 'Config', '⚙️', 'public/config', 6, false),
  ('data', 'Data', '📊', 'public/data', 7, false),
  ('files', 'Files', '📄', 'public/files', 8, false),
  ('images', 'Images', '🖼️', 'public/image', 9, false),
  ('javascript', 'JavaScript', '⚡', 'public/js', 10, false),
  ('placeholder', 'Placeholder', '🚀', NULL, 11, false),
  ('resume', 'Resume', '📄', 'public/resume', 12, false)
ON CONFLICT (menu_name) DO NOTHING;

-- ============================================
-- VERIFICATION QUERIES (Run these to verify)
-- ============================================
-- Check all tables exist
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;

-- Check record counts
-- SELECT 'menu_config' as table_name, COUNT(*) as count FROM menu_config
-- UNION ALL
-- SELECT 'collections', COUNT(*) FROM collections
-- UNION ALL
-- SELECT 'config_files', COUNT(*) FROM config_files
-- UNION ALL
-- SELECT 'data_files', COUNT(*) FROM data_files
-- UNION ALL
-- SELECT 'static_files', COUNT(*) FROM static_files
-- UNION ALL
-- SELECT 'images', COUNT(*) FROM images
-- UNION ALL
-- SELECT 'javascript_files', COUNT(*) FROM javascript_files
-- UNION ALL
-- SELECT 'resumes', COUNT(*) FROM resumes
-- UNION ALL
-- SELECT 'sync_manifest', COUNT(*) FROM sync_manifest;
