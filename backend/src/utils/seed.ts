import pool from '../config/database';

const seedData = async () => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Check if rendszergazda exists
    const adminCheck = await client.query(
      'SELECT id FROM users WHERE role IN ($1, $2) LIMIT 1',
      ['rendszergazda', 'owner']
    );

    if (adminCheck.rows.length === 0) {
      // Check if we should create a default admin
      const defaultPassword = process.env.DEFAULT_ADMIN_PASSWORD;
      const defaultDiscordId = process.env.DEFAULT_ADMIN_DISCORD_ID || `temp_admin_${Date.now()}`;
      const defaultUsername = process.env.DEFAULT_ADMIN_USERNAME || 'DefaultAdmin';

      if (defaultPassword) {
        // Create a default rendszergazda
        await client.query(
          `INSERT INTO users (discord_id, username, role)
           VALUES ($1, $2, $3)`,
          [defaultDiscordId, defaultUsername, 'rendszergazda']
        );
        console.log('✅ Default admin created!');
        console.log(`   Username: ${defaultUsername}`);
        console.log(`   Discord ID: ${defaultDiscordId}`);
        console.log('   ⚠️  Most már be tudsz jelentkezni Discord-on keresztül!');
      } else {
        console.log('⚠️  No owner found. Please add an owner manually with their Discord ID.');
        console.log('   Example: INSERT INTO users (discord_id, username, role) VALUES (\'YOUR_DISCORD_ID\', \'YourName\', \'owner\');');
      }
    } else {
      console.log('ℹ️  Rendszergazda already exists, skipping default admin creation');
    }

    // Seed default questions
    const questionsCheck = await client.query('SELECT COUNT(*) FROM questions');

    if (parseInt(questionsCheck.rows[0].count) === 0) {
      const defaultQuestions = [
        {
          question_text: 'Mi az in-character neved?',
          field_key: 'ic_name',
          type: 'text',
          is_required: true,
          order_index: 1,
        },
        {
          question_text: 'Hány éves vagy? (Valós életkor)',
          field_key: 'age',
          type: 'text',
          is_required: true,
          order_index: 2,
        },
        {
          question_text: 'Mi a Discord neved?',
          field_key: 'discord_name',
          type: 'text',
          is_required: true,
          order_index: 3,
        },
        {
          question_text: 'Miért szeretnél csatlakozni a Los Santos Police Department-hez?',
          field_key: 'motivation',
          type: 'textarea',
          is_required: true,
          order_index: 4,
        },
        {
          question_text: 'Mutasd be a karaktered részletesen! (Háttértörténet, személyiség, célok)',
          field_key: 'character_bio',
          type: 'textarea',
          is_required: true,
          order_index: 5,
        },
        {
          question_text: 'Van-e korábbi roleplay tapasztalatod? Ha igen, hol és milyen szerepekben?',
          field_key: 'experience',
          type: 'textarea',
          is_required: true,
          order_index: 6,
        },
        {
          question_text: 'Hány órát tudsz átlagosan játszani hetente?',
          field_key: 'playtime',
          type: 'text',
          is_required: true,
          order_index: 7,
        },
        {
          question_text: 'Van-e valami egyéb, amit szeretnél megosztani velünk?',
          field_key: 'additional',
          type: 'textarea',
          is_required: false,
          order_index: 8,
        },
      ];

      for (const q of defaultQuestions) {
        await client.query(
          `INSERT INTO questions (question_text, field_key, type, is_required, order_index, version, active)
           VALUES ($1, $2, $3, $4, $5, 1, true)`,
          [q.question_text, q.field_key, q.type, q.is_required, q.order_index]
        );
      }

      console.log('✅ Default questions seeded successfully');
    } else {
      console.log('ℹ️  Questions already exist, skipping seed');
    }

    await client.query('COMMIT');
    console.log('Seed completed');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error seeding data:', error);
    throw error;
  } finally {
    client.release();
  }
};

// Run seed
seedData()
  .then(() => {
    console.log('Seeding completed');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Seeding failed:', err);
    process.exit(1);
  });
