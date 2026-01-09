import sql from '../../../lib/db';
import { logRequest, logResponse, logDatabase, logError } from '../../../lib/logger';
import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  logRequest(req, { endpoint: '/api/admin/operations' });

  if (req.method !== 'POST') {
    logResponse(405, { message: 'Method not allowed' }, { endpoint: '/api/admin/operations' });
    return res.status(405).json({ 
      status: 'error',
      message: 'Method not allowed. Use POST.' 
    });
  }

  const { operation } = req.body;
  logDatabase('LOG', 'operation', { operation, type: 'start' });

  try {
    switch (operation) {
      case 'status':
        return await handleStatus(res);
      case 'createdb':
        return await handleCreateDB(res);
      case 'deletedb':
        return await handleDeleteDB(res);
      case 'pumpdata':
        return await handlePumpData(res);
      default:
        logError(new Error(`Unknown operation: ${operation}`), { operation });
        const errorResponse = { status: 'error', message: `Unknown operation: ${operation}` };
        logResponse(400, errorResponse);
        return res.status(400).json(errorResponse);
    }
  } catch (error) {
    logError(error, { endpoint: '/api/admin/operations', operation });
    const errorResponse = {
      status: 'error',
      message: error.message,
      timestamp: new Date().toISOString(),
    };
    logResponse(500, errorResponse);
    return res.status(500).json(errorResponse);
  }
}

