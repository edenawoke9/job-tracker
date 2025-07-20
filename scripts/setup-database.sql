-- Users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  telegram_id BIGINT UNIQUE NOT NULL,
  username VARCHAR(255),
  first_name VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT true
);

-- Professions/Categories
CREATE TABLE IF NOT EXISTS professions (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) UNIQUE NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  icon VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Job types
CREATE TABLE IF NOT EXISTS job_types (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User preferences
CREATE TABLE IF NOT EXISTS user_preferences (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  profession_id INTEGER REFERENCES professions(id) ON DELETE CASCADE,
  job_type_id INTEGER REFERENCES job_types(id) ON DELETE CASCADE,
  keywords TEXT[], -- Additional keywords
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, profession_id, job_type_id)
);

-- Job posts with enhanced fields
CREATE TABLE IF NOT EXISTS job_posts (
  id SERIAL PRIMARY KEY,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  company VARCHAR(255),
  location VARCHAR(255),
  salary VARCHAR(255),
  post_url VARCHAR(500),
  channel_message_id BIGINT,
  profession_id INTEGER REFERENCES professions(id),
  job_type_id INTEGER REFERENCES job_types(id),
  posted_at TIMESTAMP,
  scraped_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_processed BOOLEAN DEFAULT false
);

-- Notification log
CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  job_post_id INTEGER REFERENCES job_posts(id) ON DELETE CASCADE,
  sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(50) DEFAULT 'sent'
);

-- Insert default professions
INSERT INTO professions (name, slug, icon) VALUES
('Software Development', 'software-development', '💻'),
('Data Science', 'data-science', '📊'),
('Design', 'design', '🎨'),
('Marketing', 'marketing', '📢'),
('Sales', 'sales', '💼'),
('Customer Support', 'customer-support', '🎧'),
('Finance', 'finance', '💰'),
('Human Resources', 'human-resources', '👥'),
('Operations', 'operations', '⚙️'),
('Product Management', 'product-management', '📱')
ON CONFLICT (slug) DO NOTHING;

-- Insert job types
INSERT INTO job_types (name, slug) VALUES
('Full-time', 'full-time'),
('Part-time', 'part-time'),
('Internship', 'internship'),
('Remote', 'remote'),
('Contract', 'contract'),
('Freelance', 'freelance')
ON CONFLICT (slug) DO NOTHING;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_users_telegram_id ON users(telegram_id);
CREATE INDEX IF NOT EXISTS idx_user_preferences_user ON user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_job_posts_profession ON job_posts(profession_id);
CREATE INDEX IF NOT EXISTS idx_job_posts_job_type ON job_posts(job_type_id);
CREATE INDEX IF NOT EXISTS idx_job_posts_posted_at ON job_posts(posted_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_sent ON notifications(user_id, sent_at);
