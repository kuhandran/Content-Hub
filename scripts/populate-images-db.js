const postgres = require('postgres');
const fs = require('fs');
const path = require('path');

(async () => {
  try {
    const connString = 'postgresql://postgres.dcsgwbufhwvcxpkdntve:HxwaTJlKzMXzb3qZ@aws-1-us-west-1.pooler.supabase.com:6543/postgres?sslmode=require';
    const sql = postgres(connString);

    const imageDir = path.join(process.cwd(), 'public', 'image');
    const files = fs.readdirSync(imageDir);
    
    let count = 0;
    for (const filename of files) {
      const ext = path.extname(filename).toLowerCase();
      if (!['.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg', '.bmp'].includes(ext)) {
        continue;
      }

      const filePath = path.join(imageDir, filename);
      const imageContent = fs.readFileSync(filePath);
      
      // Delete existing first
      await sql`DELETE FROM images WHERE filename = ${filename}`;
      
      // Insert
      await sql`
        INSERT INTO images (filename, file_path, image_content)
        VALUES (${filename}, ${'/' + filename}, ${imageContent})
      `;
      
      console.log(`✅ Stored ${filename} (${imageContent.length} bytes)`);
      count++;
    }

    console.log(`\n✅ Stored ${count} images in database`);
    await sql.end();
    process.exit(0);
  } catch (e) {
    console.error('❌ Error:', e.message);
    process.exit(1);
  }
})();
