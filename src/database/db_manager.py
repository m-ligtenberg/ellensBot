import sqlite3
import os
import json
from datetime import datetime
from typing import List, Dict, Optional
from threading import Lock
from pathlib import Path
from ..utils.logger import logger
from ..utils.config import config

class DatabaseManager:
    def __init__(self, db_path: str = None):
        if db_path is None:
            db_path = config.get("database.db_name", "young_ellens.db")
        
        # Create data directory if it doesn't exist
        self.data_dir = Path.home() / ".youngellens"
        self.data_dir.mkdir(exist_ok=True)
        
        self.db_path = self.data_dir / db_path
        self.connection = None
        self.lock = Lock()
        self._initialize_database()
    
    def _initialize_database(self):
        """Initialize the database and create tables"""
        try:
            logger.info(f"Initializing database at: {self.db_path}")
            self.connection = sqlite3.connect(str(self.db_path), check_same_thread=False)
            self.connection.row_factory = sqlite3.Row
            
            # Enable foreign keys
            self.connection.execute("PRAGMA foreign_keys = ON")
            
            # Set journal mode for better performance
            self.connection.execute("PRAGMA journal_mode = WAL")
            
            self._create_tables()
            logger.info("Database initialized successfully")
            
        except sqlite3.Error as e:
            logger.error(f"Database initialization error: {e}")
            raise Exception(f"Failed to initialize database: {e}")
    
    def _create_tables(self):
        """Create necessary database tables"""
        with self.lock:
            cursor = self.connection.cursor()
            
            # Messages table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS messages (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    content TEXT NOT NULL,
                    sender TEXT NOT NULL,
                    timestamp TEXT NOT NULL,
                    session_id TEXT DEFAULT 'default'
                )
            ''')
            
            # Settings table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS settings (
                    key TEXT PRIMARY KEY,
                    value TEXT NOT NULL
                )
            ''')
            
            # Sessions table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS sessions (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    last_message_at TEXT
                )
            ''')
            
            self.connection.commit()
    
    def save_message(self, content: str, sender: str, session_id: str = "default") -> bool:
        """Save a message to the database"""
        try:
            with self.lock:
                cursor = self.connection.cursor()
                timestamp = datetime.now().isoformat()
                
                cursor.execute('''
                    INSERT INTO messages (content, sender, timestamp, session_id)
                    VALUES (?, ?, ?, ?)
                ''', (content, sender, timestamp, session_id))
                
                # Update session last message time
                cursor.execute('''
                    INSERT OR REPLACE INTO sessions (id, name, created_at, last_message_at)
                    VALUES (?, ?, COALESCE((SELECT created_at FROM sessions WHERE id = ?), ?), ?)
                ''', (session_id, f"Chat {session_id}", session_id, timestamp, timestamp))
                
                self.connection.commit()
                return True
        except sqlite3.Error as e:
            print(f"Error saving message: {e}")
            return False
    
    def get_messages(self, session_id: str = "default", limit: int = 100) -> List[Dict]:
        """Get messages from the database"""
        try:
            with self.lock:
                cursor = self.connection.cursor()
                cursor.execute('''
                    SELECT * FROM messages 
                    WHERE session_id = ? 
                    ORDER BY timestamp DESC 
                    LIMIT ?
                ''', (session_id, limit))
                
                messages = []
                for row in cursor.fetchall():
                    messages.append({
                        'id': row['id'],
                        'content': row['content'],
                        'sender': row['sender'],
                        'timestamp': row['timestamp'],
                        'session_id': row['session_id']
                    })
                
                return list(reversed(messages))
        except sqlite3.Error as e:
            print(f"Error getting messages: {e}")
            return []
    
    def clear_messages(self, session_id: str = "default") -> bool:
        """Clear all messages for a session"""
        try:
            with self.lock:
                cursor = self.connection.cursor()
                cursor.execute('DELETE FROM messages WHERE session_id = ?', (session_id,))
                self.connection.commit()
                return True
        except sqlite3.Error as e:
            print(f"Error clearing messages: {e}")
            return False
    
    def get_sessions(self) -> List[Dict]:
        """Get all chat sessions"""
        try:
            with self.lock:
                cursor = self.connection.cursor()
                cursor.execute('''
                    SELECT * FROM sessions 
                    ORDER BY last_message_at DESC
                ''')
                
                sessions = []
                for row in cursor.fetchall():
                    sessions.append({
                        'id': row['id'],
                        'name': row['name'],
                        'created_at': row['created_at'],
                        'last_message_at': row['last_message_at']
                    })
                
                return sessions
        except sqlite3.Error as e:
            print(f"Error getting sessions: {e}")
            return []
    
    def export_chat(self, session_id: str = "default", file_path: str = None) -> bool:
        """Export chat to JSON file"""
        try:
            messages = self.get_messages(session_id)
            export_data = {
                'session_id': session_id,
                'exported_at': datetime.now().isoformat(),
                'message_count': len(messages),
                'messages': messages
            }
            
            if not file_path:
                file_path = f"young_ellens_chat_{session_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
            
            with open(file_path, 'w', encoding='utf-8') as f:
                json.dump(export_data, f, indent=2, ensure_ascii=False)
            
            return True
        except Exception as e:
            print(f"Error exporting chat: {e}")
            return False
    
    def close(self):
        """Close database connection"""
        try:
            if self.connection:
                self.connection.close()
        except sqlite3.Error as e:
            print(f"Error closing database: {e}")