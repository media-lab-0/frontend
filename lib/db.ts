
import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL!;

// Direct database connection via session pooler
// Bypasses the failing REST API (PostgREST)
export const sql = postgres(connectionString, {
  ssl: 'require',
  max: 10,
  idle_timeout: 20,
  connect_timeout: 30, // 30 seconds to be safe
});
