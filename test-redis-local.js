const { createClient } = require('redis');
require('dotenv').config();

async function test() {
  const redis = createClient({ url: process.env.REDIS_URL });
  await redis.connect();
  
  // Try to get the config file
  const key = 'cms:config:languages.json';
  const content = await redis.get(key);
  
  if (content) {
    console.log('✅ Found:', key);
    console.log('Content preview:', content.substring(0, 100));
  } else {
    console.log('❌ Not found:', key);
    
    // List all keys starting with cms:config:
    const keys = await redis.keys('cms:config:*');
    console.log('\nAvailable config keys:', keys);
  }
  
  await redis.quit();
}

test().catch(console.error);
