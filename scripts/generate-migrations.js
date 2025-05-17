/**
 * Generate database migrations based on schema changes
 * 
 * This script uses Drizzle Kit to generate SQL migration files.
 * Run with: node scripts/generate-migrations.js
 */
require('dotenv').config();
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

// Ensure DATABASE_URL environment variable is set
if (!process.env.DATABASE_URL) {
  console.error('ERROR: DATABASE_URL environment variable is not set');
  process.exit(1);
}

// Make sure migrations directory exists
const migrationsDir = path.join(process.cwd(), 'migrations');
if (!fs.existsSync(migrationsDir)) {
  console.log('Creating migrations directory');
  fs.mkdirSync(migrationsDir, { recursive: true });
}

console.log('Generating migrations...');

// Run drizzle-kit generate command
const command = 'npx drizzle-kit generate:pg';

exec(command, (error, stdout, stderr) => {
  if (error) {
    console.error(`Error generating migrations: ${error.message}`);
    return;
  }
  
  if (stderr) {
    console.error(`Errors: ${stderr}`);
    return;
  }
  
  console.log('Migration files generated successfully:');
  console.log(stdout);
  
  // List all migration files
  const files = fs.readdirSync(migrationsDir);
  if (files.length === 0) {
    console.log('No migration files found. This likely means no schema changes were detected.');
  } else {
    console.log('Migration files:');
    files.forEach(file => {
      console.log(`- ${file}`);
    });
  }
});