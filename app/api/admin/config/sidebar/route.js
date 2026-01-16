/**
 * app/api/admin/config/sidebar/route.js
 * 
 * Dynamic Sidebar Configuration API
 * Returns list of tabs/components for AdminDashboard
 * Data can be stored in DB or config file
 * 
 * GET /api/admin/config/sidebar
 * Returns: { status, tabs: [{ id, key, label, icon, component, order, isVisible }] }
 */

import { NextResponse } from 'next/server';
import authMod from '../../../../../lib/auth';
import jwtManager from '../../../../../lib/jwt-manager';
import { logRequest, logResponse, logError } from '../../../../../lib/logger';

/**
 * Verify JWT token from Authorization header
 */
function verifyJWT(request) {
  try {
    const authHeader = request.headers.get('Authorization') || request.headers.get('authorization');
    if (!authHeader) {
      console.warn('[AUTH] No Authorization header found');
      return { ok: false, error: 'No authorization header' };
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
      console.warn('[AUTH] Invalid Authorization header format');
      return { ok: false, error: 'Invalid authorization header' };
    }

    const token = parts[1];
    const decoded = jwtManager.verifyToken(token);
    
    if (!decoded) {
      console.warn('[AUTH] JWT verification failed');
      return { ok: false, error: 'Invalid or expired token' };
    }

    console.log('[AUTH] JWT verified successfully for user:', decoded.username);
    return { ok: true, user: decoded };
  } catch (error) {
    console.error('[AUTH] JWT verification error:', error.message);
    return { ok: false, error: error.message };
  }
}

// Default sidebar configuration
// Can be overridden from database or environment
const DEFAULT_TABS = [
  // ===== MAIN SECTION =====
  {
    id: 'overview',
    key: 'overview',
    label: 'Overview',
    icon: '📊',
    component: 'OverviewTab',
    order: 1,
    isVisible: true,
    section: 'main',
    description: 'Dashboard overview and quick stats'
  },
  {
    id: 'analytics',
    key: 'analytics',
    label: 'Analytics',
    icon: '📈',
    component: 'AnalyticsPanel',
    order: 2,
    isVisible: true,
    section: 'main',
    description: 'Dashboard analytics and KPIs'
  },
  {
    id: 'datamanager',
    key: 'datamanager',
    label: 'Data Manager',
    icon: '💾',
    component: 'DataManager',
    order: 4,
    isVisible: true,
    section: 'main',
    description: 'Pump monitor and database sync'
  },
  
  // ===== CONTENT SECTION =====
  {
    id: 'collections',
    key: 'collections',
    label: 'Collections',
    icon: '📚',
    component: 'CollectionsTab',
    order: 10,
    isVisible: true,
    section: 'content',
    description: 'Language packs and collection data',
    hasLanguageSelector: true
  },
  {
    id: 'config',
    key: 'config',
    label: 'Config Files',
    icon: '⚙️',
    component: 'GenericTab',
    order: 11,
    isVisible: true,
    section: 'content',
    table: 'config_files',
    description: 'Configuration files'
  },
  {
    id: 'data',
    key: 'data',
    label: 'Data Files',
    icon: '📄',
    component: 'GenericTab',
    order: 12,
    isVisible: true,
    section: 'content',
    table: 'data_files',
    description: 'Data files'
  },
  {
    id: 'files',
    key: 'files',
    label: 'Static Files',
    icon: '📦',
    component: 'GenericTab',
    order: 13,
    isVisible: true,
    section: 'content',
    table: 'static_files',
    description: 'Static files'
  },
  {
    id: 'images',
    key: 'images',
    label: 'Images',
    icon: '🖼️',
    component: 'GenericTab',
    order: 14,
    isVisible: true,
    section: 'content',
    table: 'images',
    description: 'Image files'
  },
  {
    id: 'javascript',
    key: 'javascript',
    label: 'JavaScript',
    icon: '⚡',
    component: 'GenericTab',
    order: 15,
    isVisible: true,
    section: 'content',
    table: 'javascript_files',
    description: 'JavaScript files'
  },
  {
    id: 'resume',
    key: 'resume',
    label: 'Resume',
    icon: '📋',
    component: 'GenericTab',
    order: 16,
    isVisible: true,
    section: 'content',
    table: 'resumes',
    description: 'Resume files'
  },
  
  // ===== SETTINGS SECTION =====
  {
    id: 'users',
    key: 'users',
    label: 'User Management',
    icon: '👥',
    component: 'UserManagement',
    order: 20,
    isVisible: true,
    section: 'settings',
    description: 'Manage users and permissions'
  },
  {
    id: 'create-user',
    key: 'create-user',
    label: 'Create User',
    icon: '➕',
    component: 'CreateUser',
    order: 21,
    isVisible: true,
    section: 'settings',
    description: 'Add new user account'
  },
  {
    id: 'roles',
    key: 'roles',
    label: 'Roles & Types',
    icon: '🔐',
    component: 'RolesManagement',
    order: 22,
    isVisible: true,
    section: 'settings',
    description: 'Manage user roles and types'
  },
  {
    id: 'preferences',
    key: 'preferences',
    label: 'Preferences',
    icon: '🎨',
    component: 'Preferences',
    order: 23,
    isVisible: true,
    section: 'settings',
    description: 'Dashboard preferences and theme'
  },
  {
    id: 'about',
    key: 'about',
    label: 'About',
    icon: 'ℹ️',
    component: 'About',
    order: 24,
    isVisible: true,
    section: 'settings',
    description: 'System information and version'
  }
];

