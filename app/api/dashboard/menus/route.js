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
    const client = new pg.Client({
      connectionString,
      ssl: { rejectUnauthorized: false },
    });

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
        const collectionsPath = path.join(process.cwd(), 'public', 'collections');
        const languages = fs.readdirSync(collectionsPath)
          .filter(f => fs.statSync(path.join(collectionsPath, f)).isDirectory())
          .map(lang => ({
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
      menus: enhancedMenus
    });
  } catch (err) {
    console.error('[API_DASHBOARD_MENUS_ERROR]', err);
    return NextResponse.json(
      { status: 'error', error: err.message },
      { status: 500 }
    );
  }
}
