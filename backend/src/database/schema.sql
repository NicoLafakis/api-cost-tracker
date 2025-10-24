-- API Cost Tracker Database Schema

-- Table for storing encrypted API keys
CREATE TABLE IF NOT EXISTS api_keys (
  id INT AUTO_INCREMENT PRIMARY KEY,
  label VARCHAR(255) NOT NULL,
  provider ENUM('openai', 'anthropic') NOT NULL,
  encrypted_key TEXT NOT NULL,
  workspace VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  last_validated_at TIMESTAMP NULL,
  INDEX idx_provider (provider),
  INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table for storing usage snapshots from polling
CREATE TABLE IF NOT EXISTS usage_snapshots (
  id INT AUTO_INCREMENT PRIMARY KEY,
  api_key_id INT NOT NULL,
  snapshot_date DATE NOT NULL,
  total_cost DECIMAL(10, 4) DEFAULT 0,
  token_usage BIGINT DEFAULT 0,
  request_count INT DEFAULT 0,
  model_breakdown JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (api_key_id) REFERENCES api_keys(id) ON DELETE CASCADE,
  INDEX idx_api_key_date (api_key_id, snapshot_date),
  INDEX idx_snapshot_date (snapshot_date),
  UNIQUE KEY unique_snapshot (api_key_id, snapshot_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table for detailed polling history
CREATE TABLE IF NOT EXISTS polling_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  api_key_id INT NOT NULL,
  polled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status ENUM('success', 'failure') NOT NULL,
  response_data JSON,
  error_message TEXT,
  FOREIGN KEY (api_key_id) REFERENCES api_keys(id) ON DELETE CASCADE,
  INDEX idx_api_key_time (api_key_id, polled_at),
  INDEX idx_polled_at (polled_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table for spending alerts configuration
CREATE TABLE IF NOT EXISTS spending_alerts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  api_key_id INT NOT NULL,
  threshold_amount DECIMAL(10, 4) NOT NULL,
  threshold_type ENUM('daily', 'monthly') NOT NULL,
  alert_email VARCHAR(255),
  is_enabled BOOLEAN DEFAULT true,
  last_triggered_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (api_key_id) REFERENCES api_keys(id) ON DELETE CASCADE,
  INDEX idx_api_key (api_key_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table for user preferences
CREATE TABLE IF NOT EXISTS user_preferences (
  id INT AUTO_INCREMENT PRIMARY KEY,
  preference_key VARCHAR(100) NOT NULL UNIQUE,
  preference_value TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default preferences
INSERT INTO user_preferences (preference_key, preference_value) VALUES
  ('theme', 'system'),
  ('currency', 'USD'),
  ('default_time_range', '30d')
ON DUPLICATE KEY UPDATE preference_value = preference_value;