/**
 * GET /api/admin/config/sidebar
 * Returns sidebar configuration
 */
export async function GET(request) {
  logRequest(request);
  
  try {
    // Verify JWT token
    const jwtAuth = verifyJWT(request);
    if (!jwtAuth.ok) {
      console.warn('[SIDEBAR] JWT verification failed:', jwtAuth.error);
      return NextResponse.json(
        { status: 'error', error: jwtAuth.error },
        { status: 401 }
      );
    }

    // TODO: Load from database if configured
    // For now, return default configuration
    const tabs = DEFAULT_TABS
      .filter(tab => tab.isVisible)
      .sort((a, b) => a.order - b.order);

    // Group tabs by section
    const sections = {
      main: tabs.filter(t => t.section === 'main'),
      content: tabs.filter(t => t.section === 'content'),
      settings: tabs.filter(t => t.section === 'settings')
    };

    const response = {
      status: 'success',
      source: 'default', // 'default' or 'database'
      count: tabs.length,
      tabs,
      sections,
      timestamp: new Date().toISOString()
    };

    logResponse(request, response);
    return NextResponse.json(response);

  } catch (error) {
    logError('GET /api/admin/config/sidebar', error);
    return NextResponse.json(
      { status: 'error', error: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/config/sidebar
 * Update sidebar configuration (save to database)
 * 
 * Body: { tabs: [{ id, order, isVisible }] }
 */
export async function POST(request) {
  logRequest(request);
  
  try {
    // Verify JWT token
    const jwtAuth = verifyJWT(request);
    if (!jwtAuth.ok) {
      console.warn('[SIDEBAR] JWT verification failed:', jwtAuth.error);
      return NextResponse.json(
        { status: 'error', error: jwtAuth.error },
        { status: 401 }
      );
    }

    const { tabs, action } = await request.json();

    // TODO: Validate and save to database
    // For now, return success

    if (action === 'reorder') {
      console.log('[⚙️ Sidebar] Reordering tabs:', tabs);
      return NextResponse.json({
        status: 'success',
        action: 'reorder',
        message: 'Tab order updated',
        timestamp: new Date().toISOString()
      });
    }

    if (action === 'toggle_visibility') {
      console.log('[⚙️ Sidebar] Toggling visibility:', tabs);
      return NextResponse.json({
        status: 'success',
        action: 'toggle_visibility',
        message: 'Visibility updated',
        timestamp: new Date().toISOString()
      });
    }

    return NextResponse.json({
      status: 'success',
      action,
      message: 'Configuration updated',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logError('POST /api/admin/config/sidebar', error);
    return NextResponse.json(
      { status: 'error', error: error.message },
      { status: 500 }
    );
  }
}
