-- Insert sample training centers
INSERT INTO training_centers (name, country, accreditation_status, accreditation_date, contact_email, website) VALUES
('Excellence Training Institute', 'Canada', 'active', '2024-01-15', 'info@excellence.ca', 'https://excellence.ca'),
('Professional Development Center', 'Canada', 'active', '2024-02-20', 'contact@pdc.ca', 'https://pdc.ca'),
('Leadership Academy', 'Canada', 'active', '2024-03-10', 'admin@leadership.ca', 'https://leadership.ca');

-- Insert sample training programs
INSERT INTO training_programs (center_id, program_name, program_code, description, duration_hours, accreditation_status, accreditation_date) VALUES
(1, 'Project Management Professional', 'PMP-2024', 'Comprehensive project management training', 40, 'active', '2024-01-15'),
(1, 'Digital Marketing Certification', 'DMC-2024', 'Modern digital marketing strategies', 30, 'active', '2024-01-20'),
(2, 'Leadership Excellence Program', 'LEP-2024', 'Advanced leadership skills development', 35, 'active', '2024-02-20'),
(2, 'Data Analytics Fundamentals', 'DAF-2024', 'Introduction to data analysis', 25, 'active', '2024-02-25'),
(3, 'Executive Coaching Certification', 'ECC-2024', 'Professional coaching techniques', 50, 'active', '2024-03-10');

-- Insert sample certificates
INSERT INTO certificates (certificate_number, holder_name, program_id, center_id, issue_date, status) VALUES
('MOGU-2024-001', 'Sarah Johnson', 1, 1, '2024-06-15', 'valid'),
('MOGU-2024-002', 'Michael Chen', 1, 1, '2024-06-15', 'valid'),
('MOGU-2024-003', 'Emily Rodriguez', 2, 1, '2024-07-20', 'valid'),
('MOGU-2024-004', 'David Kim', 3, 2, '2024-08-10', 'valid'),
('MOGU-2024-005', 'Jennifer Brown', 4, 2, '2024-09-05', 'valid'),
('MOGU-2024-006', 'Robert Taylor', 5, 3, '2024-10-12', 'valid'),
('MOGU-2024-007', 'Lisa Anderson', 1, 1, '2024-11-08', 'valid'),
('MOGU-2024-008', 'James Wilson', 2, 1, '2024-11-15', 'valid');

-- Insert accreditation standards
INSERT INTO accreditation_standards (standard_name, category, description) VALUES
('Trainer Qualification', 'MOGU Method', 'Verification of trainer credentials, experience, and expertise'),
('Training Material Quality', 'MOGU Method', 'Assessment of training content, structure, and relevance'),
('Learning Process Design', 'MOGU Method', 'Evaluation of pedagogical approaches and learning methodologies'),
('Delivery Methods', 'MOGU Method', 'Review of training delivery techniques and effectiveness'),
('Assessment & Evaluation', 'MOGU Method', 'Quality of learner assessment and outcome measurement'),
('Governance & Management', 'Institutional', 'Organizational structure and management practices'),
('Continuous Improvement', 'Quality Assurance', 'Systems for ongoing quality enhancement');
