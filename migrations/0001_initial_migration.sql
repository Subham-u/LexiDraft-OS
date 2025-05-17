-- Migration: 0001_initial_migration
-- Description: Initial migration to set up core tables

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create table for user preferences
CREATE TABLE IF NOT EXISTS user_preferences (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  theme VARCHAR(20) DEFAULT 'light',
  notifications_enabled BOOLEAN DEFAULT TRUE,
  language VARCHAR(10) DEFAULT 'en',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(user_id)
);

-- Create table for document access logs
CREATE TABLE IF NOT EXISTS document_access_logs (
  id SERIAL PRIMARY KEY,
  document_type VARCHAR(50) NOT NULL,
  document_id INTEGER NOT NULL,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(50) NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT
);

-- Create index on document_access_logs for faster queries
CREATE INDEX idx_document_access_logs_document ON document_access_logs(document_type, document_id);
CREATE INDEX idx_document_access_logs_user ON document_access_logs(user_id);
CREATE INDEX idx_document_access_logs_timestamp ON document_access_logs(timestamp);

-- Add some helpful comments to tables
COMMENT ON TABLE user_preferences IS 'Stores user interface and notification preferences';
COMMENT ON TABLE document_access_logs IS 'Audit trail of all document access events';