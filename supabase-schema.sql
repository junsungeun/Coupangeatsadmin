-- Supabase Database Schema for Coupang Eats Admin
-- Run this SQL in Supabase SQL Editor

-- 1. Leads Table
CREATE TABLE IF NOT EXISTS leads (
  id BIGSERIAL PRIMARY KEY,
  type VARCHAR(20) NOT NULL CHECK (type IN ('consult', 'direct_join')),
  name VARCHAR(100) NOT NULL,
  store_name VARCHAR(200) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(255),
  store_link TEXT,
  biz_registration_url TEXT,
  mailorder_cert_url TEXT,
  bank_copy_url TEXT,
  user_id VARCHAR(100),
  password_hash TEXT,
  status VARCHAR(20) NOT NULL DEFAULT '신규' CHECK (status IN ('신규', '연락완료', '상담중', '입점진행', '입점완료', '보류', '이탈')),
  business_type VARCHAR(50),
  memo TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Admin Users Table
CREATE TABLE IF NOT EXISTS admin_users (
  id BIGSERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Activity Logs Table
CREATE TABLE IF NOT EXISTS activity_logs (
  id BIGSERIAL PRIMARY KEY,
  lead_id BIGINT NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  admin_id BIGINT REFERENCES admin_users(id) ON DELETE SET NULL,
  action VARCHAR(50) NOT NULL,
  old_value TEXT,
  new_value TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_leads_type ON leads(type);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_lead_id ON activity_logs(lead_id);

-- Enable Row Level Security (RLS) - optional but recommended
-- ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Create default admin user (password: admin123)
-- bcrypt hash for 'admin123': $2a$10$rQZ8K8HF5Y5Y5Y5Y5Y5Y5OeZ8K8HF5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5
INSERT INTO admin_users (email, password_hash, name)
VALUES ('admin@coupangeats.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '관리자')
ON CONFLICT (email) DO NOTHING;

-- Note: The default password is 'password' for the hash above
-- You should change this immediately after first login!
-- Or generate a new hash using bcryptjs in Node.js:
-- const bcrypt = require('bcryptjs');
-- const hash = bcrypt.hashSync('your-password', 10);
