const { sql } = require('../db');

module.exports = async (req, res) => {
  // Add simple protection so others can't easily spam or wipe the database
  const { key } = req.query;
  const SECRET_KEY = process.env.SETUP_SECRET || 'initialize';
  
  if (key !== SECRET_KEY) {
    return res.status(403).json({ error: 'Forbidden. Access requires the correct setup key query parameter (?key=...).' });
  }

  try {
    // 1. Create nominations table
    await sql`
      CREATE TABLE IF NOT EXISTS nominations (
        id VARCHAR(50) PRIMARY KEY,
        date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        has_leo_id VARCHAR(10),
        leo_id VARCHAR(50),
        full_name VARCHAR(255),
        contact_no VARCHAR(50),
        email_id VARCHAR(255),
        current_position VARCHAR(255),
        position_applying_for VARCHAR(255),
        position_value VARCHAR(100),
        fee VARCHAR(50),
        transaction_code VARCHAR(100),
        cover_letter_url TEXT,
        past_experience TEXT,
        areas_of_interest TEXT,
        future_plans TEXT,
        formal_photo_url TEXT,
        signature_url TEXT,
        citizenship_url TEXT,
        dues_receipt_url TEXT,
        nomination_receipt_url TEXT,
        status VARCHAR(50) DEFAULT 'Pending',
        tenure VARCHAR(100)
      );
    `;

    // Ensure tenure column exists in existing deployments
    await sql`
      ALTER TABLE nominations ADD COLUMN IF NOT EXISTS tenure VARCHAR(100);
    `;

    // 2. Create members table
    await sql`
      CREATE TABLE IF NOT EXISTS members (
        leo_id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255),
        position VARCHAR(255),
        email VARCHAR(255),
        contact VARCHAR(50),
        dues_paid BOOLEAN DEFAULT FALSE
      );
    `;

    // 3. Create settings table
    await sql`
      CREATE TABLE IF NOT EXISTS settings (
        key VARCHAR(50) PRIMARY KEY,
        value TEXT
      );
    `;

    // 4. Create menu_items table
    await sql`
      CREATE TABLE IF NOT EXISTS menu_items (
        id SERIAL PRIMARY KEY,
        title VARCHAR(100) NOT NULL,
        url VARCHAR(255) NOT NULL,
        parent_id INTEGER DEFAULT NULL,
        position_order INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE
      );
    `;

    // 5. Create pages table for dynamic content
    await sql`
      CREATE TABLE IF NOT EXISTS pages (
        slug VARCHAR(100) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        html_content TEXT,
        last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // 6. Create projects table
    await sql`
      CREATE TABLE IF NOT EXISTS projects (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        date VARCHAR(100),
        description TEXT,
        category VARCHAR(100),
        status VARCHAR(50),
        image_url TEXT,
        is_signature BOOLEAN DEFAULT FALSE,
        details TEXT,
        objectives TEXT,
        location VARCHAR(255),
        date_from VARCHAR(100),
        date_to VARCHAR(100),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // Ensure new columns exist for existing projects
    await sql`ALTER TABLE projects ADD COLUMN IF NOT EXISTS location VARCHAR(255);`;
    await sql`ALTER TABLE projects ADD COLUMN IF NOT EXISTS date_from VARCHAR(100);`;
    await sql`ALTER TABLE projects ADD COLUMN IF NOT EXISTS date_to VARCHAR(100);`;

    // 7. Create events table
    await sql`
      CREATE TABLE IF NOT EXISTS events (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        date VARCHAR(100),
        location VARCHAR(255),
        description TEXT,
        image_url TEXT,
        status VARCHAR(50),
        time VARCHAR(100),
        category VARCHAR(100),
        details TEXT,
        objectives TEXT,
        contact_info TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // Ensure new columns exist for existing events
    await sql`ALTER TABLE events ADD COLUMN IF NOT EXISTS time VARCHAR(100);`;
    await sql`ALTER TABLE events ADD COLUMN IF NOT EXISTS category VARCHAR(100);`;
    await sql`ALTER TABLE events ADD COLUMN IF NOT EXISTS details TEXT;`;
    await sql`ALTER TABLE events ADD COLUMN IF NOT EXISTS objectives TEXT;`;
    await sql`ALTER TABLE events ADD COLUMN IF NOT EXISTS contact_info TEXT;`;

    // 8. Create sliders table
    await sql`
      CREATE TABLE IF NOT EXISTS sliders (
        id SERIAL PRIMARY KEY,
        image_url TEXT NOT NULL,
        title VARCHAR(255),
        tagline VARCHAR(255),
        btn1_text VARCHAR(100),
        btn1_url VARCHAR(255),
        btn2_text VARCHAR(100),
        btn2_url VARCHAR(255),
        position_order INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // Seed default settings if not exists
    await sql`
      INSERT INTO settings (key, value)
      VALUES ('leoNominationDeadline', '2026-06-17T23:59')
      ON CONFLICT (key) DO NOTHING;
    `;
    await sql`
      INSERT INTO settings (key, value)
      VALUES ('leoNominationTenure', 'L.Y. 2025/26')
      ON CONFLICT (key) DO NOTHING;
    `;

    // Seed default members from data.js if table is empty
    const membersCheck = await sql`SELECT COUNT(*) FROM members;`;
    const count = parseInt(membersCheck.rows[0].count || '0');
    if (count === 0) {
      const defaultMembers = [
        { id: "5823198", name: "Leo Nishant Kumar", position: "Immediate Past President", email: "royalnishantm65@gmail.com", contact: "9807895615", duesPaid: true },
        { id: "6147083", name: "Leo Sujaya Shrestha", position: "Club President", email: "sujay9992@gmail.com", contact: "9803471706", duesPaid: true },
        { id: "6265119", name: "Leo Barsha Shrestha", position: "Vice President", email: "shresthabarsa07@gmail.com", contact: "9843062422", duesPaid: true },
        { id: "27023774", name: "Leo Prapti Dhodari", position: "Vice President", email: "praptidhodari13@gmail.com", contact: "9816259520", duesPaid: true },
        { id: "5994629", name: "Leo Sonika Giri", position: "Secretary", email: "sonikawork2023@gmail.com", contact: "9813036135", duesPaid: true },
        { id: "27021954", name: "Leo Pratyush Adhikari", position: "Joint Secretary", email: "pratyushadhikari785@gmail.com", contact: "9860171501", duesPaid: true },
        { id: "27023916", name: "Leo Piyush Raj", position: "Treasurer", email: "praj887857@gmail.com", contact: "9829955290", duesPaid: true },
        { id: "27023842", name: "Leo Sujana Mulmi", position: "Joint Treasurer", email: "sujanaaa570@gmail.com", contact: "9863020227", duesPaid: true },
        { id: "26854047", name: "Leo Arpit Shrestha", position: "I.T. & Media Coordinator", email: "sthaarpit@gmail.com", contact: "9841996290", duesPaid: true },
        { id: "27005899", name: "Leo Bibek Ratna Shakya", position: "Tail Twister", email: "shakyabibekratnashakya1999@gmail.com", contact: "9869178178", duesPaid: true },
        { id: "26854126", name: "Leo Shraddha Ghimire", position: "Tamer", email: "shraddhaghimire98@gmail.com", contact: "9847388734", duesPaid: true },
        { id: "5155611", name: "Leo Kashish Dahal", position: "Strategic Director", email: "dahalkashish@gmail.com", contact: "9803457953", duesPaid: true },
        { id: "5945200", name: "Leo Prashansha Shrestha", position: "Executive Director", email: "Prashanshas123@gmail.com", contact: "9843818467", duesPaid: true },
        { id: "26854117", name: "Leo Tikaram Khatri", position: "Public Relation Officer", email: "tikaramk200@gmail.com", contact: "9800568785", duesPaid: true },
        { id: "6265169", name: "Leo Anjali Bishwakarma", position: "Committee Chairperson", email: "anjalibaraili0@gmail.com", contact: "9800993403", duesPaid: true },
        { id: "26854111", name: "Leo Shishir Giri", position: "Sports Chairperson", email: "shishirgiri435@gmail.com", contact: "9810885567", duesPaid: true },
        { id: "5994652", name: "Leo Pratistha Shrestha", position: "Club Coordinator", email: "pratiistha145@gmail.com", contact: "9818606813", duesPaid: true },
        { id: "5994669", name: "Leo Suraj Dulal", position: "Youth Empowerment Committee", email: "surazdulal@gmail.com", contact: "9823776605", duesPaid: true },
        { id: "6265166", name: "Leo Dikchhya Rauniyar", position: "Signature Project Coordinator", email: "rauniyardikchhya@gmail.com", contact: "9843820573", duesPaid: true }
      ];

      for (const m of defaultMembers) {
        await sql`
          INSERT INTO members (leo_id, name, position, email, contact, dues_paid)
          VALUES (${m.id}, ${m.name}, ${m.position}, ${m.email}, ${m.contact}, ${m.duesPaid})
          ON CONFLICT (leo_id) DO NOTHING;
        `;
      }
    }

    return res.status(200).json({ success: true, message: 'Database tables initialized and default settings/members seeded successfully!' });
  } catch (error) {
    console.error('Setup error:', error);
    return res.status(500).json({ error: error.message });
  }
};
