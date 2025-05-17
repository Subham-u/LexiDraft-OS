/**
 * Migration: Add new tables for payments, subscriptions, chat, and other features
 * 
 * This migration adds the following tables to the database:
 * - payments
 * - subscriptions
 * - contract_analyses
 * - document_versions
 * - notifications
 * - chat_rooms
 * - chat_messages
 */

import { sql } from 'drizzle-orm';

export default {
  name: '20250517_add_new_tables',
  description: 'Add new tables for payments, subscriptions, contract analysis, notifications, and chat',
  
  async up(db) {
    console.log('Creating payment and subscription related enums...');
    
    // Create enums
    await db.execute(sql`
      DO $$ BEGIN
        CREATE TYPE payment_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    
    await db.execute(sql`
      DO $$ BEGIN
        CREATE TYPE payment_type AS ENUM ('consultation', 'subscription', 'contract_analysis', 'document_generation', 'other');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    
    await db.execute(sql`
      DO $$ BEGIN
        CREATE TYPE subscription_plan AS ENUM ('free', 'basic', 'professional', 'enterprise');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    
    await db.execute(sql`
      DO $$ BEGIN
        CREATE TYPE subscription_status AS ENUM ('active', 'cancelled', 'expired', 'trial', 'past_due');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    
    console.log('Creating payments table...');
    // Create payments table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS payments (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        amount INTEGER NOT NULL,
        currency TEXT NOT NULL DEFAULT 'INR',
        status payment_status NOT NULL DEFAULT 'pending',
        type payment_type NOT NULL,
        payment_method TEXT,
        payment_provider TEXT,
        payment_provider_id TEXT,
        metadata JSONB,
        related_entity_id INTEGER,
        related_entity_type TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    
    console.log('Creating subscriptions table...');
    // Create subscriptions table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS subscriptions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        plan subscription_plan NOT NULL,
        status subscription_status NOT NULL DEFAULT 'active',
        start_date TIMESTAMP NOT NULL,
        end_date TIMESTAMP,
        trial_ends_at TIMESTAMP,
        cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
        current_period_start TIMESTAMP,
        current_period_end TIMESTAMP,
        payment_provider_id TEXT,
        metadata JSONB,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    
    console.log('Creating contract_analyses table...');
    // Create contract analyses table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS contract_analyses (
        id SERIAL PRIMARY KEY,
        contract_id INTEGER NOT NULL REFERENCES contracts(id),
        user_id INTEGER NOT NULL REFERENCES users(id),
        risk_score INTEGER,
        completeness INTEGER,
        issues JSONB[],
        strengths JSONB[],
        weaknesses JSONB[],
        recommendations JSONB[],
        compliant_with_indian_law BOOLEAN,
        analysis_metadata JSONB,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    
    console.log('Creating document_versions table...');
    // Create document versions table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS document_versions (
        id SERIAL PRIMARY KEY,
        document_id INTEGER NOT NULL,
        document_type TEXT NOT NULL,
        version INTEGER NOT NULL,
        content TEXT NOT NULL,
        changes JSONB,
        created_by INTEGER NOT NULL REFERENCES users(id),
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    
    console.log('Creating notifications table...');
    // Create notifications table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        read BOOLEAN NOT NULL DEFAULT false,
        metadata JSONB,
        related_entity_id INTEGER,
        related_entity_type TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    
    console.log('Creating chat_rooms table...');
    // Create chat rooms table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS chat_rooms (
        id SERIAL PRIMARY KEY,
        name TEXT,
        type TEXT NOT NULL,
        participants INTEGER[] NOT NULL,
        last_message_at TIMESTAMP,
        metadata JSONB,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    
    console.log('Creating chat_messages table...');
    // Create chat messages table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS chat_messages (
        id SERIAL PRIMARY KEY,
        room_id INTEGER NOT NULL REFERENCES chat_rooms(id),
        sender_id INTEGER NOT NULL REFERENCES users(id),
        content TEXT NOT NULL,
        attachments JSONB[],
        read BOOLEAN NOT NULL DEFAULT false,
        related_entity_id INTEGER,
        related_entity_type TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    
    console.log('All new tables created successfully');
    return true;
  },
  
  async down(db) {
    console.log('Dropping new tables in reverse order...');
    
    await db.execute(sql`DROP TABLE IF EXISTS chat_messages;`);
    await db.execute(sql`DROP TABLE IF EXISTS chat_rooms;`);
    await db.execute(sql`DROP TABLE IF EXISTS notifications;`);
    await db.execute(sql`DROP TABLE IF EXISTS document_versions;`);
    await db.execute(sql`DROP TABLE IF EXISTS contract_analyses;`);
    await db.execute(sql`DROP TABLE IF EXISTS subscriptions;`);
    await db.execute(sql`DROP TABLE IF EXISTS payments;`);
    
    // Drop the enums
    await db.execute(sql`
      DROP TYPE IF EXISTS payment_status;
      DROP TYPE IF EXISTS payment_type;
      DROP TYPE IF EXISTS subscription_plan;
      DROP TYPE IF EXISTS subscription_status;
    `);
    
    console.log('All new tables dropped successfully');
    return true;
  }
};