-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  uid VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'user',
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create clients table
CREATE TABLE IF NOT EXISTS clients (
  id SERIAL PRIMARY KEY,
  client_id VARCHAR(255) UNIQUE NOT NULL,
  client_name VARCHAR(255) NOT NULL,
  user_id INTEGER REFERENCES users(id),
  status VARCHAR(50) DEFAULT 'active',
  online_status VARCHAR(50) DEFAULT 'offline',
  last_heartbeat TIMESTAMP,
  data JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create queries table
CREATE TABLE IF NOT EXISTS queries (
  id SERIAL PRIMARY KEY,
  query_id VARCHAR(255) UNIQUE NOT NULL,
  client_id INTEGER REFERENCES clients(id),
  query_text TEXT,
  query_type VARCHAR(100),
  status VARCHAR(50) DEFAULT 'pending',
  result JSONB,
  error_message TEXT,
  executed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create commands table
CREATE TABLE IF NOT EXISTS commands (
  id SERIAL PRIMARY KEY,
  command_id VARCHAR(255) UNIQUE NOT NULL,
  client_id INTEGER REFERENCES clients(id),
  command_type VARCHAR(100) NOT NULL,
  command_data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'pending',
  executed_at TIMESTAMP,
  result JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create agents table
CREATE TABLE IF NOT EXISTS agents (
  id SERIAL PRIMARY KEY,
  agent_id VARCHAR(255) UNIQUE NOT NULL,
  agent_name VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'active',
  assigned_clients JSONB DEFAULT '[]',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create engineers table
CREATE TABLE IF NOT EXISTS engineers (
  id SERIAL PRIMARY KEY,
  engineer_id VARCHAR(255) UNIQUE NOT NULL,
  user_id INTEGER REFERENCES users(id),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create agent_heartbeats table
CREATE TABLE IF NOT EXISTS agent_heartbeats (
  id SERIAL PRIMARY KEY,
  agent_id INTEGER REFERENCES agents(id),
  heartbeat_data JSONB DEFAULT '{}',
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create reports table
CREATE TABLE IF NOT EXISTS reports (
  id SERIAL PRIMARY KEY,
  report_id VARCHAR(255) UNIQUE NOT NULL,
  client_id INTEGER REFERENCES clients(id),
  report_type VARCHAR(100),
  report_data JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create configurations table
CREATE TABLE IF NOT EXISTS configurations (
  id SERIAL PRIMARY KEY,
  config_key VARCHAR(255) UNIQUE NOT NULL,
  config_value JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create balances table
CREATE TABLE IF NOT EXISTS balances (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  balance_type VARCHAR(100),
  amount DECIMAL(10, 2) DEFAULT 0,
  currency VARCHAR(10) DEFAULT 'USD',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_uid ON users(uid);
CREATE INDEX IF NOT EXISTS idx_clients_client_id ON clients(client_id);
CREATE INDEX IF NOT EXISTS idx_clients_user_id ON clients(user_id);
CREATE INDEX IF NOT EXISTS idx_queries_client_id ON queries(client_id);
CREATE INDEX IF NOT EXISTS idx_commands_client_id ON commands(client_id);
CREATE INDEX IF NOT EXISTS idx_agents_agent_id ON agents(agent_id);
CREATE INDEX IF NOT EXISTS idx_engineers_user_id ON engineers(user_id);
CREATE INDEX IF NOT EXISTS idx_balances_user_id ON balances(user_id);
