-- =============================================================================
-- SMART PARKING MANAGEMENT SYSTEM
-- Database Schema (Normalized to 3NF)
-- Compatible with MySQL 8.0+
-- =============================================================================

CREATE DATABASE IF NOT EXISTS smart_parking_db;
USE smart_parking_db;

-- Drop existing views, triggers, procedures and tables (in dependency order)
DROP VIEW IF EXISTS v_active_parking;
DROP VIEW IF EXISTS v_lot_availability;
DROP PROCEDURE IF EXISTS sp_calculate_parking_fee;
DROP TRIGGER IF EXISTS trg_parking_entry_occupied;
DROP TRIGGER IF EXISTS trg_parking_exit_available;
DROP TRIGGER IF EXISTS trg_reservation_insert;
DROP TRIGGER IF EXISTS trg_reservation_update;

DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS reservations;
DROP TABLE IF EXISTS parking_records;
DROP TABLE IF EXISTS parking_slots;
DROP TABLE IF EXISTS parking_lots;
DROP TABLE IF EXISTS vehicles;
DROP TABLE IF EXISTS vehicle_owners;
DROP TABLE IF EXISTS pricing;
DROP TABLE IF EXISTS users;

-- =============================================================================
-- 1. USERS TABLE (Authentication & Role Management)
-- =============================================================================
CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(256) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'attendant',
    full_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_user_role CHECK (role IN ('admin', 'attendant'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =============================================================================
-- 2. VEHICLE OWNERS TABLE
-- =============================================================================
CREATE TABLE vehicle_owners (
    owner_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(100) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =============================================================================
-- 3. VEHICLES TABLE
-- =============================================================================
CREATE TABLE vehicles (
    vehicle_id INT AUTO_INCREMENT PRIMARY KEY,
    plate_number VARCHAR(20) NOT NULL UNIQUE,
    vehicle_type VARCHAR(20) NOT NULL,
    owner_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_vehicle_type CHECK (vehicle_type IN ('Bike', 'Car', 'Truck')),
    CONSTRAINT fk_vehicles_owner FOREIGN KEY (owner_id) 
        REFERENCES vehicle_owners(owner_id) 
        ON UPDATE CASCADE 
        ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Explicit index on plate_number
CREATE INDEX idx_vehicle_plate ON vehicles(plate_number);

-- =============================================================================
-- 4. PARKING LOTS TABLE
-- =============================================================================
CREATE TABLE parking_lots (
    lot_id INT AUTO_INCREMENT PRIMARY KEY,
    lot_name VARCHAR(100) NOT NULL UNIQUE,
    location VARCHAR(200) NOT NULL,
    total_capacity INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_lot_capacity CHECK (total_capacity >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =============================================================================
-- 5. PARKING SLOTS TABLE
-- =============================================================================
CREATE TABLE parking_slots (
    slot_id INT AUTO_INCREMENT PRIMARY KEY,
    lot_id INT NOT NULL,
    slot_number VARCHAR(20) NOT NULL,
    slot_type VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Available',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_lot_slot UNIQUE (lot_id, slot_number),
    CONSTRAINT chk_slot_type CHECK (slot_type IN ('Bike', 'Car', 'Truck')),
    CONSTRAINT chk_slot_status CHECK (status IN ('Available', 'Occupied', 'Reserved', 'Maintenance')),
    CONSTRAINT fk_slots_lot FOREIGN KEY (lot_id) 
        REFERENCES parking_lots(lot_id) 
        ON UPDATE CASCADE 
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_slots_lot_type_status ON parking_slots(lot_id, slot_type, status);

-- =============================================================================
-- 6. PRICING TABLE
-- =============================================================================
CREATE TABLE pricing (
    vehicle_type VARCHAR(20) PRIMARY KEY,
    rate_per_hour DECIMAL(10, 2) NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT chk_pricing_type CHECK (vehicle_type IN ('Bike', 'Car', 'Truck')),
    CONSTRAINT chk_pricing_rate CHECK (rate_per_hour >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =============================================================================
-- 7. PARKING RECORDS TABLE
-- =============================================================================
CREATE TABLE parking_records (
    record_id INT AUTO_INCREMENT PRIMARY KEY,
    vehicle_id INT NOT NULL,
    slot_id INT NOT NULL,
    entry_time DATETIME NOT NULL,
    exit_time DATETIME NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_record_status CHECK (status IN ('Active', 'Completed')),
    CONSTRAINT fk_records_vehicle FOREIGN KEY (vehicle_id) 
        REFERENCES vehicles(vehicle_id) 
        ON UPDATE CASCADE 
        ON DELETE RESTRICT,
    CONSTRAINT fk_records_slot FOREIGN KEY (slot_id) 
        REFERENCES parking_slots(slot_id) 
        ON UPDATE CASCADE 
        ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_records_status ON parking_records(status);
CREATE INDEX idx_records_entry ON parking_records(entry_time);

-- =============================================================================
-- 8. PAYMENTS TABLE
-- =============================================================================
CREATE TABLE payments (
    payment_id INT AUTO_INCREMENT PRIMARY KEY,
    record_id INT NOT NULL UNIQUE,
    amount DECIMAL(10, 2) NOT NULL,
    payment_mode VARCHAR(20) NOT NULL,
    payment_time DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_payment_mode CHECK (payment_mode IN ('Cash', 'UPI', 'Card')),
    CONSTRAINT chk_payment_amount CHECK (amount >= 0),
    CONSTRAINT fk_payments_record FOREIGN KEY (record_id) 
        REFERENCES parking_records(record_id) 
        ON UPDATE CASCADE 
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =============================================================================
-- 9. RESERVATIONS TABLE
-- =============================================================================
CREATE TABLE reservations (
    reservation_id INT AUTO_INCREMENT PRIMARY KEY,
    vehicle_id INT NOT NULL,
    slot_id INT NOT NULL,
    reserve_from DATETIME NOT NULL,
    reserve_to DATETIME NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_reservation_status CHECK (status IN ('Pending', 'Active', 'Cancelled', 'Completed')),
    CONSTRAINT fk_res_vehicle FOREIGN KEY (vehicle_id) 
        REFERENCES vehicles(vehicle_id) 
        ON UPDATE CASCADE 
        ON DELETE RESTRICT,
    CONSTRAINT fk_res_slot FOREIGN KEY (slot_id) 
        REFERENCES parking_slots(slot_id) 
        ON UPDATE CASCADE 
        ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =============================================================================
-- TRIGGERS
-- =============================================================================

-- Trigger: Automatically set slot status to 'Occupied' when a vehicle enters
DELIMITER $$
CREATE TRIGGER trg_parking_entry_occupied
AFTER INSERT ON parking_records
FOR EACH ROW
BEGIN
    IF NEW.status = 'Active' THEN
        UPDATE parking_slots
        SET status = 'Occupied'
        WHERE slot_id = NEW.slot_id;
    END IF;
END$$

-- Trigger: Automatically set slot status to 'Available' when vehicle completes exit
CREATE TRIGGER trg_parking_exit_available
AFTER UPDATE ON parking_records
FOR EACH ROW
BEGIN
    IF NEW.status = 'Completed' AND OLD.status = 'Active' THEN
        UPDATE parking_slots
        SET status = 'Available'
        WHERE slot_id = NEW.slot_id;
    END IF;
END$$

-- Trigger: Set slot status to 'Reserved' when a reservation is active
CREATE TRIGGER trg_reservation_insert
AFTER INSERT ON reservations
FOR EACH ROW
BEGIN
    IF NEW.status = 'Active' THEN
        UPDATE parking_slots
        SET status = 'Reserved'
        WHERE slot_id = NEW.slot_id AND status = 'Available';
    END IF;
END$$

-- Trigger: Free slot when reservation is cancelled or completed
CREATE TRIGGER trg_reservation_update
AFTER UPDATE ON reservations
FOR EACH ROW
BEGIN
    IF NEW.status IN ('Cancelled', 'Completed') AND OLD.status = 'Active' THEN
        UPDATE parking_slots
        SET status = 'Available'
        WHERE slot_id = NEW.slot_id AND status = 'Reserved';
    END IF;
END$$
DELIMITER ;

-- =============================================================================
-- STORED PROCEDURE
-- Calculate Parking Fee (Hours rounded up * rate_per_hour)
-- =============================================================================
DELIMITER $$
CREATE PROCEDURE sp_calculate_parking_fee(
    IN p_record_id INT,
    IN p_exit_time DATETIME,
    OUT p_duration_minutes INT,
    OUT p_billable_hours INT,
    OUT p_hourly_rate DECIMAL(10,2),
    OUT p_total_fee DECIMAL(10,2)
)
BEGIN
    DECLARE v_entry_time DATETIME;
    DECLARE v_vehicle_type VARCHAR(20);
    DECLARE v_rate DECIMAL(10,2) DEFAULT 0.00;
    DECLARE v_minutes INT DEFAULT 0;
    DECLARE v_hours INT DEFAULT 1;

    -- Fetch entry time and vehicle type
    SELECT pr.entry_time, v.vehicle_type
    INTO v_entry_time, v_vehicle_type
    FROM parking_records pr
    JOIN vehicles v ON pr.vehicle_id = v.vehicle_id
    WHERE pr.record_id = p_record_id;

    IF v_entry_time IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Parking record not found';
    END IF;

    -- If exit time not specified, use current timestamp
    IF p_exit_time IS NULL THEN
        SET p_exit_time = NOW();
    END IF;

    -- Fetch rate for the vehicle type
    SELECT rate_per_hour INTO v_rate
    FROM pricing
    WHERE vehicle_type = v_vehicle_type;

    IF v_rate IS NULL THEN
        SET v_rate = 20.00;
    END IF;

    -- Calculate duration in minutes (minimum 1 minute)
    SET v_minutes = TIMESTAMPDIFF(MINUTE, v_entry_time, p_exit_time);
    IF v_minutes <= 0 THEN
        SET v_minutes = 1;
    END IF;

    -- Billable hours: ceiling of minutes / 60, minimum 1 hour
    SET v_hours = CEIL(v_minutes / 60.0);
    IF v_hours < 1 THEN
        SET v_hours = 1;
    END IF;

    SET p_duration_minutes = v_minutes;
    SET p_billable_hours = v_hours;
    SET p_hourly_rate = v_rate;
    SET p_total_fee = v_hours * v_rate;
END$$
DELIMITER ;

-- =============================================================================
-- VIEWS
-- =============================================================================

-- View 1: Current slot availability per lot
CREATE OR REPLACE VIEW v_lot_availability AS
SELECT 
    pl.lot_id,
    pl.lot_name,
    pl.location,
    pl.total_capacity,
    COUNT(ps.slot_id) AS total_slots,
    SUM(CASE WHEN ps.status = 'Available' THEN 1 ELSE 0 END) AS available_slots,
    SUM(CASE WHEN ps.status = 'Occupied' THEN 1 ELSE 0 END) AS occupied_slots,
    SUM(CASE WHEN ps.status = 'Reserved' THEN 1 ELSE 0 END) AS reserved_slots,
    SUM(CASE WHEN ps.status = 'Maintenance' THEN 1 ELSE 0 END) AS maintenance_slots,
    ROUND(
        (SUM(CASE WHEN ps.status = 'Occupied' THEN 1 ELSE 0 END) / NULLIF(COUNT(ps.slot_id), 0)) * 100, 
        1
    ) AS occupancy_rate_pct
FROM parking_lots pl
LEFT JOIN parking_slots ps ON pl.lot_id = ps.lot_id
GROUP BY pl.lot_id, pl.lot_name, pl.location, pl.total_capacity;

-- View 2: Active Parking Monitor
CREATE OR REPLACE VIEW v_active_parking AS
SELECT 
    pr.record_id,
    v.plate_number,
    v.vehicle_type,
    vo.name AS owner_name,
    vo.phone AS owner_phone,
    pl.lot_name,
    ps.slot_number,
    ps.slot_id,
    pr.entry_time,
    TIMESTAMPDIFF(MINUTE, pr.entry_time, NOW()) AS parked_duration_mins
FROM parking_records pr
JOIN vehicles v ON pr.vehicle_id = v.vehicle_id
JOIN vehicle_owners vo ON v.owner_id = vo.owner_id
JOIN parking_slots ps ON pr.slot_id = ps.slot_id
JOIN parking_lots pl ON ps.lot_id = pl.lot_id
WHERE pr.status = 'Active';

-- =============================================================================
-- SAMPLE DATA INSERTION
-- =============================================================================

-- Users (admin: admin123, attendant: staff123)
-- SHA-256 hashes:
-- 'admin123' -> '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9'
-- 'staff123' -> '10176e7b7b24d317acfcf8d2064cfd2f24e154f7b5a96603077d5ef813d6a6b6'
INSERT INTO users (username, password_hash, role, full_name) VALUES
('admin', '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', 'admin', 'System Administrator'),
('attendant1', '10176e7b7b24d317acfcf8d2064cfd2f24e154f7b5a96603077d5ef813d6a6b6', 'attendant', 'John Doe (Attendant)'),
('attendant2', '10176e7b7b24d317acfcf8d2064cfd2f24e154f7b5a96603077d5ef813d6a6b6', 'attendant', 'Jane Smith (Attendant)');

-- Pricing
INSERT INTO pricing (vehicle_type, rate_per_hour) VALUES
('Bike', 20.00),
('Car', 50.00),
('Truck', 100.00);

-- Parking Lots (3 Lots)
INSERT INTO parking_lots (lot_name, location, total_capacity) VALUES
('North Wing Plaza (Lot A)', 'Terminal 1 - North Gate', 10),
('Central Hub Tower (Lot B)', 'Main Commercial Hub - Level G', 10),
('South Express Deck (Lot C)', 'South Cargo & Express Hub', 10);

-- Parking Slots (30 slots: 10 per lot)
-- Lot 1 (Lot A)
INSERT INTO parking_slots (lot_id, slot_number, slot_type, status) VALUES
(1, 'A-B01', 'Bike', 'Available'),
(1, 'A-B02', 'Bike', 'Available'),
(1, 'A-B03', 'Bike', 'Available'),
(1, 'A-C01', 'Car', 'Available'),
(1, 'A-C02', 'Car', 'Available'),
(1, 'A-C03', 'Car', 'Available'),
(1, 'A-C04', 'Car', 'Available'),
(1, 'A-C05', 'Car', 'Available'),
(1, 'A-T01', 'Truck', 'Available'),
(1, 'A-T02', 'Truck', 'Available');

-- Lot 2 (Lot B)
INSERT INTO parking_slots (lot_id, slot_number, slot_type, status) VALUES
(2, 'B-B01', 'Bike', 'Available'),
(2, 'B-B02', 'Bike', 'Available'),
(2, 'B-B03', 'Bike', 'Available'),
(2, 'B-C01', 'Car', 'Available'),
(2, 'B-C02', 'Car', 'Available'),
(2, 'B-C03', 'Car', 'Available'),
(2, 'B-C04', 'Car', 'Available'),
(2, 'B-C05', 'Car', 'Available'),
(2, 'B-T01', 'Truck', 'Available'),
(2, 'B-T02', 'Truck', 'Maintenance');

-- Lot 3 (Lot C)
INSERT INTO parking_slots (lot_id, slot_number, slot_type, status) VALUES
(3, 'C-B01', 'Bike', 'Available'),
(3, 'C-B02', 'Bike', 'Available'),
(3, 'C-B03', 'Bike', 'Available'),
(3, 'C-C01', 'Car', 'Available'),
(3, 'C-C02', 'Car', 'Available'),
(3, 'C-C03', 'Car', 'Available'),
(3, 'C-C04', 'Car', 'Available'),
(3, 'C-C05', 'Car', 'Available'),
(3, 'C-T01', 'Truck', 'Available'),
(3, 'C-T02', 'Truck', 'Available');

-- Vehicle Owners (10 owners)
INSERT INTO vehicle_owners (name, phone, email) VALUES
('Aarav Sharma', '+91 98765 43210', 'aarav.sharma@example.com'),
('Priya Patel', '+91 98123 45678', 'priya.patel@example.com'),
('Rahul Verma', '+91 97234 56789', 'rahul.verma@example.com'),
('Sneha Rao', '+91 96345 67890', 'sneha.rao@example.com'),
('Vikram Singh', '+91 95456 78901', 'vikram.singh@example.com'),
('Ananya Gupta', '+91 94567 89012', 'ananya.gupta@example.com'),
('Karthik Nair', '+91 93678 90123', 'karthik.nair@example.com'),
('Meera Joshi', '+91 92789 01234', 'meera.joshi@example.com'),
('Rohan Malhotra', '+91 91890 12345', 'rohan.m@example.com'),
('Kavita Deshmukh', '+91 90901 23456', 'kavita.d@example.com');

-- Vehicles (10 vehicles)
INSERT INTO vehicles (plate_number, vehicle_type, owner_id) VALUES
('MH-12-AB-1001', 'Car', 1),
('DL-01-XY-2002', 'Bike', 2),
('KA-03-CD-3003', 'Car', 3),
('TS-07-EF-4004', 'Truck', 4),
('MH-02-GH-5005', 'Car', 5),
('TN-09-JK-6006', 'Bike', 6),
('KA-05-MN-7007', 'Car', 7),
('HR-26-PQ-8008', 'Truck', 8),
('GJ-01-RS-9009', 'Car', 9),
('UP-32-TU-0110', 'Bike', 10);

-- Past Completed Parking Records & Payments
-- Record 1: Completed Car parking
INSERT INTO parking_records (vehicle_id, slot_id, entry_time, exit_time, status) VALUES
(1, 4, DATE_SUB(NOW(), INTERVAL 5 HOUR), DATE_SUB(NOW(), INTERVAL 2 HOUR), 'Completed');
INSERT INTO payments (record_id, amount, payment_mode, payment_time) VALUES
(1, 150.00, 'UPI', DATE_SUB(NOW(), INTERVAL 2 HOUR));

-- Record 2: Completed Bike parking
INSERT INTO parking_records (vehicle_id, slot_id, entry_time, exit_time, status) VALUES
(2, 1, DATE_SUB(NOW(), INTERVAL 4 HOUR), DATE_SUB(NOW(), INTERVAL 1 HOUR), 'Completed');
INSERT INTO payments (record_id, amount, payment_mode, payment_time) VALUES
(2, 60.00, 'Cash', DATE_SUB(NOW(), INTERVAL 1 HOUR));

-- Record 3: Completed Truck parking
INSERT INTO parking_records (vehicle_id, slot_id, entry_time, exit_time, status) VALUES
(4, 9, DATE_SUB(NOW(), INTERVAL 8 HOUR), DATE_SUB(NOW(), INTERVAL 4 HOUR), 'Completed');
INSERT INTO payments (record_id, amount, payment_mode, payment_time) VALUES
(3, 400.00, 'Card', DATE_SUB(NOW(), INTERVAL 4 HOUR));

-- Active Parking Records (Triggers will automatically set slot status to 'Occupied'!)
-- Vehicle 3 (Car) in Lot A slot A-C02 (slot_id=5)
INSERT INTO parking_records (vehicle_id, slot_id, entry_time, exit_time, status) VALUES
(3, 5, DATE_SUB(NOW(), INTERVAL 125 MINUTE), NULL, 'Active');

-- Vehicle 5 (Car) in Lot B slot B-C01 (slot_id=14)
INSERT INTO parking_records (vehicle_id, slot_id, entry_time, exit_time, status) VALUES
(5, 14, DATE_SUB(NOW(), INTERVAL 45 MINUTE), NULL, 'Active');

-- Vehicle 6 (Bike) in Lot C slot C-B01 (slot_id=21)
INSERT INTO parking_records (vehicle_id, slot_id, entry_time, exit_time, status) VALUES
(6, 21, DATE_SUB(NOW(), INTERVAL 80 MINUTE), NULL, 'Active');

-- Reservations (Trigger sets slot to 'Reserved' for Active reservation!)
-- Vehicle 7 reserves Lot A slot A-C03 (slot_id=6)
INSERT INTO reservations (vehicle_id, slot_id, reserve_from, reserve_to, status) VALUES
(7, 6, DATE_ADD(NOW(), INTERVAL 1 HOUR), DATE_ADD(NOW(), INTERVAL 5 HOUR), 'Active');

-- Vehicle 8 has a pending reservation in Lot B slot B-T01 (slot_id=19)
INSERT INTO reservations (vehicle_id, slot_id, reserve_from, reserve_to, status) VALUES
(8, 19, DATE_ADD(NOW(), INTERVAL 3 HOUR), DATE_ADD(NOW(), INTERVAL 8 HOUR), 'Pending');

