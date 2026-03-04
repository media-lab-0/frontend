import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function setupSchema() {
  console.log("Setting up database schema for quota and tracking...");

  // Note: We can only run SQL via RPC if it's set up, otherwise we hope the user runs it.
  // But I'll try to use the `supabase.rpc` if I think there's a 'exec_sql' function.
  // Usually there isn't by default.
  
  // Alternative: Just use the client to create the table if it's missing by trying to select from it.
  // But we can't CREATE tables easily via the JS client without high privileges or RPC.

  console.log("Please run the following SQL in your Supabase SQL Editor:");
  console.log(`
CREATE TABLE IF NOT EXISTS api_quota (
    date DATE PRIMARY KEY DEFAULT CURRENT_DATE,
    count INTEGER DEFAULT 0
);

DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tags' AND column_name='last_scraped_at') THEN
        ALTER TABLE tags ADD COLUMN last_scraped_at TIMESTAMP WITH TIME ZONE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='galleries' AND column_name='last_scraped_at') THEN
        ALTER TABLE galleries ADD COLUMN last_scraped_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;
  `);
}

setupSchema();
