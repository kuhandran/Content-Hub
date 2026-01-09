import sql from '../../../lib/db';
import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      status: 'error',
      message: 'Method not allowed. Use POST.' 
    });
  }

  const { operation } = req.body;

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
        return res.status(400).json({
          status: 'error',
          message: `Unknown operation: ${operation}`
        });
    }
  } catch (error) {
    console.error('Operation error:', error);
    return res.status(500).json({
      status: 'error',
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  }
}

async function handleStatus(res) {
  const tables = ['projects', 'skills', 'experience', 'education', 'case_studies', 'achievements'];
  const status = [];

  for (const table of tables) {
    try {
      const exists = await sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = ${table}
        )
      `;
      
      if (exists[0].exists) {
        const count = await sql`SELECT COUNT(*) FROM ${sql(table)}`;
        status.push({
          table,
          exists: true,
          records: parseInt(count[0].count)
        });
      } else {
        status.push({ table, exists: false, records: 0 });
      }
    } catch (error) {
      status.push({ table, exists: false, records: 0, error: error.message });
    }
  }

  return res.status(200).json({
    status: 'success',
    tables: status,
    timestamp: new Date().toISOString(),
  });
}

async function handleCreateDB(res) {
  // Check if tables already exist
  const existing = await sql`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name IN ('projects', 'skills', 'experience', 'education', 'case_studies', 'achievements')
  `;

  if (existing.length > 0) {
    return res.status(400).json({
      status: 'error',
      message: `Tables already exist: ${existing.map(t => t.table_name).join(', ')}. Use deleteDB first.`,
      existingTables: existing.map(t => t.table_name),
      timestamp: new Date().toISOString(),
    });
  }

  // Create tables
  await sql`
    CREATE TABLE IF NOT EXISTS projects (
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
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS skills (
      id SERIAL PRIMARY KEY,
      category TEXT NOT NULL,
      name TEXT NOT NULL,
      icon TEXT,
      skill_data JSONB,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS experience (
      id SERIAL PRIMARY KEY,
      company TEXT NOT NULL,
      position TEXT NOT NULL,
      duration TEXT,
      location TEXT,
      description TEXT,
      achievements JSONB,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS education (
      id SERIAL PRIMARY KEY,
      degree TEXT NOT NULL,
      institution TEXT NOT NULL,
      year TEXT,
      description TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS case_studies (
      id SERIAL PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      content JSONB,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS achievements (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      date TEXT,
      icon TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

  return res.status(200).json({
    status: 'success',
    message: 'Database tables created successfully',
    tables: ['projects', 'skills', 'experience', 'education', 'case_studies', 'achievements'],
    timestamp: new Date().toISOString(),
  });
}

async function handleDeleteDB(res) {
  const tables = ['projects', 'skills', 'experience', 'education', 'case_studies', 'achievements'];
  const dropped = [];

  for (const table of tables) {
    try {
      await sql`DROP TABLE IF EXISTS ${sql(table)} CASCADE`;
      dropped.push(table);
    } catch (error) {
      console.error(`Error dropping ${table}:`, error);
    }
  }

  return res.status(200).json({
    status: 'success',
    message: 'Database tables deleted successfully',
    droppedTables: dropped,
    timestamp: new Date().toISOString(),
  });
}

async function handlePumpData(res) {
  const dataPath = path.join(process.cwd(), '../../public/data');
  let imported = {};

  // Import projects
  try {
    const projectsData = JSON.parse(fs.readFileSync(path.join(dataPath, 'projects.json'), 'utf8'));
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
    }
    imported.projects = projectsData.length;
  } catch (error) {
    imported.projects = { error: error.message };
  }

  // Import skills
  try {
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
    imported.skills = skillCount;
  } catch (error) {
    imported.skills = { error: error.message };
  }

  // Import experience
  try {
    const experienceData = JSON.parse(fs.readFileSync(path.join(dataPath, 'experience.json'), 'utf8'));
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
    }
    imported.experience = experienceData.length;
  } catch (error) {
    imported.experience = { error: error.message };
  }

  // Import education
  try {
    const educationData = JSON.parse(fs.readFileSync(path.join(dataPath, 'education.json'), 'utf8'));
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
    }
    imported.education = educationData.length;
  } catch (error) {
    imported.education = { error: error.message };
  }

  // Import achievements
  try {
    const achievementsData = JSON.parse(fs.readFileSync(path.join(dataPath, 'achievements.json'), 'utf8'));
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
    }
    imported.achievements = achievementsData.length;
  } catch (error) {
    imported.achievements = { error: error.message };
  }

  return res.status(200).json({
    status: 'success',
    message: 'Data imported successfully',
    imported,
    timestamp: new Date().toISOString(),
  });
}
