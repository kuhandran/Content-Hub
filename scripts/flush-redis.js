const redis = require('redis');

const redisUrl = process.env.REDIS_URL || 'redis://default:7qqVS3b9pHULdelwly3uY1QFk7hNYBwx@redis-19930.c232.us-east-1-2.ec2.cloud.redislabs.com:19930';

const client = redis.createClient({
  url: redisUrl,
});

client.on('error', (err) => {
  console.error('Redis client error:', err);
  process.exit(1);
});

client.on('connect', async () => {
  try {
    console.log('Connected to Redis');
    console.log('Flushing all data...');
    await client.flushAll();
    console.log('✓ All Redis data cleared successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error flushing Redis:', error);
    process.exit(1);
  }
});

client.connect();
