import sqlite3 from 'sqlite3';
import { config } from '../config';

export class Database {
  private db: sqlite3.Database;

  constructor() {
    this.db = new sqlite3.Database(config.dbPath, (err) => {
      if (err) {
        console.error('Error opening database:', err.message);
      } else {
        console.log('Connected to SQLite database');
        this.initializeTables();
      }
    });
  }

  private initializeTables(): void {
    // Create instructors table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS instructors (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create courses table with new date columns
    this.db.run(`
      CREATE TABLE IF NOT EXISTS courses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        schedule TEXT,
        start_date DATE,
        end_date DATE,
        instructor_id INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (instructor_id) REFERENCES instructors (id)
      )
    `, (err) => {
      if (err) {
        console.error('Error creating courses table:', err.message);
      } else {
        // Run migration to add new columns if they don't exist
        this.migrateCourseTable();
      }
    });

    // Create students table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS students (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        english_name TEXT NOT NULL,
        email TEXT NOT NULL,
        affiliation TEXT NOT NULL,
        phone TEXT NOT NULL,
        birth_date TEXT NOT NULL,
        course_id INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (course_id) REFERENCES courses (id)
      )
    `);

    console.log('Database tables initialized');
  }

  private migrateCourseTable(): void {
    // Check if new columns exist and add them if they don't
    this.db.all("PRAGMA table_info(courses)", (err, rows: any[]) => {
      if (err) {
        console.error('Error checking table info:', err.message);
        return;
      }

      const columns = rows.map(row => row.name);
      
      if (!columns.includes('start_date')) {
        this.db.run("ALTER TABLE courses ADD COLUMN start_date DATE", (err) => {
          if (err) {
            console.error('Error adding start_date column:', err.message);
          } else {
            console.log('Added start_date column to courses table');
          }
        });
      }

      if (!columns.includes('end_date')) {
        this.db.run("ALTER TABLE courses ADD COLUMN end_date DATE", (err) => {
          if (err) {
            console.error('Error adding end_date column:', err.message);
          } else {
            console.log('Added end_date column to courses table');
          }
        });
      }

      // Make schedule column nullable for backward compatibility
      // SQLite doesn't support modifying column constraints directly,
      // so this is handled in the CREATE TABLE statement above
    });
  }

  public getDb(): sqlite3.Database {
    return this.db;
  }

  public close(): void {
    this.db.close((err) => {
      if (err) {
        console.error('Error closing database:', err.message);
      } else {
        console.log('Database connection closed');
      }
    });
  }
}

export const database = new Database(); 