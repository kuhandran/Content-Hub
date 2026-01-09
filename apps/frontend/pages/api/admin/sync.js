import sql from '../../../lib/db';
import { logDatabase, logError, logResponse } from '../../../lib/logger';
import fs from 'fs';
import path from 'path';

// Keep track of sync state in memory (resets on deployment)
const syncState = {
  inProgress: false,
  currentTable: null,
  currentRecord: 0,
  totalRecords: 0,
  completedTables: [],
  errors: [],
  startTime: null,
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      status: 'error',
      message: 'Method not allowed. Use POST.' 
    });
  }

  const { action } = req.body;

  try {
    switch (action) {
      case 'sync-projects':
        return await syncTable(res, 'projects', 'projects.json', projectMapper);
      case 'sync-skills':
        return await syncTable(res, 'skills', 'skills.json', skillsMapper);
      case 'sync-experience':
        return await syncTable(res, 'experience', 'experience.json', experienceMapper);
      case 'sync-education':
        return await syncTable(res, 'education', 'education.json', educationMapper);
      case 'sync-achievements':
        return await syncTable(res, 'achievements', 'achievements.json', achievementsMapper);
      case 'status':
        return res.status(200).json({
          status: 'success',
          syncState,
          timestamp: new Date().toISOString(),
        });
      default:
        return res.status(400).json({
          status: 'error',
          message: `Unknown action: ${action}`
        });
    }
  } catch (error) {
    logError(error, { endpoint: '/api/admin/sync', action });
    return res.status(500).json({
      status: 'error',
      message: error.message,
      syncState,
      timestamp: new Date().toISOString(),
    });
  }
}

async function syncTable(res, tableName, fileName, mapper) {
  if (syncState.inProgress) {
    return res.status(429).json({
      status: 'error',
      message: 'Sync already in progress',
      syncState,
      timestamp: new Date().toISOString(),
    });
  }

  syncState.inProgress = true;
  syncState.currentTable = tableName;
  syncState.startTime = new Date();
  syncState.errors = [];

  console.log(`[SYNC] Starting sync for table: ${tableName}`);
  logDatabase('SYNC', tableName, { action: 'start' });

  try {
    const dataPath = path.join(process.cwd(), 'public/data');
    const filePath = path.join(dataPath, fileName);

    if (!fs.existsSync(filePath)) {
      throw new Error(`Data file not found: ${fileName}`);
    }

    const fileContent = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const records = mapper(fileContent);

    syncState.totalRecords = records.length;
    syncState.currentRecord = 0;

    console.log(`[SYNC] Inserting ${records.length} records into ${tableName}`);

    // Insert records in batches to avoid timeout
    const BATCH_SIZE = 10;
    for (let i = 0; i < records.length; i += BATCH_SIZE) {
      const batch = records.slice(i, i + BATCH_SIZE);
      
      for (const record of batch) {
        try {
          await insertRecord(tableName, record);
          syncState.currentRecord++;
          console.log(`[SYNC] ${tableName}: ${syncState.currentRecord}/${syncState.totalRecords}`);
        } catch (error) {
          syncState.errors.push({
            record: syncState.currentRecord,
            error: error.message,
          });
          console.error(`[SYNC] Error inserting record ${syncState.currentRecord}:`, error);
        }
      }

      // Small delay between batches to prevent overwhelming the DB
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    syncState.completedTables.push(tableName);
    logDatabase('SYNC', tableName, { 
      action: 'complete',
      recordsInserted: syncState.currentRecord,
      errors: syncState.errors.length
    });

    const response = {
      status: 'success',
      message: `Synced ${syncState.currentRecord} records to ${tableName}`,
      table: tableName,
      recordsInserted: syncState.currentRecord,
      errors: syncState.errors,
      timestamp: new Date().toISOString(),
    };

    logResponse(200, response);
    return res.status(200).json(response);

  } catch (error) {
    logError(error, { table: tableName, action: 'sync' });
    const errorResponse = {
      status: 'error',
      message: error.message,
      table: tableName,
      syncState,
      timestamp: new Date().toISOString(),
    };
    logResponse(500, errorResponse);
    return res.status(500).json(errorResponse);
  } finally {
    syncState.inProgress = false;
    syncState.currentTable = null;
  }
}

async function insertRecord(tableName, record) {
  switch (tableName) {
    case 'projects':
      return await sql`
        INSERT INTO projects (title, description, image, tech_stack, metrics, live_url, github_url, case_study_slug)
        VALUES (
          ${record.title},
          ${record.description},
          ${record.image},
          ${record.tech_stack},
          ${record.metrics},
          ${record.live_url},
          ${record.github_url},
          ${record.case_study_slug}
        )
      `;
    case 'skills':
      return await sql`
        INSERT INTO skills (category, name, icon, skill_data)
        VALUES (${record.category}, ${record.name}, ${record.icon}, ${record.skill_data})
      `;
    case 'experience':
      return await sql`
        INSERT INTO experience (company, position, duration, location, description, achievements)
        VALUES (${record.company}, ${record.position}, ${record.duration}, ${record.location}, ${record.description}, ${record.achievements})
      `;
    case 'education':
      return await sql`
        INSERT INTO education (degree, institution, year, description)
        VALUES (${record.degree}, ${record.institution}, ${record.year}, ${record.description})
      `;
    case 'achievements':
      return await sql`
        INSERT INTO achievements (title, description, date, icon)
        VALUES (${record.title}, ${record.description}, ${record.date}, ${record.icon})
      `;
  }
}

// Mappers convert JSON data to insert-ready records
function projectMapper(data) {
  return data.filter(p => p.title && p.description).map(p => ({
    title: p.title || null,
    description: p.description || null,
    image: p.image || null,
    tech_stack: JSON.stringify(p.techStack || []),
    metrics: p.metrics || null,
    live_url: p.liveUrl || null,
    github_url: p.githubUrl || null,
    case_study_slug: p.caseStudySlug || null,
  }));
}

function skillsMapper(data) {
  const records = [];
  for (const [category, skillData] of Object.entries(data)) {
    if (skillData && skillData.name) {
      records.push({
        category: category || null,
        name: skillData.name || null,
        icon: skillData.icon || null,
        skill_data: JSON.stringify(skillData.skills || []),
      });
    }
  }
  return records;
}

function experienceMapper(data) {
  return data.filter(e => e.company && e.position).map(e => ({
    company: e.company || null,
    position: e.position || null,
    duration: e.duration || null,
    location: e.location || null,
    description: e.description || null,
    achievements: JSON.stringify(e.achievements || []),
  }));
}

function educationMapper(data) {
  return data.filter(e => e.degree && e.institution).map(e => ({
    degree: e.degree || null,
    institution: e.institution || null,
    year: e.year || null,
    description: e.description || null,
  }));
}

function achievementsMapper(data) {
  return data.filter(a => a.title).map(a => ({
    title: a.title || null,
    description: a.description || null,
    date: a.date || null,
    icon: a.icon || null,
  }));
}
