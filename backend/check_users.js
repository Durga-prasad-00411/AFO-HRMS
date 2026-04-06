const mysql = require('mysql2/promise');

async function check() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'hrms_db'
  });

  const [users] = await connection.query('SELECT u.id, u.username, u.email, r.role_name FROM users u LEFT JOIN roles r ON u.role_id = r.id');
  require('fs').writeFileSync('users_debug.json', JSON.stringify(users, null, 2));

  console.log('done');
  process.exit(0);
}

check();
