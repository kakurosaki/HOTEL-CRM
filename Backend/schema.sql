-- Drop existing tables if they exist (to start fresh)
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS guests CASCADE;
DROP TABLE IF EXISTS rooms CASCADE;
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

-- Create rooms table
CREATE TABLE rooms (
  id SERIAL PRIMARY KEY,
  room_number VARCHAR(10) UNIQUE NOT NULL,
  room_type VARCHAR(50) NOT NULL CHECK (room_type IN ('Standard', 'Deluxe', 'Suite', 'Presidential')),
  price_per_night DECIMAL(10, 2) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'occupied', 'cleaning', 'maintenance')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create guests table
CREATE TABLE guests (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  phone VARCHAR(20),
  room_id INTEGER NOT NULL REFERENCES rooms(id) ON DELETE RESTRICT,
  check_in_date DATE NOT NULL,
  check_in_time TIME NOT NULL,
  check_out_date DATE NOT NULL,
  check_out_time TIME NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'reserved' CHECK (status IN ('checked-in', 'reserved', 'checked-out')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create bookings table
CREATE TABLE bookings (
  id SERIAL PRIMARY KEY,
  guest_id INTEGER NOT NULL REFERENCES guests(id) ON DELETE CASCADE,
  room_id INTEGER NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  check_in_date DATE NOT NULL,
  check_in_time TIME NOT NULL,
  check_out_date DATE NOT NULL,
  check_out_time TIME NOT NULL,
  total_price DECIMAL(10, 2),
  status VARCHAR(50) DEFAULT 'confirmed',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed staff table
-- Password: admin123 (valid bcrypt hash)
INSERT INTO staff (username, email, password_hashed, name, role) 
VALUES ('admin', 'admin@hotel.com', '$2a$10$XzMZrCZPzKFd37wf3XGbk.EjZUOm2mUJRXKLyIJV4CEVu.zbff7si', 'Admin User', 'admin');

-- Seed rooms table
INSERT INTO rooms (room_number, room_type, price_per_night, status) 
VALUES
  ('101', 'Standard', 120.00, 'available'),
  ('102', 'Standard', 120.00, 'occupied'),
  ('103', 'Standard', 120.00, 'cleaning'),
  ('104', 'Standard', 120.00, 'maintenance'),
  ('201', 'Deluxe', 180.00, 'occupied'),
  ('202', 'Deluxe', 180.00, 'available'),
  ('203', 'Deluxe', 180.00, 'cleaning'),
  ('301', 'Suite', 250.00, 'available'),
  ('302', 'Suite', 250.00, 'maintenance'),
  ('303', 'Suite', 250.00, 'occupied'),
  ('401', 'Presidential', 500.00, 'available'),
  ('402', 'Presidential', 500.00, 'occupied');

-- Seed guests table
INSERT INTO guests (name, email, phone, room_id, check_in_date, check_in_time, check_out_date, check_out_time, status) 
VALUES 
  ('Sarah Johnson', 'sarah.j@email.com', '+1 (555) 123-4567', 5, CURRENT_DATE - INTERVAL '1 day', '14:00', CURRENT_DATE + INTERVAL '2 days', '11:00', 'checked-in'),
  ('Michael Chen', 'mchen@email.com', '+1 (555) 234-5678', 10, CURRENT_DATE, '13:00', CURRENT_DATE + INTERVAL '3 days', '10:00', 'checked-in'),
  ('Emily Rodriguez', 'emily.r@email.com', '+1 (555) 345-6789', 2, CURRENT_DATE + INTERVAL '2 days', '15:00', CURRENT_DATE + INTERVAL '5 days', '10:30', 'reserved'),
  ('David Kim', 'dkim@email.com', '+1 (555) 456-7890', 12, CURRENT_DATE - INTERVAL '5 days', '12:00', CURRENT_DATE - INTERVAL '1 day', '09:00', 'checked-out'),
  ('Jessica Brown', 'jbrown@email.com', '+1 (555) 567-8901', 11, CURRENT_DATE + INTERVAL '4 days', '16:00', CURRENT_DATE + INTERVAL '6 days', '11:30', 'reserved');

-- Seed bookings table
INSERT INTO bookings (guest_id, room_id, check_in_date, check_in_time, check_out_date, check_out_time, total_price, status) 
VALUES
  (1, 5, CURRENT_DATE - INTERVAL '1 day', '14:00', CURRENT_DATE + INTERVAL '2 days', '11:00', 540.00, 'confirmed'),
  (2, 10, CURRENT_DATE, '13:00', CURRENT_DATE + INTERVAL '3 days', '10:00', 750.00, 'confirmed'),
  (3, 2, CURRENT_DATE + INTERVAL '2 days', '15:00', CURRENT_DATE + INTERVAL '5 days', '10:30', 360.00, 'pending'),
  (4, 12, CURRENT_DATE - INTERVAL '5 days', '12:00', CURRENT_DATE - INTERVAL '1 day', '09:00', 2000.00, 'confirmed'),
  (5, 11, CURRENT_DATE + INTERVAL '4 days', '16:00', CURRENT_DATE + INTERVAL '6 days', '11:30', 1000.00, 'confirmed');
