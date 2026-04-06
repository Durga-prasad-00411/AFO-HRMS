require('dotenv').config();
const mysql = require('mysql2/promise');

async function runMigrations() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        multipleStatements: true
    });

    console.log("Connected to the database. Running migrations for leave_requests & leave_types...");

    try {
        // Create tables if not exist
        await connection.query(`
            CREATE TABLE IF NOT EXISTS leave_types (
                id INT AUTO_INCREMENT PRIMARY KEY,
                leave_name VARCHAR(255) NOT NULL UNIQUE,
                leave_type VARCHAR(100) DEFAULT 'Paid',
                description TEXT,
                max_days INT DEFAULT 0,
                status VARCHAR(50) DEFAULT 'Active',
                monthly_accrual DECIMAL(4,2) DEFAULT 0,
                carry_forward BOOLEAN DEFAULT FALSE
            );
        `);
        console.log("leave_types table verified/created.");

        await connection.query(`
            CREATE TABLE IF NOT EXISTS leave_requests (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                start_date DATE NOT NULL,
                end_date DATE NOT NULL,
                leave_type VARCHAR(100),
                status VARCHAR(50) DEFAULT 'PENDING',
                reason TEXT,
                updated_by INT,
                updated_by_role_id INT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id)
            );
        `);
        console.log("leave_requests table verified/created.");

        // Alter tables (ignore duplicate column errors safely using catch block per statement)
        try {
            await connection.query(`ALTER TABLE leave_types ADD COLUMN monthly_accrual DECIMAL(4,2) DEFAULT 0;`);
        } catch (e) {}

        try {
            await connection.query(`ALTER TABLE leave_types ADD COLUMN carry_forward BOOLEAN DEFAULT FALSE;`);
        } catch (e) {}

        try {
            await connection.query(`ALTER TABLE leave_requests ADD COLUMN updated_by INT;`);
        } catch (e) {}

        try {
            await connection.query(`ALTER TABLE leave_requests ADD COLUMN updated_by_role_id INT;`);
        } catch (e) {}

        console.log("Migrations for Leave Management completed successfully.");
    } catch (error) {
        console.error("Migration Error:", error);
    } finally {
        await connection.end();
    }
}

runMigrations();
