-- Insert default admin user
-- Username: admin
-- Password: MOGU@2024Admin (will be hashed in the application)
-- Note: This is a temporary password. Change it after first login!

INSERT INTO admin_users (username, password_hash, full_name, email, role) VALUES
('admin', 'MOGU@2024Admin', 'MOGU Administrator', 'admin@moguedu.ca', 'super_admin');

-- Note: Password hashing will be handled by the application
-- This is a seed file for development. In production, create users through the admin panel.
