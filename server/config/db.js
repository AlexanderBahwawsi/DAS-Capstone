const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Verify connection on startup
pool.query('SELECT NOW()')
  .then(() => console.log('Connected to Supabase PostgreSQL'))
  .catch(err => {
    console.error('Database connection failed:', err.message);
    process.exit(1);
  });

/**
 * Creates all tables if they don't exist.
 * Called once at server startup from index.js.
 */
async function initializeDatabase() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id            SERIAL PRIMARY KEY,
      first_name    TEXT    NOT NULL,
      last_name     TEXT    NOT NULL,
      email         TEXT    NOT NULL UNIQUE,
      password_hash TEXT    NOT NULL,
      role          TEXT    NOT NULL DEFAULT 'submitter'
                           CHECK(role IN ('admin','editor','reviewer','submitter')),
      bio           TEXT    DEFAULT '',
      created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS submissions (
      id             SERIAL PRIMARY KEY,
      submission_id  TEXT    NOT NULL UNIQUE,
      user_id        INTEGER NOT NULL REFERENCES users(id),
      title          TEXT    NOT NULL,
      genre          TEXT    NOT NULL,
      word_count     INTEGER,
      bio            TEXT    DEFAULT '',
      notes          TEXT    DEFAULT '',
      status         TEXT    NOT NULL DEFAULT 'pending'
                            CHECK(status IN ('pending','in_review','accepted','rejected')),
      created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS submission_files (
      id             SERIAL PRIMARY KEY,
      submission_id  INTEGER NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
      filename       TEXT    NOT NULL,
      original_name  TEXT    NOT NULL,
      mimetype       TEXT    NOT NULL,
      size           INTEGER NOT NULL,
      created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id             SERIAL PRIMARY KEY,
      submission_id  INTEGER NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
      reviewer_id    INTEGER NOT NULL REFERENCES users(id),
      rating         INTEGER CHECK(rating BETWEEN 1 AND 5),
      comment        TEXT    DEFAULT '',
      created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(submission_id, reviewer_id)
    );

    CREATE TABLE IF NOT EXISTS messages (
      id             SERIAL PRIMARY KEY,
      submission_id  INTEGER NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
      sender_id      INTEGER NOT NULL REFERENCES users(id),
      body           TEXT    NOT NULL,
      created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS assignments (
      id             SERIAL PRIMARY KEY,
      submission_id  INTEGER NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
      reviewer_id    INTEGER NOT NULL REFERENCES users(id),
      assigned_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(submission_id, reviewer_id)
    );

    -- Enable Row Level Security on all tables
    ALTER TABLE users ENABLE ROW LEVEL SECURITY;
    ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
    ALTER TABLE submission_files ENABLE ROW LEVEL SECURITY;
    ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
    ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
    ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
  `);
}

module.exports = { pool, initializeDatabase };
