const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { app } = require('electron');

class DatabaseManager {
  constructor() {
    const userDataPath = app.getPath('userData');
    this.dbPath = path.join(userDataPath, 'youngellens.db');
    this.db = null;
    this.init();
  }

  init() {
    this.db = new sqlite3.Database(this.dbPath, (err) => {
      if (err) {
        console.error('Error opening database:', err);
      } else {
        console.log('Connected to SQLite database');
        this.createTables();
      }
    });
  }

  createTables() {
    const createMessagesTable = `
      CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        text TEXT NOT NULL,
        sender TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        session_id TEXT DEFAULT 'default'
      )
    `;

    const createSettingsTable = `
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      )
    `;

    this.db.run(createMessagesTable);
    this.db.run(createSettingsTable);
  }

  async getMessages(sessionId = 'default') {
    return new Promise((resolve, reject) => {
      this.db.all(
        'SELECT * FROM messages WHERE session_id = ? ORDER BY timestamp ASC',
        [sessionId],
        (err, rows) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows);
          }
        }
      );
    });
  }

  async saveMessage(message) {
    return new Promise((resolve, reject) => {
      const { text, sender, timestamp, sessionId = 'default' } = message;
      this.db.run(
        'INSERT INTO messages (text, sender, timestamp, session_id) VALUES (?, ?, ?, ?)',
        [text, sender, timestamp, sessionId],
        function(err) {
          if (err) {
            reject(err);
          } else {
            resolve({ id: this.lastID, ...message });
          }
        }
      );
    });
  }

  async clearMessages(sessionId = 'default') {
    return new Promise((resolve, reject) => {
      this.db.run(
        'DELETE FROM messages WHERE session_id = ?',
        [sessionId],
        (err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        }
      );
    });
  }

  async getSetting(key) {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT value FROM settings WHERE key = ?',
        [key],
        (err, row) => {
          if (err) {
            reject(err);
          } else {
            resolve(row ? row.value : null);
          }
        }
      );
    });
  }

  async setSetting(key, value) {
    return new Promise((resolve, reject) => {
      this.db.run(
        'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
        [key, value],
        (err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        }
      );
    });
  }

  close() {
    if (this.db) {
      this.db.close();
    }
  }
}

module.exports = { DatabaseManager };