#!/usr/bin/env node

// db-push.js - A script to push the database schema to PostgreSQL

const { spawn } = require('child_process');
const path = require('path');

console.log('🔄 Pushing database schema to PostgreSQL...');

// Execute drizzle-kit push
const drizzlePush = spawn('npx', ['drizzle-kit', 'push:pg'], {
  stdio: 'inherit',
  shell: true,
  env: {
    ...process.env,
    DB_URL: process.env.DATABASE_URL,
  }
});

drizzlePush.on('close', (code) => {
  if (code === 0) {
    console.log('✅ Database schema pushed successfully!');
  } else {
    console.error(`❌ Failed to push database schema (exit code: ${code})`);
    process.exit(1);
  }
});