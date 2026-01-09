import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.warn('⚠️  DATABASE_URL not found - database operations will fail');
}

// Transaction pooler connection (serverless-friendly)
const sql = postgres(connectionString, {
  max: 1, // Limit connection pool for serverless
  idle_timeout: 20,
  connect_timeout: 10,
});

export default sql;
