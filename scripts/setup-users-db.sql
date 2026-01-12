-- SQL Script to create users table and add test users
-- Run this script to set up the authentication database

-- Create users table if it doesn't exist
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(64) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  mfa_enabled BOOLEAN DEFAULT false,
  mfa_secret TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Create index on username for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- Drop test users if they exist (for clean reset)
DELETE FROM users WHERE username IN ('testuser', 'demo', 'admin');

-- Insert test users with argon2 hashed passwords
-- Password: testuser123
INSERT INTO users (username, password_hash, mfa_enabled) VALUES (
  'testuser',
  '$argon2id$v=19$m=19456,t=2,p=1$QR0QZvZR8m0A/Nyk7gkzaA$k0kMRXHLHqbNP/x+y2KZJe4rG5W5TRaL2EhLDsVHNfY',
  false
);

-- Password: demo123456
INSERT INTO users (username, password_hash, mfa_enabled) VALUES (
  'demo',
  '$argon2id$v=19$m=19456,t=2,p=1$z8o4NlZ5R3hB1MpL2KjXzw$5Q6HpN8kL3Y7vW2jX0mB9e1T4sU6rV9cD2fG8hJ1kL4',
  false
);

-- Password: admin@2024
INSERT INTO users (username, password_hash, mfa_enabled) VALUES (
  'admin',
  '$argon2id$v=19$m=19456,t=2,p=1$YpQ9VxL3R2mK8jN6tW5sUa$7B3cF8hL2K9vX1qR4tY6sM8nP0dV5eJ2fG7kL4hM9xN',
  false
);

-- Display all users
SELECT id, username, mfa_enabled, created_at FROM users;

-- Test credentials:
-- Username: testuser | Password: testuser123
-- Username: demo | Password: demo123456
-- Username: admin | Password: admin@2024
