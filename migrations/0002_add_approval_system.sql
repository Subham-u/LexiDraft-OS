-- Migration: 0002_add_approval_system
-- Description: Add approval workflow system for contracts

-- Create enum for approval status
CREATE TYPE approval_status AS ENUM ('pending', 'approved', 'rejected', 'changes_requested');

-- Create table for approval workflows
CREATE TABLE IF NOT EXISTS approval_workflows (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create table for approval steps
CREATE TABLE IF NOT EXISTS approval_steps (
  id SERIAL PRIMARY KEY,
  workflow_id INTEGER NOT NULL REFERENCES approval_workflows(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL,
  approval_type VARCHAR(50) NOT NULL DEFAULT 'single_approver', -- single_approver, any_approver, all_approvers
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  
  -- Ensure steps within a workflow have unique order
  UNIQUE(workflow_id, order_index)
);

-- Create table for approval step users
CREATE TABLE IF NOT EXISTS approval_step_users (
  id SERIAL PRIMARY KEY,
  step_id INTEGER NOT NULL REFERENCES approval_steps(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  
  -- Ensure users are assigned to a step only once
  UNIQUE(step_id, user_id)
);

-- Create table for contract approvals
CREATE TABLE IF NOT EXISTS contract_approvals (
  id SERIAL PRIMARY KEY,
  contract_id INTEGER NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  workflow_id INTEGER NOT NULL REFERENCES approval_workflows(id) ON DELETE CASCADE,
  current_step_id INTEGER REFERENCES approval_steps(id) ON DELETE SET NULL,
  status approval_status NOT NULL DEFAULT 'pending',
  initiated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  initiated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- A contract can only have one active approval workflow
  UNIQUE(contract_id, workflow_id)
);

-- Create table for approval actions
CREATE TABLE IF NOT EXISTS approval_actions (
  id SERIAL PRIMARY KEY,
  contract_approval_id INTEGER NOT NULL REFERENCES contract_approvals(id) ON DELETE CASCADE,
  step_id INTEGER REFERENCES approval_steps(id) ON DELETE SET NULL,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  action approval_status NOT NULL,
  comments TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create indexes for better performance
CREATE INDEX idx_contract_approvals_contract ON contract_approvals(contract_id);
CREATE INDEX idx_contract_approvals_status ON contract_approvals(status);
CREATE INDEX idx_approval_actions_approval ON approval_actions(contract_approval_id);
CREATE INDEX idx_approval_step_users_step ON approval_step_users(step_id);

-- Add comments
COMMENT ON TABLE approval_workflows IS 'Defines approval workflows for contracts';
COMMENT ON TABLE approval_steps IS 'Defines steps within an approval workflow';
COMMENT ON TABLE approval_step_users IS 'Maps users to approval steps';
COMMENT ON TABLE contract_approvals IS 'Tracks approval status for contracts';
COMMENT ON TABLE approval_actions IS 'Audit log of all approval actions';