-- Training Centers Table
CREATE TABLE IF NOT EXISTS training_centers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  country TEXT NOT NULL,
  accreditation_status TEXT NOT NULL DEFAULT 'active',
  accreditation_date DATE NOT NULL,
  expiry_date DATE,
  contact_email TEXT,
  website TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Training Programs Table
CREATE TABLE IF NOT EXISTS training_programs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  center_id INTEGER NOT NULL,
  program_name TEXT NOT NULL,
  program_code TEXT UNIQUE NOT NULL,
  description TEXT,
  duration_hours INTEGER,
  accreditation_status TEXT NOT NULL DEFAULT 'active',
  accreditation_date DATE NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (center_id) REFERENCES training_centers(id)
);

-- Certificates Table
CREATE TABLE IF NOT EXISTS certificates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  certificate_number TEXT UNIQUE NOT NULL,
  holder_name TEXT NOT NULL,
  program_id INTEGER NOT NULL,
  center_id INTEGER NOT NULL,
  issue_date DATE NOT NULL,
  expiry_date DATE,
  status TEXT NOT NULL DEFAULT 'valid',
  qr_code TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (program_id) REFERENCES training_programs(id),
  FOREIGN KEY (center_id) REFERENCES training_centers(id)
);

-- Accreditation Standards Table
CREATE TABLE IF NOT EXISTS accreditation_standards (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  standard_name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better search performance
CREATE INDEX IF NOT EXISTS idx_certificates_number ON certificates(certificate_number);
CREATE INDEX IF NOT EXISTS idx_certificates_holder ON certificates(holder_name);
CREATE INDEX IF NOT EXISTS idx_certificates_status ON certificates(status);
CREATE INDEX IF NOT EXISTS idx_training_centers_name ON training_centers(name);
CREATE INDEX IF NOT EXISTS idx_training_programs_code ON training_programs(program_code);
