const fs = require('fs');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: 'backend/.env' });

async function run() {
  const content = fs.readFileSync('database_queries.sql', 'utf8');
  if (!content.includes('CREATE TABLE notifications')) {
    const tableSql = `
-- Notifications Table
CREATE TABLE notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
`;
    fs.appendFileSync('database_queries.sql', tableSql);
    console.log('Added to database_queries.sql');
  }

  const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        is_read TINYINT(1) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);
    console.log('Notifications table created successfully.');
  } catch(e) {
    console.error('Error creating table:', e);
  } finally {
    await pool.end();
  }
}

run();
