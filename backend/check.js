const { sql } = require('@vercel/postgres'); sql\SELECT column_name FROM information_schema.columns WHERE table_name = 'projects';\.then(r => console.log(r.rows)).catch(console.error);
