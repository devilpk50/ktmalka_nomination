const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });
const { sql } = require('./db');

async function run() {
    try {
        await sql`ALTER TABLE events ADD COLUMN IF NOT EXISTS time VARCHAR(100);`;
        await sql`ALTER TABLE events ADD COLUMN IF NOT EXISTS category VARCHAR(100);`;
        await sql`ALTER TABLE events ADD COLUMN IF NOT EXISTS details TEXT;`;
        await sql`ALTER TABLE events ADD COLUMN IF NOT EXISTS objectives TEXT;`;
        await sql`ALTER TABLE events ADD COLUMN IF NOT EXISTS contact_info TEXT;`;
        console.log('Migration successful');
    } catch(e) {
        console.error(e);
    }
}
run();
