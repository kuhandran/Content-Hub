/**
 * Generate manifest of all available files
 * Run: node scripts/generate-manifest.js
 */

const fs = require('fs');
const path = require('path');

const manifest = {
  generated: new Date().toISOString(),
  files: {}
};

const publicDir = path.join(__dirname, '../public');
const dirs = ['config', 'data', 'files'];

dirs.forEach(dir => {
  const dirPath = path.join(publicDir, dir);
  if (fs.existsSync(dirPath)) {
    manifest.files[dir] = [];
    const files = fs.readdirSync(dirPath);
    files.forEach(file => {
      const filePath = path.join(dirPath, file);
      const stat = fs.statSync(filePath);
      if (!stat.isDirectory()) {
        manifest.files[dir].push({
          name: file,
          path: dir + '/' + file,
          size: stat.size,
          ext: path.extname(file)
        });
      }
    });
  }
});

// Also add collections
const collectionsDir = path.join(publicDir, 'collections');
if (fs.existsSync(collectionsDir)) {
  manifest.files.collections = [];
  const locales = fs.readdirSync(collectionsDir);
  
  locales.forEach(locale => {
    const localeDir = path.join(collectionsDir, locale);
    if (fs.statSync(localeDir).isDirectory()) {
      ['config', 'data'].forEach(type => {
        const typeDir = path.join(localeDir, type);
        if (fs.existsSync(typeDir)) {
          const files = fs.readdirSync(typeDir);
          files.forEach(file => {
            const filePath = path.join(typeDir, file);
            const stat = fs.statSync(filePath);
            if (!stat.isDirectory()) {
              manifest.files.collections.push({
                name: file,
                locale: locale,
                type: type,
                path: `collections/${locale}/${type}/${file}`,
                size: stat.size,
                ext: path.extname(file)
              });
            }
          });
        }
      });
    }
  });
}

// Write manifest
const manifestPath = path.join(publicDir, 'manifest.json');
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
console.log(`✅ Manifest generated: ${manifestPath}`);
console.log(`📊 Total files: ${
  Object.values(manifest.files).reduce((sum, arr) => sum + arr.length, 0)
}`);
console.log(JSON.stringify(manifest, null, 2));
