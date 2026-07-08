const { neon } = require('@neondatabase/serverless');

// We use { fullResults: true } so the returned object matches the structure 
// of ./db ({ rows, rowCount, fields }) rather than just returning an array of rows.
const sql = neon(process.env.POSTGRES_URL || process.env.DATABASE_URL, { fullResults: true });

module.exports = { sql };
