import { NextResponse } from 'next/server';
const fs = require('fs');
const path = require('path');

/**
 * GET /api/dashboard/file-content?type=collections&lang=en&subtype=config&file=apiConfig.json
 * Reads JSON file content
 * 
 * POST /api/dashboard/file-content
 * Writes JSON file content
 * 
 * DELETE /api/dashboard/file-content?type=collections&lang=en&subtype=config&file=apiConfig.json
 * Deletes a file
 */

// GET - Read file content
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const lang = searchParams.get('lang');
    const subtype = searchParams.get('subtype');
    const filename = searchParams.get('file');

    if (!type || !filename) {
      return NextResponse.json(
        { status: 'error', error: 'type and file parameters required' },
        { status: 400 }
      );
    }

    let filePath = path.join(process.cwd(), 'public');

    if (type === 'collections' && lang) {
      if (subtype === 'config') {
        filePath = path.join(filePath, 'collections', lang, 'config', filename);
      } else if (subtype === 'data') {
        filePath = path.join(filePath, 'collections', lang, 'data', filename);
      }
    } else if (type === 'config') {
      filePath = path.join(filePath, 'config', filename);
    } else if (type === 'data') {
      filePath = path.join(filePath, 'data', filename);
    } else if (type === 'images') {
      filePath = path.join(filePath, 'image', filename);
    } else if (type === 'files') {
      filePath = path.join(filePath, 'files', filename);
    } else if (type === 'js') {
      filePath = path.join(filePath, 'js', filename);
    } else if (type === 'resume') {
      filePath = path.join(filePath, 'resume', filename);
    } else {
      filePath = path.join(filePath, type, filename);
    }

    // Security check
    if (!filePath.startsWith(path.join(process.cwd(), 'public'))) {
      return NextResponse.json(
        { status: 'error', error: 'Invalid path' },
        { status: 403 }
      );
    }

    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { status: 'error', error: 'File not found' },
        { status: 404 }
      );
    }

    const content = fs.readFileSync(filePath, 'utf8');
    let parsed = null;

    try {
      parsed = JSON.parse(content);
    } catch (e) {
      // Not JSON, return as text
    }

    return NextResponse.json({
      status: 'success',
      filename,
      type,
      lang,
      subtype,
      content,
      parsed,
      size: fs.statSync(filePath).size
    });
  } catch (err) {
    console.error('[API_DASHBOARD_FILE_CONTENT_ERROR]', err);
    return NextResponse.json(
      { status: 'error', error: err.message },
      { status: 500 }
    );
  }
}

// POST - Write file content
export async function POST(request) {
  try {
    const body = await request.json();
    const { type, lang, subtype, filename, content } = body;

    if (!type || !filename || !content) {
      return NextResponse.json(
        { status: 'error', error: 'type, filename, and content required' },
        { status: 400 }
      );
    }

    let filePath = path.join(process.cwd(), 'public');

    if (type === 'collections' && lang) {
      if (subtype === 'config') {
        filePath = path.join(filePath, 'collections', lang, 'config', filename);
      } else if (subtype === 'data') {
        filePath = path.join(filePath, 'collections', lang, 'data', filename);
      }
    } else if (type === 'config') {
      filePath = path.join(filePath, 'config', filename);
    } else if (type === 'data') {
      filePath = path.join(filePath, 'data', filename);
    } else if (type === 'files') {
      filePath = path.join(filePath, 'files', filename);
    } else if (type === 'js') {
      filePath = path.join(filePath, 'js', filename);
    } else if (type === 'resume') {
      filePath = path.join(filePath, 'resume', filename);
    } else {
      filePath = path.join(filePath, type, filename);
    }

    // Security check
    if (!filePath.startsWith(path.join(process.cwd(), 'public'))) {
      return NextResponse.json(
        { status: 'error', error: 'Invalid path' },
        { status: 403 }
      );
    }

    // Ensure directory exists
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Validate JSON if file ends with .json
    if (filename.endsWith('.json')) {
      try {
        JSON.parse(content);
      } catch (e) {
        return NextResponse.json(
          { status: 'error', error: 'Invalid JSON: ' + e.message },
          { status: 400 }
        );
      }
    }

    fs.writeFileSync(filePath, content, 'utf8');

    return NextResponse.json({
      status: 'success',
      message: 'File saved',
      filename,
      path: filePath
    });
  } catch (err) {
    console.error('[API_DASHBOARD_FILE_SAVE_ERROR]', err);
    return NextResponse.json(
      { status: 'error', error: err.message },
      { status: 500 }
    );
  }
}

// DELETE - Delete file
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const lang = searchParams.get('lang');
    const subtype = searchParams.get('subtype');
    const filename = searchParams.get('file');

    if (!type || !filename) {
      return NextResponse.json(
        { status: 'error', error: 'type and file parameters required' },
        { status: 400 }
      );
    }

    let filePath = path.join(process.cwd(), 'public');

    if (type === 'collections' && lang) {
      if (subtype === 'config') {
        filePath = path.join(filePath, 'collections', lang, 'config', filename);
      } else if (subtype === 'data') {
        filePath = path.join(filePath, 'collections', lang, 'data', filename);
      }
    } else if (type === 'config') {
      filePath = path.join(filePath, 'config', filename);
    } else if (type === 'data') {
      filePath = path.join(filePath, 'data', filename);
    } else if (type === 'files') {
      filePath = path.join(filePath, 'files', filename);
    } else if (type === 'js') {
      filePath = path.join(filePath, 'js', filename);
    } else if (type === 'resume') {
      filePath = path.join(filePath, 'resume', filename);
    } else {
      filePath = path.join(filePath, type, filename);
    }

    // Security check
    if (!filePath.startsWith(path.join(process.cwd(), 'public'))) {
      return NextResponse.json(
        { status: 'error', error: 'Invalid path' },
        { status: 403 }
      );
    }

    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { status: 'error', error: 'File not found' },
        { status: 404 }
      );
    }

    fs.unlinkSync(filePath);

    return NextResponse.json({
      status: 'success',
      message: 'File deleted',
      filename
    });
  } catch (err) {
    console.error('[API_DASHBOARD_FILE_DELETE_ERROR]', err);
    return NextResponse.json(
      { status: 'error', error: err.message },
      { status: 500 }
    );
  }
}
