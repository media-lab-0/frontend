import { sql } from './db';

export async function getRemainingQuota() {
  const today = new Date().toISOString().split('T')[0];
  try {
    const result = await sql`
      SELECT count FROM api_quota WHERE date = ${today}
    `;
    
    const count = result[0]?.count || 0;
    return Math.max(0, 1000 - count);
  } catch (err) {
    console.error("Error fetching quota:", err);
    return 0; // Better to fail safe (stop API calls) if DB is down
  }
}

export async function checkQuota() {
  const remaining = await getRemainingQuota();
  return remaining > 0;
}

export async function incrementQuota() {
  const today = new Date().toISOString().split('T')[0];

  try {
    await sql`
      INSERT INTO api_quota (date, count)
      VALUES (${today}, 1)
      ON CONFLICT (date) DO UPDATE SET count = api_quota.count + 1
    `;
  } catch (err) {
    console.error("Error incrementing quota:", err);
  }
}
