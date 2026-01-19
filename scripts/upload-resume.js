#!/usr/bin/env node

/**
 * Upload Resume Script
 * Uploads resume PDF from public/resume/ to the PostgreSQL database
 * Computes file hash and stores metadata along with binary content
 */

const postgres = require('postgres');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/**
 * Compute SHA-256 hash of file content
 */
function computeFileHash(content) {
  return crypto.createHash('sha256').update(content).digest('hex');
}

/**
 * Main upload function
 */
async function uploadResume() {
  const startTime = Date.now();
  
  try {
    // Initialize database connection
    let connectionString = process.env.DATABASE_URL;
    
    // If DATABASE_URL is not set, construct it from individual parameters
    if (!connectionString) {
      const user = process.env.POSTGRES_USER || 'postgres';
      const password = process.env.POSTGRES_PASSWORD;
      const host = process.env.POSTGRES_HOST || 'localhost';
      const port = process.env.POSTGRES_PORT || '5432';
      const database = process.env.POSTGRES_DATABASE || 'postgres';
      
      if (!password) {
        throw new Error('DATABASE_URL or POSTGRES_PASSWORD environment variable not set');
      }
      
      connectionString = `postgresql://${user}:${password}@${host}:${port}/${database}?sslmode=require`;
      console.log(`🔧 Using constructed connection string for ${host}`);
    }

    const sql = postgres(connectionString);
    console.log('✅ Connected to database');

    // Read resume PDF file
    const resumePath = path.join(process.cwd(), 'public', 'resume', 'resume.pdf');
    
    if (!fs.existsSync(resumePath)) {
      throw new Error(`Resume file not found at ${resumePath}`);
    }

    const resumeContent = fs.readFileSync(resumePath);
    const resumeSize = resumeContent.length;
    const resumeHash = computeFileHash(resumeContent);
    const filename = 'resume.pdf';
    const filePath = '/resume.pdf';

    console.log(`📄 Resume file details:`);
    console.log(`   - Filename: ${filename}`);
    console.log(`   - File path: ${filePath}`);
    console.log(`   - Size: ${resumeSize} bytes`);
    console.log(`   - Hash: ${resumeHash.substring(0, 16)}...`);

    // Check if resume already exists
    const existing = await sql`
      SELECT id, filename, file_hash FROM resumes WHERE file_path = ${filePath}
    `;

    if (existing.length > 0) {
      console.log(`\n⚠️  Resume already exists in database`);
      console.log(`   - Existing ID: ${existing[0].id}`);
      console.log(`   - Existing Hash: ${existing[0].file_hash.substring(0, 16)}...`);
      
      if (existing[0].file_hash === resumeHash) {
        console.log(`   - Content is identical, skipping update`);
        await sql.end();
        console.log(`\n✅ Resume is up-to-date`);
        process.exit(0);
      } else {
        console.log(`   - Content differs, updating...`);
        await sql`
          UPDATE resumes 
          SET 
            file_hash = ${resumeHash},
            pdf_content = ${resumeContent},
            updated_at = CURRENT_TIMESTAMP
          WHERE file_path = ${filePath}
        `;
        console.log(`✅ Resume updated successfully`);
      }
    } else {
      // Insert new resume record
      console.log(`\n📝 Inserting resume into database...`);
      
      const result = await sql`
        INSERT INTO resumes (
          filename,
          file_path,
          file_hash,
          pdf_content,
          created_at,
          updated_at
        )
        VALUES (
          ${filename},
          ${filePath},
          ${resumeHash},
          ${resumeContent},
          CURRENT_TIMESTAMP,
          CURRENT_TIMESTAMP
        )
        RETURNING id, created_at, updated_at
      `;

      const record = result[0];
      console.log(`✅ Resume inserted successfully`);
      console.log(`   - Record ID: ${record.id}`);
      console.log(`   - Created: ${record.created_at}`);
      console.log(`   - Updated: ${record.updated_at}`);
    }

    // Verify the record
    const verification = await sql`
      SELECT id, filename, file_path, file_hash, created_at, updated_at, 
             octet_length(pdf_content) as pdf_size
      FROM resumes 
      WHERE file_path = ${filePath}
    `;

    if (verification.length > 0) {
      const record = verification[0];
      console.log(`\n✅ Verification successful:`);
      console.log(`   - ID: ${record.id}`);
      console.log(`   - Filename: ${record.filename}`);
      console.log(`   - Path: ${record.file_path}`);
      console.log(`   - PDF Size: ${record.pdf_size} bytes`);
      console.log(`   - Hash: ${record.file_hash.substring(0, 16)}...`);
      console.log(`   - Created: ${record.created_at}`);
      console.log(`   - Updated: ${record.updated_at}`);
    }

    await sql.end();

    const elapsed = Date.now() - startTime;
    console.log(`\n✅ Upload completed in ${elapsed}ms`);
    process.exit(0);

  } catch (error) {
    console.error('❌ Error uploading resume:', error.message);
    if (error.detail) {
      console.error('   Details:', error.detail);
    }
    process.exit(1);
  }
}

// Run the upload
uploadResume();
