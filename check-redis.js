const { createClient } = require('redis');
require('dotenv').config();

async function check() {
  try {
    const redis = createClient({ url: process.env.REDIS_URL });
    await redis.connect();
    console.log('Connected to Redis');
    
    // Check config files
    const configKeys = await redis.keys('cms:config:*');
    console.log('\nConfig files in Redis:');
    configKeys.forEach(key => console.log('  -', key));
    
    // Get one file to verify
    const content = await redis.get('cms:config:languages.json');
    if (content) {
      console.log('\n✅ languages.json exists in Redis');
      console.log('Size:', content.length, 'bytes');
      console.log('Preview:', content.substring(0, 50) + '...');
    } else {
      console.log('\n❌ languages.json NOT in Redis');
    }
    
    await redis.quit();
  } catch (e) {
    console.error('Error:', e.message);
  }
}

check();
