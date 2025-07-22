// Simple Node.js test of SQLite connection
const sqlite3 = require('sqlite3');
const path = require('path');

console.log('🧪 Testing SQLite database connection...');

const dbPath = './ellens_dev.db';
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ SQLite connection failed:', err);
    process.exit(1);
  }
  
  console.log('✅ SQLite connected successfully');
  
  // Test basic query
  db.run(`CREATE TABLE IF NOT EXISTS test_sessions (
    id TEXT PRIMARY KEY,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`, (err) => {
    if (err) {
      console.error('❌ Table creation failed:', err);
    } else {
      console.log('✅ Table created successfully');
      
      // Test insert and select
      db.run(`INSERT INTO test_sessions (id) VALUES (?)`, ['test-session-' + Date.now()], function(err) {
        if (err) {
          console.error('❌ Insert failed:', err);
        } else {
          console.log('✅ Insert successful, ID:', this.lastID);
          
          db.all(`SELECT * FROM test_sessions LIMIT 5`, (err, rows) => {
            if (err) {
              console.error('❌ Select failed:', err);
            } else {
              console.log('✅ Select successful, rows:', rows.length);
              console.log('🎉 Database connection fix verified!');
            }
            
            db.close();
            process.exit(0);
          });
        }
      });
    }
  });
});