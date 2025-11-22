-- RoomSplit Database Schema
-- Run this file to create all necessary tables

CREATE DATABASE IF NOT EXISTS roomsplit;
USE roomsplit;

-- Users table for authentication and profiles
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(36) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  avatar_url VARCHAR(500),
  preferences JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  last_login TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  INDEX idx_email (email)
);

-- Households table
CREATE TABLE IF NOT EXISTS households (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  total_rent DECIMAL(10, 2) NOT NULL,
  owner_id VARCHAR(36) NOT NULL,
  invite_code VARCHAR(8) UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_owner (owner_id),
  INDEX idx_invite_code (invite_code)
);

-- Household members (users linked to households)
CREATE TABLE IF NOT EXISTS household_members (
  id VARCHAR(36) PRIMARY KEY,
  household_id VARCHAR(36) NOT NULL,
  user_id VARCHAR(36) NOT NULL,
  role ENUM('owner', 'admin', 'member') DEFAULT 'member',
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_membership (household_id, user_id),
  INDEX idx_household (household_id),
  INDEX idx_user (user_id)
);

-- Roommates table (can be linked to users or standalone)
CREATE TABLE IF NOT EXISTS roommates (
  id VARCHAR(36) PRIMARY KEY,
  household_id VARCHAR(36) NOT NULL,
  user_id VARCHAR(36),
  name VARCHAR(255) NOT NULL,
  color VARCHAR(7) NOT NULL,
  payment_methods JSON,
  payment_streak INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_household (household_id),
  INDEX idx_user (user_id)
);

-- Rooms table
CREATE TABLE IF NOT EXISTS rooms (
  id VARCHAR(36) PRIMARY KEY,
  household_id VARCHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  square_footage DECIMAL(10, 2) NOT NULL,
  amenities JSON,
  rent_amount DECIMAL(10, 2),
  tier ENUM('premium', 'standard', 'economy'),
  is_couple BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE CASCADE,
  INDEX idx_household (household_id)
);

-- Room occupants (many-to-many relationship)
CREATE TABLE IF NOT EXISTS room_occupants (
  id VARCHAR(36) PRIMARY KEY,
  room_id VARCHAR(36) NOT NULL,
  roommate_id VARCHAR(36) NOT NULL,
  FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
  FOREIGN KEY (roommate_id) REFERENCES roommates(id) ON DELETE CASCADE,
  UNIQUE KEY unique_occupant (room_id, roommate_id),
  INDEX idx_room (room_id),
  INDEX idx_roommate (roommate_id)
);

-- Expenses table
CREATE TABLE IF NOT EXISTS expenses (
  id VARCHAR(36) PRIMARY KEY,
  household_id VARCHAR(36) NOT NULL,
  description VARCHAR(500) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  category ENUM('rent', 'utilities', 'groceries', 'supplies', 'other') NOT NULL,
  date DATE NOT NULL,
  paid_by VARCHAR(36) NOT NULL,
  split_method ENUM('equal', 'custom', 'percentage') NOT NULL,
  recurring_frequency ENUM('weekly', 'monthly'),
  recurring_next_due DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by VARCHAR(36),
  FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE CASCADE,
  FOREIGN KEY (paid_by) REFERENCES roommates(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_household (household_id),
  INDEX idx_paid_by (paid_by),
  INDEX idx_date (date),
  INDEX idx_category (category)
);

-- Expense splits table
CREATE TABLE IF NOT EXISTS expense_splits (
  id VARCHAR(36) PRIMARY KEY,
  expense_id VARCHAR(36) NOT NULL,
  roommate_id VARCHAR(36) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  paid BOOLEAN DEFAULT FALSE,
  paid_date TIMESTAMP,
  FOREIGN KEY (expense_id) REFERENCES expenses(id) ON DELETE CASCADE,
  FOREIGN KEY (roommate_id) REFERENCES roommates(id) ON DELETE CASCADE,
  UNIQUE KEY unique_split (expense_id, roommate_id),
  INDEX idx_expense (expense_id),
  INDEX idx_roommate (roommate_id),
  INDEX idx_paid (paid)
);

-- Agreements table
CREATE TABLE IF NOT EXISTS agreements (
  id VARCHAR(36) PRIMARY KEY,
  household_id VARCHAR(36) NOT NULL UNIQUE,
  guest_policy TEXT,
  payment_deadline VARCHAR(255),
  chore_rotation TEXT,
  quiet_hours VARCHAR(255),
  custom_sections JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE CASCADE,
  INDEX idx_household (household_id)
);

-- Agreement signatures
CREATE TABLE IF NOT EXISTS agreement_signatures (
  id VARCHAR(36) PRIMARY KEY,
  agreement_id VARCHAR(36) NOT NULL,
  roommate_id VARCHAR(36) NOT NULL,
  signed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (agreement_id) REFERENCES agreements(id) ON DELETE CASCADE,
  FOREIGN KEY (roommate_id) REFERENCES roommates(id) ON DELETE CASCADE,
  UNIQUE KEY unique_signature (agreement_id, roommate_id),
  INDEX idx_agreement (agreement_id)
);

-- Sessions table for token management
CREATE TABLE IF NOT EXISTS sessions (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  token_hash VARCHAR(255) NOT NULL,
  device_info VARCHAR(500),
  ip_address VARCHAR(45),
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user (user_id),
  INDEX idx_expires (expires_at)
);

-- Activity log for real-time updates
CREATE TABLE IF NOT EXISTS activity_log (
  id VARCHAR(36) PRIMARY KEY,
  household_id VARCHAR(36) NOT NULL,
  user_id VARCHAR(36),
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id VARCHAR(36),
  details JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_household (household_id),
  INDEX idx_created (created_at)
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  household_id VARCHAR(36),
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT,
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE CASCADE,
  INDEX idx_user (user_id),
  INDEX idx_read (read_at)
);
