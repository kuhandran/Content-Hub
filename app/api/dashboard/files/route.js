import { NextResponse } from 'next/server';
const fs = require('fs');
const path = require('path');

/**
 * GET /api/dashboard/files?type=collections&lang=en&subtype=config
 * Lists JSON files in a directory
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // collections, config, data, files, images, js, etc.
    const lang = searchParams.get('lang'); // For collections
    const subtype = searchParams.get('subtype'); // config or data

    if (!type) {
      return NextResponse.json(
        { status: 'error', error: 'type parameter required' },
        { status: 400 }
      );
    }

    let targetPath = path.join(process.cwd(), 'public');

    // Build path based on type and parameters
    if (type === 'collections' && lang) {
      if (subtype === 'config') {
        targetPath = path.join(targetPath, 'collections', lang, 'config');
      } else if (subtype === 'data') {
        targetPath = path.join(targetPath, 'collections', lang, 'data');
      } else {
        targetPath = path.join(targetPath, 'collections', lang);
      }
    } else if (type === 'config') {
      targetPath = path.join(targetPath, 'config');
    } else if (type === 'data') {
      targetPath = path.join(targetPath, 'data');
    } else if (type === 'images') {
      targetPath = path.join(targetPath, 'image');
    } else if (type === 'files') {
      targetPath = path.join(targetPath, 'files');
    } else if (type === 'js') {
      targetPath = path.join(targetPath, 'js');
    } else if (type === 'resume') {
      targetPath = path.join(targetPath, 'resume');
    } else {
      targetPath = path.join(targetPath, type);
    }

    // Security check: prevent directory traversal
    if (!targetPath.startsWith(path.join(process.cwd(), 'public'))) {
      return NextResponse.json(
        { status: 'error', error: 'Invalid path' },
        { status: 403 }
      );
    }

    if (!fs.existsSync(targetPath)) {
      return NextResponse.json({
        status: 'success',
        files: [],
        path: targetPath
      });
    }

    const files = fs.readdirSync(targetPath).map(filename => {
      const filePath = path.join(targetPath, filename);
      const stat = fs.statSync(filePath);
      const ext = path.extname(filename);

      return {
        name: filename,
        type: stat.isDirectory() ? 'directory' : 'file',
        extension: ext,
        size: stat.size,
        created: stat.birthtime,
        modified: stat.mtime,
        isJson: ext === '.json',
        isImage: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'].includes(ext.toLowerCase())
      };
    });

    // Sort: directories first, then files
    files.sort((a, b) => {
      if (a.type !== b.type) return a.type === 'directory' ? -1 : 1;
      return a.name.localeCompare(b.name);
    });

    return NextResponse.json({
      status: 'success',
      files,
      path: targetPath,
      type,
      lang,
      subtype
    });
  } catch (err) {
    console.error('[API_DASHBOARD_FILES_ERROR]', err);
    return NextResponse.json(
      { status: 'error', error: err.message },
      { status: 500 }
    );
  }
}
