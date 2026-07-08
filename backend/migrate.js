const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });
const { sql } = require('@vercel/postgres');

async function run() {
    try {
        await sql`ALTER TABLE projects ADD COLUMN IF NOT EXISTS details TEXT;`;
        await sql`ALTER TABLE projects ADD COLUMN IF NOT EXISTS objectives TEXT;`;
        console.log('Migration successful');
    } catch(e) {
        console.error(e);
    }
}
run();
