import pool from '../config/database';

const updateSchema = async () => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    console.log('🔄 Adatbázis séma frissítése...');

    // Add discriminator and updated_at to users if not exists
    await client.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS discriminator VARCHAR(10),
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    `);

    // Drop old role constraint
    await client.query(`
      ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check
    `);

    // Add new role constraint with extended roles
    await client.query(`
      ALTER TABLE users
      ADD CONSTRAINT users_role_check
      CHECK (role IN ('rendszergazda', 'leader', 'al-leader', 'admin', 'owner'))
    `);

    // Create categories table
    await client.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        order_index INTEGER NOT NULL,
        active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_categories_order ON categories(order_index)
    `);

    // Add category_id to questions
    await client.query(`
      ALTER TABLE questions
      ADD COLUMN IF NOT EXISTS category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL
    `);

    // Insert default categories
    const categoryCheck = await client.query('SELECT COUNT(*) FROM categories');

    if (parseInt(categoryCheck.rows[0].count) === 0) {
      await client.query(`
        INSERT INTO categories (name, description, order_index, active) VALUES
        ('Alapadatok', 'Alapvető személyes információk', 1, true),
        ('Karakter', 'Karakterrel kapcsolatos információk', 2, true),
        ('Motiváció', 'Miért szeretnél csatlakozni', 3, true),
        ('Tapasztalat', 'Korábbi roleplay tapasztalatok', 4, true),
        ('Egyéb', 'További információk', 5, true),
        ('Áttekintés', 'Végleges ellenőrzés', 999, true)
      `);
      console.log('✅ Default categories created');
    }

    await client.query('COMMIT');
    console.log('✅ Schema update completed successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error updating schema:', error);
    throw error;
  } finally {
    client.release();
  }
};

// Run migration
updateSchema()
  .then(() => {
    console.log('Schema update completed');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Schema update failed:', err);
    process.exit(1);
  });
