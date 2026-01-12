/**
 * app/api/admin/table/[table]/[id]/route.js
 * 
 * Single Record Operations
 * GET: Get single record
 * PUT: Update record
 * DELETE: Delete record
 */

import sql from '../../../../../../lib/postgres';
import { NextResponse } from 'next/server';

const ALLOWED_TABLES = [
  'collections', 'config_files', 'data_files', 'static_files',
  'images', 'javascript_files', 'resumes', 'sync_manifest'
];

export async function GET(request, { params }) {
  const { table, id } = params;

  if (!ALLOWED_TABLES.includes(table)) {
    return NextResponse.json({ status: 'error', error: 'Invalid table' }, { status: 400 });
  }

  try {
    const query = `SELECT * FROM ${table} WHERE id = $1`;
    const result = await sql(query, [id]);

    if (result.rows.length === 0) {
      return NextResponse.json({
        status: 'error',
        error: 'Record not found'
      }, { status: 404 });
    }

    return NextResponse.json({
      status: 'success',
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
  const { table, id } = params;

  if (!ALLOWED_TABLES.includes(table)) {
    return NextResponse.json({ status: 'error', error: 'Invalid table' }, { status: 400 });
  }

  try {
    const data = await request.json();

    // Build dynamic UPDATE query
    const setClauses = Object.keys(data)
      .filter(key => key !== 'id')
      .map((key, idx) => `${key} = $${idx + 1}`);

    if (setClauses.length === 0) {
      return NextResponse.json({
        status: 'error',
        error: 'No fields to update'
      }, { status: 400 });
    }

    const result = await sql(`
      UPDATE ${table}
      SET ${Object.keys(data)
        .filter(key => key !== 'id')
        .map((key, idx) => `${key} = $${idx + 1}`).join(', ')}
      WHERE id = $${Object.keys(data).filter(key => key !== 'id').length + 1}
      RETURNING *
    `, [...Object.keys(data).filter(key => key !== 'id').map(key => data[key]), id]);

    if (result.rows.length === 0) {
      return NextResponse.json({
        status: 'error',
        error: 'Record not found'
      }, { status: 404 });
    }

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
  const { table, id } = params;

  if (!ALLOWED_TABLES.includes(table)) {
    return NextResponse.json({ status: 'error', error: 'Invalid table' }, { status: 400 });
  }

  try {
    const result = await sql(`DELETE FROM ${table} WHERE id = $1 RETURNING id`, [id]);

    if (result.rows.length === 0) {
      return NextResponse.json({
        status: 'error',
        error: 'Record not found'
      }, { status: 404 });
    }

    return NextResponse.json({
      status: 'success',
      message: 'Record deleted',
      deleted_id: result.rows[0].id
    });
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      error: error.message
    }, { status: 500 });
  }
}
