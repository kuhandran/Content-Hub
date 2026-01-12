/**
 * app/api/admin/table/[table]/route.js
 * 
 * Table Management API
 * GET: List all records
 * POST: Create new record
 * PUT: Update record
 * DELETE: Delete record
 */

import sql from '../../../../../lib/postgres';
import { NextResponse } from 'next/server';

const ALLOWED_TABLES = [
  'collections', 'config_files', 'data_files', 'static_files',
  'images', 'javascript_files', 'resumes', 'sync_manifest'
];

export async function GET(request, { params }) {
  const { table } = params;

  if (!ALLOWED_TABLES.includes(table)) {
    return NextResponse.json({ status: 'error', error: 'Invalid table' }, { status: 400 });
  }

  try {
    const query = `SELECT * FROM ${table} LIMIT 100`;
    const result = await sql(query);
    return NextResponse.json({
      status: 'success',
      table,
      records: result.rows
    });
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      error: error.message
    }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  const { table } = params;

  if (!ALLOWED_TABLES.includes(table)) {
    return NextResponse.json({ status: 'error', error: 'Invalid table' }, { status: 400 });
  }

  try {
    const data = await request.json();

    // Sanitize and build dynamic insert
    const columns = Object.keys(data).filter(key => key !== 'id');
    const values = columns.map(col => data[col]);

    if (columns.length === 0) {
      return NextResponse.json({
        status: 'error',
        error: 'No data provided'
      }, { status: 400 });
    }

    const result = await sql(`
      INSERT INTO ${table} (${columns.join(', ')})
      VALUES (${columns.map((_, i) => `$${i + 1}`).join(', ')})
      RETURNING *
    `, values);

    return NextResponse.json({
      status: 'success',
      message: 'Record created',
      record: result.rows[0]
    });
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      error: error.message
    }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  const { table } = params;

  if (!ALLOWED_TABLES.includes(table)) {
    return NextResponse.json({ status: 'error', error: 'Invalid table' }, { status: 400 });
  }

  try {
    const data = await request.json();
    const { id, ...updateData } = data;

    if (!id) {
      return NextResponse.json({
        status: 'error',
        error: 'ID required for update'
      }, { status: 400 });
    }

    const result = await sql(`
      UPDATE ${table}
      SET ${Object.keys(updateData).map((col, i) => `${col} = $${i + 1}`).join(', ')}
      WHERE id = $${Object.keys(updateData).length + 1}
      RETURNING *
    `, [...Object.values(updateData), id]);

    return NextResponse.json({
      status: 'success',
      message: 'Record updated',
      record: result.rows[0]
    });
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      error: error.message
    }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const { table } = params;

  if (!ALLOWED_TABLES.includes(table)) {
    return NextResponse.json({ status: 'error', error: 'Invalid table' }, { status: 400 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({
        status: 'error',
        error: 'ID required for deletion'
      }, { status: 400 });
    }

    await sql(`DELETE FROM ${table} WHERE id = $1`, [id]);

    return NextResponse.json({
      status: 'success',
      message: 'Record deleted'
    });
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      error: error.message
    }, { status: 500 });
  }
}
