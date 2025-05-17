-- Add payment and subscription related enums
DO $$ BEGIN
  CREATE TYPE payment_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE payment_type AS ENUM ('consultation', 'subscription', 'contract_analysis', 'document_generation', 'other');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE subscription_plan AS ENUM ('free', 'basic', 'professional', 'enterprise');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE subscription_status AS ENUM ('active', 'cancelled', 'expired', 'trial', 'past_due');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create payments table
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

-- Create subscriptions table
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

-- Create contract analyses table
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

-- Create document versions table
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

-- Create notifications table
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

-- Create chat rooms table
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

-- Create chat messages table
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