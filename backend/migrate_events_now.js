require('dotenv').config();
const { sql } = require('@vercel/postgres');

async function migrate() {
    try {
        console.log('Starting migration...');
        await sql`
            ALTER TABLE events 
            ADD COLUMN IF NOT EXISTS time VARCHAR(255),
            ADD COLUMN IF NOT EXISTS category VARCHAR(255),
            ADD COLUMN IF NOT EXISTS details TEXT,
            ADD COLUMN IF NOT EXISTS objectives TEXT,
            ADD COLUMN IF NOT EXISTS contact_info TEXT
        `;
        console.log('Migration completed successfully!');
    } catch (err) {
        console.error('Migration failed:', err);
    }
}

migrate();
