const path = require('path');

const ALLOWED_EXTENSIONS = [
  '.json', '.js', '.xml', '.html', '.txt', '.pdf',
  '.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.docx'
];

const IGNORED_DIRS = ['.next', 'node_modules', '.git'];

function getPublicDir() {
  const override = process.env.PUBLIC_DIR;
  const cwd = process.cwd();
  
  // Defensive: ensure cwd is valid
  if (!cwd) {
    console.error('[sync-config] process.cwd() returned falsy:', cwd);
    return '/var/task/public'; // Vercel default
  }
  
  const result = override && override.trim() 
    ? path.resolve(override) 
    : path.join(cwd, 'public');
    
  console.log('[sync-config] getPublicDir:', { cwd, override: override || '(none)', result });
  return result;
}

function getFileExtension(filename) {
  return path.extname(filename).toLowerCase().slice(1) || 'unknown';
}

function mapFileToTable(filePath) {
  if (filePath.includes(`${path.sep}collections${path.sep}`)) {
    return { table: 'collections', fileType: 'json' };
  }
  if (filePath.includes(`${path.sep}files${path.sep}`)) {
    const ext = getFileExtension(filePath);
    return { table: 'static_files', fileType: ext };
  }
  if (filePath.includes(`${path.sep}config${path.sep}`)) {
    const ext = getFileExtension(filePath);
    return { table: 'config_files', fileType: ext };
  }
  if (filePath.includes(`${path.sep}data${path.sep}`)) {
    const ext = getFileExtension(filePath);
    return { table: 'data_files', fileType: ext };
  }
  if (filePath.includes(`${path.sep}image${path.sep}`)) {
    return { table: 'images', fileType: getFileExtension(filePath) };
  }
  if (filePath.includes(`${path.sep}js${path.sep}`)) {
    return { table: 'javascript_files', fileType: 'js' };
  }
  if (filePath.includes(`${path.sep}resume${path.sep}`)) {
    return { table: 'resumes', fileType: getFileExtension(filePath) };
  }
  return { table: 'unknown', fileType: getFileExtension(filePath) };
}

module.exports = {
  ALLOWED_EXTENSIONS,
  IGNORED_DIRS,
  getPublicDir,
  getFileExtension,
  mapFileToTable,
};
