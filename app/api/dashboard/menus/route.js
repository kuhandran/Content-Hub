import { NextResponse } from 'next/server';
const pg = require('pg');
const fs = require('fs');
const path = require('path');

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_PRISMA_URL;

/**
 * GET /api/dashboard/menus
 * Returns sidebar menu configuration with dynamic submenu for collections
 */
export async function GET(request) {
  try {
    // Handle SSL based on connection string
    const clientConfig = {
      connectionString,
    };
    
    // For Supabase and remote databases, rejectUnauthorized: false
    // The sslmode=require is already in the connection string
    if (connectionString) {
      clientConfig.ssl = { rejectUnauthorized: false };
    }
    
    const client = new pg.Client(clientConfig);

    await client.connect();

    // Get menu configuration
    const menusResult = await client.query(
      `SELECT menu_name, display_name, icon, folder_path, menu_order, has_submenu
       FROM menu_config
       ORDER BY menu_order ASC;`
    );

    const menus = menusResult.rows;

    // Enhance collections menu with language submenus
    const enhancedMenus = menus.map(menu => {
      if (menu.menu_name === 'collections' && menu.folder_path) {
        // Hardcoded languages list (supports both local and Vercel environments)
        const languages = [
          'en', 'es', 'fr', 'de', 'ar-AE', 'hi', 'id', 'my', 'si', 'ta', 'th'
        ].map(lang => ({
          label: lang.toUpperCase(),
          value: lang,
          subItems: [
            { label: 'Config', value: `${lang}-config`, type: 'config' },
            { label: 'Data', value: `${lang}-data`, type: 'data' }
          ]
        }));

        return {
          ...menu,
          submenu: languages
        };
      }
      return menu;
    });

    await client.end();

    return NextResponse.json({
      status: 'success',
      menus: enhancedMenus,
      source: 'database'
    });
  } catch (err) {
    console.error('[API_DASHBOARD_MENUS_ERROR]', err);
    
    // Fallback: Generate menus from configuration if database fails
    try {
      const menus = [
        { menu_name: 'overview', display_name: 'Overview', icon: '📊', folder_path: null, menu_order: 1, has_submenu: false },
        { menu_name: 'collections', display_name: 'Collections', icon: '📁', folder_path: 'public/collections', menu_order: 2, has_submenu: true },
        { menu_name: 'config', display_name: 'Config', icon: '⚙️', folder_path: 'public/config', menu_order: 3, has_submenu: false },
        { menu_name: 'data', display_name: 'Data', icon: '📊', folder_path: 'public/data', menu_order: 4, has_submenu: false },
        { menu_name: 'files', display_name: 'Files', icon: '📄', folder_path: 'public/files', menu_order: 5, has_submenu: false },
        { menu_name: 'images', display_name: 'Images', icon: '🖼️', folder_path: 'public/image', menu_order: 6, has_submenu: false },
        { menu_name: 'js', display_name: 'JS', icon: '⚡', folder_path: 'public/js', menu_order: 7, has_submenu: false },
        { menu_name: 'placeholder', display_name: 'Placeholder', icon: '🚀', folder_path: null, menu_order: 8, has_submenu: false },
        { menu_name: 'resume', display_name: 'Resume', icon: '📄', folder_path: 'public/resume', menu_order: 9, has_submenu: false },
      ];
      
      // Enhance collections menu with language submenus
      const enhancedMenus = menus.map(menu => {
        if (menu.menu_name === 'collections' && menu.folder_path) {
          // Hardcoded languages list (works in both local and Vercel environments)
          const languages = [
            'en', 'es', 'fr', 'de', 'ar-AE', 'hi', 'id', 'my', 'si', 'ta', 'th'
          ].map(lang => ({
            label: lang.toUpperCase(),
            value: lang,
            subItems: [
              { label: 'Config', value: `${lang}-config`, type: 'config' },
              { label: 'Data', value: `${lang}-data`, type: 'data' }
            ]
          }));

          return {
            ...menu,
            submenu: languages
          };
        }
        return menu;
      });
      
      return NextResponse.json({
        status: 'success',
        menus: enhancedMenus,
        source: 'hardcoded_fallback'
      });
    } catch (fallbackErr) {
      console.error('[API_DASHBOARD_MENUS_FALLBACK_ERROR]', fallbackErr);
      return NextResponse.json(
        { status: 'error', error: 'Failed to load menu configuration' },
        { status: 500 }
      );
    }
  }
}
