import pool from '../config/database';

const createTables = async () => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        discord_id VARCHAR(255) UNIQUE NOT NULL,
        username VARCHAR(255) NOT NULL,
        avatar VARCHAR(512),
        role VARCHAR(50) NOT NULL CHECK (role IN ('owner', 'admin')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_users_discord_id ON users(discord_id)
    `);

    // Questions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS questions (
        id SERIAL PRIMARY KEY,
        question_text TEXT NOT NULL,
        field_key VARCHAR(255) NOT NULL,
        type VARCHAR(50) NOT NULL CHECK (type IN ('text', 'textarea', 'select', 'radio', 'checkbox')),
        options JSONB,
        is_required BOOLEAN DEFAULT true,
        order_index INTEGER NOT NULL,
        version INTEGER DEFAULT 1,
        active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_questions_active_version ON questions(active, version)
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_questions_field_key ON questions(field_key)
    `);

    // Applications table
    await client.query(`
      CREATE TABLE IF NOT EXISTS applications (
        id SERIAL PRIMARY KEY,
        answers JSONB NOT NULL,
        paste_meta JSONB,
        questions_snapshot JSONB NOT NULL,
        suspicion_score INTEGER DEFAULT 0,
        status VARCHAR(50) DEFAULT 'new' CHECK (status IN ('new', 'review', 'accepted', 'rejected')),
        admin_note TEXT,
        reviewed_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status)
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_applications_suspicion_score ON applications(suspicion_score)
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_applications_created_at ON applications(created_at)
    `);

    // GIN indexes for JSONB columns
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_applications_answers_gin ON applications USING GIN (answers)
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_applications_paste_meta_gin ON applications USING GIN (paste_meta)
    `);

    // Audit log table
    await client.query(`
      CREATE TABLE IF NOT EXISTS audit_log (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        action VARCHAR(255) NOT NULL,
        entity_type VARCHAR(100),
        entity_id INTEGER,
        details JSONB,
        ip_address VARCHAR(45),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON audit_log(user_id)
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at)
    `);

    await client.query('COMMIT');
    console.log('✅ Database tables created successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error creating tables:', error);
    throw error;
  } finally {
    client.release();
  }
};

// Run migration
createTables()
  .then(() => {
    console.log('Migration completed');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
  });