async function handleStatus(res) {
  logDatabase('OPERATION', 'system', { operation: 'status', action: 'start' });
  
  const tables = ['projects', 'skills', 'experience', 'education', 'case_studies', 'achievements'];
  const status = [];

  for (const table of tables) {
    try {
      logDatabase('SELECT', table, { action: 'check_exists' });
      
      const exists = await sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = ${table}
        )
      `;
      
      if (exists[0].exists) {
        const count = await sql`SELECT COUNT(*) FROM ${sql(table)}`;
        const recordCount = parseInt(count[0].count);
        
        logDatabase('SELECT', table, { 
          action: 'count_records',
          records: recordCount
        });

        status.push({
          table,
          exists: true,
          records: recordCount
        });
      } else {
        logDatabase('SELECT', table, { action: 'not_found' });
        status.push({ table, exists: false, records: 0 });
      }
    } catch (error) {
      logError(error, { table, operation: 'status' });
      status.push({ table, exists: false, records: 0, error: error.message });
    }
  }

  const response = {
    status: 'success',
    tables: status,
    timestamp: new Date().toISOString(),
  };

  logDatabase('OPERATION', 'system', { 
    operation: 'status', 
    action: 'complete',
    tablesChecked: tables.length
  });

  logResponse(200, response);
  return res.status(200).json(response);
}

async function handleCreateDB(res) {
  logDatabase('OPERATION', 'system', { operation: 'createdb', action: 'start' });
  
  // Check if tables already exist
  const existing = await sql`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name IN ('projects', 'skills', 'experience', 'education', 'case_studies', 'achievements')
  `;

  if (existing.length > 0) {
    logDatabase('CREATE', 'tables', { 
      action: 'failed',
      reason: 'tables_already_exist',
      existingTables: existing.map(t => t.table_name)
    });

    const errorResponse = {
      status: 'error',
      message: `Tables already exist: ${existing.map(t => t.table_name).join(', ')}. Use deleteDB first.`,
      existingTables: existing.map(t => t.table_name),
      timestamp: new Date().toISOString(),
    };
    logResponse(400, errorResponse);
    return res.status(400).json(errorResponse);
  }

  // Create tables
  const tablesToCreate = [
    { name: 'projects', schema: `CREATE TABLE IF NOT EXISTS projects (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      image TEXT,
      tech_stack JSONB,
      metrics TEXT,
      live_url TEXT,
      github_url TEXT,
      case_study_slug TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )` },
    { name: 'skills', schema: `CREATE TABLE IF NOT EXISTS skills (
      id SERIAL PRIMARY KEY,
      category TEXT NOT NULL,
      name TEXT NOT NULL,
      icon TEXT,
      skill_data JSONB,
      created_at TIMESTAMP DEFAULT NOW()
    )` },
    { name: 'experience', schema: `CREATE TABLE IF NOT EXISTS experience (
      id SERIAL PRIMARY KEY,
      company TEXT NOT NULL,
      position TEXT NOT NULL,
      duration TEXT,
      location TEXT,
      description TEXT,
      achievements JSONB,
      created_at TIMESTAMP DEFAULT NOW()
    )` },
    { name: 'education', schema: `CREATE TABLE IF NOT EXISTS education (
      id SERIAL PRIMARY KEY,
      degree TEXT NOT NULL,
      institution TEXT NOT NULL,
      year TEXT,
      description TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )` },
    { name: 'case_studies', schema: `CREATE TABLE IF NOT EXISTS case_studies (
      id SERIAL PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      content JSONB,
      created_at TIMESTAMP DEFAULT NOW()
    )` },
    { name: 'achievements', schema: `CREATE TABLE IF NOT EXISTS achievements (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      date TEXT,
      icon TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )` },
  ];

  for (const table of tablesToCreate) {
    logDatabase('CREATE', table.name, { action: 'creating' });
    await sql.unsafe(table.schema);
    logDatabase('CREATE', table.name, { action: 'created' });
  }

  const response = {
    status: 'success',
    message: 'Database tables created successfully',
    tables: tablesToCreate.map(t => t.name),
    timestamp: new Date().toISOString(),
  };

  logDatabase('OPERATION', 'system', { 
    operation: 'createdb', 
    action: 'complete',
    tablesCreated: tablesToCreate.length
  });

  logResponse(200, response);
  return res.status(200).json(response);
}

async function handleDeleteDB(res) {
  logDatabase('OPERATION', 'system', { operation: 'deletedb', action: 'start' });
  
  const tables = ['projects', 'skills', 'experience', 'education', 'case_studies', 'achievements'];
  const dropped = [];

  for (const table of tables) {
    try {
      logDatabase('DROP', table, { action: 'dropping' });
      await sql`DROP TABLE IF EXISTS ${sql(table)} CASCADE`;
      logDatabase('DROP', table, { action: 'dropped' });
      dropped.push(table);
    } catch (error) {
      logError(error, { table, operation: 'deletedb' });
    }
  }

  const response = {
    status: 'success',
    message: 'Database tables deleted successfully',
    droppedTables: dropped,
    timestamp: new Date().toISOString(),
  };

  logDatabase('OPERATION', 'system', { 
    operation: 'deletedb', 
    action: 'complete',
    tablesDropped: dropped.length
  });

  logResponse(200, response);
  return res.status(200).json(response);
}

async function handlePumpData(res) {
  logDatabase('OPERATION', 'system', { operation: 'pumpdata', action: 'start' });
  
  // Read from frontend's public/data (bundled with the app in Vercel)
  const dataPath = path.join(process.cwd(), 'public/data');
  let imported = {};

  // Import projects
  try {
    logDatabase('INSERT', 'projects', { action: 'reading_file' });
    const projectsData = JSON.parse(fs.readFileSync(path.join(dataPath, 'projects.json'), 'utf8'));
    
    let insertCount = 0;
    for (const project of projectsData) {
      await sql`
        INSERT INTO projects (title, description, image, tech_stack, metrics, live_url, github_url, case_study_slug)
        VALUES (
          ${project.title},
          ${project.description},
          ${project.image},
          ${JSON.stringify(project.techStack)},
          ${project.metrics || null},
          ${project.liveUrl || null},
          ${project.githubUrl || null},
          ${project.caseStudySlug || null}
        )
      `;
      insertCount++;
    }
    
    logDatabase('INSERT', 'projects', { 
      action: 'complete',
      records: insertCount
    });
    imported.projects = insertCount;
  } catch (error) {
    logError(error, { table: 'projects', operation: 'pumpdata' });
    imported.projects = { error: error.message };
  }

  // Import skills
  try {
    logDatabase('INSERT', 'skills', { action: 'reading_file' });
    const skillsData = JSON.parse(fs.readFileSync(path.join(dataPath, 'skills.json'), 'utf8'));
    let skillCount = 0;
    for (const [category, data] of Object.entries(skillsData)) {
      await sql`
        INSERT INTO skills (category, name, icon, skill_data)
        VALUES (
          ${category},
          ${data.name},
          ${data.icon || null},
          ${JSON.stringify(data.skills)}
        )
      `;
      skillCount++;
    }
    logDatabase('INSERT', 'skills', { 
      action: 'complete',
      records: skillCount
    });
    imported.skills = skillCount;
  } catch (error) {
    logError(error, { table: 'skills', operation: 'pumpdata' });
    imported.skills = { error: error.message };
  }

  // Import experience
  try {
    logDatabase('INSERT', 'experience', { action: 'reading_file' });
    const experienceData = JSON.parse(fs.readFileSync(path.join(dataPath, 'experience.json'), 'utf8'));
    let expCount = 0;
    for (const exp of experienceData) {
      await sql`
        INSERT INTO experience (company, position, duration, location, description, achievements)
        VALUES (
          ${exp.company},
          ${exp.position},
          ${exp.duration || null},
          ${exp.location || null},
          ${exp.description || null},
          ${JSON.stringify(exp.achievements || [])}
        )
      `;
      expCount++;
    }
    logDatabase('INSERT', 'experience', { 
      action: 'complete',
      records: expCount
    });
    imported.experience = expCount;
  } catch (error) {
    logError(error, { table: 'experience', operation: 'pumpdata' });
    imported.experience = { error: error.message };
  }

  // Import education
  try {
    logDatabase('INSERT', 'education', { action: 'reading_file' });
    const educationData = JSON.parse(fs.readFileSync(path.join(dataPath, 'education.json'), 'utf8'));
    let eduCount = 0;
    for (const edu of educationData) {
      await sql`
        INSERT INTO education (degree, institution, year, description)
        VALUES (
          ${edu.degree},
          ${edu.institution},
          ${edu.year || null},
          ${edu.description || null}
        )
      `;
      eduCount++;
    }
    logDatabase('INSERT', 'education', { 
      action: 'complete',
      records: eduCount
    });
    imported.education = eduCount;
  } catch (error) {
    logError(error, { table: 'education', operation: 'pumpdata' });
    imported.education = { error: error.message };
  }

  // Import achievements
  try {
    logDatabase('INSERT', 'achievements', { action: 'reading_file' });
    const achievementsData = JSON.parse(fs.readFileSync(path.join(dataPath, 'achievements.json'), 'utf8'));
    let achCount = 0;
    for (const achievement of achievementsData) {
      await sql`
        INSERT INTO achievements (title, description, date, icon)
        VALUES (
          ${achievement.title},
          ${achievement.description || null},
          ${achievement.date || null},
          ${achievement.icon || null}
        )
      `;
      achCount++;
    }
    logDatabase('INSERT', 'achievements', { 
      action: 'complete',
      records: achCount
    });
    imported.achievements = achCount;
  } catch (error) {
    logError(error, { table: 'achievements', operation: 'pumpdata' });
    imported.achievements = { error: error.message };
  }

  const response = {
    status: 'success',
    message: 'Data imported successfully',
    imported,
    timestamp: new Date().toISOString(),
  };

  logDatabase('OPERATION', 'system', { 
    operation: 'pumpdata', 
    action: 'complete',
    imported
  });

  logResponse(200, response);
  return res.status(200).json(response);
}
