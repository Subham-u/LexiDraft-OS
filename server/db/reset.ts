import { pool } from './index';
import { createLogger } from '../utils/logger';

const logger = createLogger('database-reset');

async function resetDatabase() {
  const client = await pool.connect();
  try {
    // Drop existing tables
    await client.query(`
      DROP TABLE IF EXISTS ai_conversations CASCADE;
      DROP TABLE IF EXISTS chat_messages CASCADE;
      DROP TABLE IF EXISTS chat_rooms CASCADE;
      DROP TABLE IF EXISTS clauses CASCADE;
      DROP TABLE IF EXISTS clients CASCADE;
      DROP TABLE IF EXISTS consultations CASCADE;
      DROP TABLE IF EXISTS contract_analyses CASCADE;
      DROP TABLE IF EXISTS contracts CASCADE;
      DROP TABLE IF EXISTS document_activities CASCADE;
      DROP TABLE IF EXISTS document_versions CASCADE;
      DROP TABLE IF EXISTS lawyer_reviews CASCADE;
      DROP TABLE IF EXISTS lawyers CASCADE;
      DROP TABLE IF EXISTS notifications CASCADE;
      DROP TABLE IF EXISTS payments CASCADE;
      DROP TABLE IF EXISTS permissions CASCADE;
      DROP TABLE IF EXISTS roles CASCADE;
      DROP TABLE IF EXISTS shared_documents CASCADE;
      DROP TABLE IF EXISTS subscriptions CASCADE;
      DROP TABLE IF EXISTS templates CASCADE;
      DROP TABLE IF EXISTS users CASCADE;
    `);

    // Drop existing enum types
    await client.query(`
      DROP TYPE IF EXISTS contract_status CASCADE;
      DROP TYPE IF EXISTS contract_type CASCADE;
      DROP TYPE IF EXISTS party_role CASCADE;
      DROP TYPE IF EXISTS payment_status CASCADE;
      DROP TYPE IF EXISTS payment_type CASCADE;
      DROP TYPE IF EXISTS subscription_plan CASCADE;
      DROP TYPE IF EXISTS subscription_status CASCADE;
      DROP TYPE IF EXISTS practice_area CASCADE;
      DROP TYPE IF EXISTS consultation_mode CASCADE;
      DROP TYPE IF EXISTS consultation_status CASCADE;
      DROP TYPE IF EXISTS verification_status CASCADE;
    `);
    logger.info('Successfully reset database');
  } catch (error) {
    logger.error('Error resetting database:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run the reset
resetDatabase()
  .then(() => {
    logger.info('Database reset completed');
    process.exit(0);
  })
  .catch((error) => {
    logger.error('Database reset failed:', error);
    process.exit(1);
  }); 