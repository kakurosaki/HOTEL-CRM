-- Drop existing tables if they exist (to start fresh)
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS rooms CASCADE;
DROP TABLE IF EXISTS guests CASCADE;
DROP TABLE IF EXISTS staff CASCADE;

-- Create staff table
CREATE TABLE staff (
  id SERIAL PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hashed VARCHAR(255) NOT NULL,
  name VARCHAR(100),
  role VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create guests table
CREATE TABLE guests (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  phone VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create rooms table
CREATE TABLE rooms (
  id SERIAL PRIMARY KEY,
  room_number VARCHAR(10) UNIQUE NOT NULL,
  room_type VARCHAR(50),
  price_per_night DECIMAL(10, 2),
  status VARCHAR(50) DEFAULT 'available',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create bookings table
CREATE TABLE bookings (
  id SERIAL PRIMARY KEY,
  guest_id INTEGER NOT NULL REFERENCES guests(id) ON DELETE CASCADE,
  room_id INTEGER NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  check_in_date DATE NOT NULL,
  check_out_date DATE NOT NULL,
  total_price DECIMAL(10, 2),
  status VARCHAR(50) DEFAULT 'confirmed',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed staff table
-- Password: admin123 (valid bcrypt hash)
INSERT INTO staff (username, email, password_hashed, name, role) 
VALUES ('admin', 'admin@hotel.com', '$2a$10$qHvLGvfD1TqgPGRTKIVK9esE8F6FqNq4DI4Ky5PJFx3yS8HjK6Sj.', 'Admin User', 'admin');

-- Seed guests table
INSERT INTO guests (name, email, phone) 
VALUES 
  ('Sarah Johnson', 'sarah.j@email.com', '+1 (555) 123-4567'),
  ('Michael Chen', 'mchen@email.com', '+1 (555) 234-5678'),
  ('Emily Rodriguez', 'emily.r@email.com', '+1 (555) 345-6789'),
  ('David Kim', 'dkim@email.com', '+1 (555) 456-7890'),
  ('Jessica Brown', 'jbrown@email.com', '+1 (555) 567-8901');

-- Seed rooms table
INSERT INTO rooms (room_number, room_type, price_per_night, status) 
VALUES
  ('101', 'Standard', 120.00, 'available'),
  ('102', 'Standard', 120.00, 'available'),
  ('201', 'Deluxe', 180.00, 'occupied'),
  ('202', 'Deluxe', 180.00, 'cleaning'),
  ('203', 'Deluxe', 180.00, 'available'),
  ('301', 'Suite', 250.00, 'available'),
  ('302', 'Suite', 250.00, 'maintenance'),
  ('303', 'Suite', 250.00, 'available'),
  ('304', 'Suite', 250.00, 'available'),
  ('305', 'Suite', 250.00, 'occupied'),
  ('401', 'Presidential', 500.00, 'available'),
  ('402', 'Presidential', 500.00, 'available');

-- Seed bookings table
INSERT INTO bookings (guest_id, room_id, check_in_date, check_out_date, total_price, status) 
VALUES
  (1, 3, '2026-03-01', '2026-03-05', 600.00, 'confirmed'),
  (2, 5, '2026-02-28', '2026-03-03', 750.00, 'confirmed'),
  (3, 2, '2026-03-05', '2026-03-08', 450.00, 'confirmed'),
  (4, 6, '2026-03-07', '2026-03-10', 750.00, 'pending'),
  (5, 8, '2026-03-02', '2026-03-06', 680.00, 'confirmed');
