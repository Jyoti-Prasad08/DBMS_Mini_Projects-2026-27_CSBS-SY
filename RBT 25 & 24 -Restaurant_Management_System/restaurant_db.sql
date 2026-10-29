-- =====================================================================
-- Database: restaurant_db
-- Project: Restaurant Management System (DBMS Project)
-- Designed for: MySQL 8.0+
-- Matches ER Diagram (Chen Notation) in 3NF
-- =====================================================================

DROP DATABASE IF EXISTS restaurant_db;
CREATE DATABASE restaurant_db;
USE restaurant_db;

-- ---------------------------------------------------------------------
-- 1. Table: Restaurant
-- ---------------------------------------------------------------------
CREATE TABLE Restaurant (
    restaurant_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    owner VARCHAR(100) NOT NULL,
    address VARCHAR(255) NOT NULL,
    rent DECIMAL(10, 2) NOT NULL DEFAULT 0.00
);

-- ---------------------------------------------------------------------
-- 2. Table: Employee
-- ---------------------------------------------------------------------
CREATE TABLE Employee (
    employee_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    gender ENUM('Male', 'Female', 'Other') NOT NULL,
    dob DATE NOT NULL,
    designation VARCHAR(50) NOT NULL,
    shift ENUM('Morning', 'Evening', 'Night') NOT NULL,
    salary DECIMAL(10, 2) NOT NULL,
    address VARCHAR(255),
    restaurant_id INT NOT NULL,
    FOREIGN KEY (restaurant_id) REFERENCES Restaurant(restaurant_id)
        ON DELETE CASCADE ON UPDATE CASCADE
);

-- ---------------------------------------------------------------------
-- 3. Table: Vendor
-- ---------------------------------------------------------------------
CREATE TABLE Vendor (
    vendor_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    address VARCHAR(255)
);

-- ---------------------------------------------------------------------
-- 4. Table: Employee_Vendor (Relationship: "Talks to" - M:N)
-- ---------------------------------------------------------------------
CREATE TABLE Employee_Vendor (
    employee_id INT NOT NULL,
    vendor_id INT NOT NULL,
    PRIMARY KEY (employee_id, vendor_id),
    FOREIGN KEY (employee_id) REFERENCES Employee(employee_id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (vendor_id) REFERENCES Vendor(vendor_id)
        ON DELETE CASCADE ON UPDATE CASCADE
);

-- ---------------------------------------------------------------------
-- 5. Table: Raw_Material (Relationship: "Supplies" from Vendor - 1:N)
-- ---------------------------------------------------------------------
CREATE TABLE Raw_Material (
    material_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    unit VARCHAR(20) NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    stock_qty DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    vendor_id INT NOT NULL,
    FOREIGN KEY (vendor_id) REFERENCES Vendor(vendor_id)
        ON DELETE CASCADE ON UPDATE CASCADE
);

-- ---------------------------------------------------------------------
-- 6. Table: Menu_Item (Relationship: "Serves" by Restaurant - 1:N)
-- ---------------------------------------------------------------------
CREATE TABLE Menu_Item (
    item_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    restaurant_id INT NOT NULL,
    FOREIGN KEY (restaurant_id) REFERENCES Restaurant(restaurant_id)
        ON DELETE CASCADE ON UPDATE CASCADE
);

-- ---------------------------------------------------------------------
-- 7. Table: Customer
-- ---------------------------------------------------------------------
CREATE TABLE Customer (
    customer_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    phone_number VARCHAR(20) NOT NULL
);

-- ---------------------------------------------------------------------
-- 8. Table: Customer_Email (Multivalued attribute 'email' of Customer)
-- ---------------------------------------------------------------------
CREATE TABLE Customer_Email (
    customer_id INT NOT NULL,
    email VARCHAR(100) NOT NULL,
    PRIMARY KEY (customer_id, email),
    FOREIGN KEY (customer_id) REFERENCES Customer(customer_id)
        ON DELETE CASCADE ON UPDATE CASCADE
);

-- ---------------------------------------------------------------------
-- 9. Table: Orders (Placed by Customer, Received by Restaurant)
-- ---------------------------------------------------------------------
CREATE TABLE Orders (
    order_id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    restaurant_id INT NOT NULL,
    table_number INT NOT NULL,
    order_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    status ENUM('Placed', 'Served', 'Paid') DEFAULT 'Placed',
    total_amount DECIMAL(10, 2) DEFAULT 0.00,
    FOREIGN KEY (customer_id) REFERENCES Customer(customer_id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (restaurant_id) REFERENCES Restaurant(restaurant_id)
        ON DELETE CASCADE ON UPDATE CASCADE
);

-- ---------------------------------------------------------------------
-- 10. Table: Order_Item (Relationship: "Contains" - M:N Orders & Menu_Item)
-- ---------------------------------------------------------------------
CREATE TABLE Order_Item (
    order_id INT NOT NULL,
    item_id INT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    PRIMARY KEY (order_id, item_id),
    FOREIGN KEY (order_id) REFERENCES Orders(order_id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (item_id) REFERENCES Menu_Item(item_id)
        ON DELETE CASCADE ON UPDATE CASCADE
);

-- ---------------------------------------------------------------------
-- 11. Table: Service (Relationship: "Provides" by Restaurant - 1:N)
-- ---------------------------------------------------------------------
CREATE TABLE Service (
    service_id INT AUTO_INCREMENT PRIMARY KEY,
    service_name VARCHAR(100) NOT NULL,
    cost DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    restaurant_id INT NOT NULL,
    FOREIGN KEY (restaurant_id) REFERENCES Restaurant(restaurant_id)
        ON DELETE CASCADE ON UPDATE CASCADE
);

-- ---------------------------------------------------------------------
-- 12. Table: Employee_Service (Relationship: "Performs" - M:N)
-- ---------------------------------------------------------------------
CREATE TABLE Employee_Service (
    employee_id INT NOT NULL,
    service_id INT NOT NULL,
    PRIMARY KEY (employee_id, service_id),
    FOREIGN KEY (employee_id) REFERENCES Employee(employee_id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (service_id) REFERENCES Service(service_id)
        ON DELETE CASCADE ON UPDATE CASCADE
);

-- ---------------------------------------------------------------------
-- 13. Table: Finance (Relationship: "Records" by Restaurant, "Manages" by Employee)
-- ---------------------------------------------------------------------
CREATE TABLE Finance (
    finance_id INT AUTO_INCREMENT PRIMARY KEY,
    restaurant_id INT NOT NULL,
    month_year DATE NOT NULL UNIQUE,
    turnover DECIMAL(12, 2) DEFAULT 0.00,
    rent DECIMAL(10, 2) DEFAULT 0.00,
    bills DECIMAL(10, 2) DEFAULT 0.00,
    employee_salary DECIMAL(10, 2) DEFAULT 0.00,
    raw_material_cost DECIMAL(10, 2) DEFAULT 0.00,
    managed_by INT NULL,
    FOREIGN KEY (restaurant_id) REFERENCES Restaurant(restaurant_id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (managed_by) REFERENCES Employee(employee_id)
        ON DELETE SET NULL ON UPDATE CASCADE
);

-- ---------------------------------------------------------------------
-- 14. Table: Finance_Service (Relationship: "For" - M:N Finance & Service)
-- ---------------------------------------------------------------------
CREATE TABLE Finance_Service (
    finance_id INT NOT NULL,
    service_id INT NOT NULL,
    amount DECIMAL(10, 2) DEFAULT 0.00,
    PRIMARY KEY (finance_id, service_id),
    FOREIGN KEY (finance_id) REFERENCES Finance(finance_id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (service_id) REFERENCES Service(service_id)
        ON DELETE CASCADE ON UPDATE CASCADE
);

-- ---------------------------------------------------------------------
-- 15. Table: Feedback (Relationship: "Gives" by Customer, "About" Orders)
-- ---------------------------------------------------------------------
CREATE TABLE Feedback (
    feedback_id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    order_id INT NULL,
    rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comments TEXT,
    given_on DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES Customer(customer_id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (order_id) REFERENCES Orders(order_id)
        ON DELETE SET NULL ON UPDATE CASCADE
);


-- =====================================================================
-- TRIGGERS: Automated Order Total Calculation
-- =====================================================================
DELIMITER $$

CREATE TRIGGER trg_after_order_item_insert
AFTER INSERT ON Order_Item
FOR EACH ROW
BEGIN
    UPDATE Orders
    SET total_amount = (
        SELECT COALESCE(SUM(oi.quantity * m.price), 0.00)
        FROM Order_Item oi
        JOIN Menu_Item m ON m.item_id = oi.item_id
        WHERE oi.order_id = NEW.order_id
    )
    WHERE order_id = NEW.order_id;
END$$

CREATE TRIGGER trg_after_order_item_update
AFTER UPDATE ON Order_Item
FOR EACH ROW
BEGIN
    UPDATE Orders
    SET total_amount = (
        SELECT COALESCE(SUM(oi.quantity * m.price), 0.00)
        FROM Order_Item oi
        JOIN Menu_Item m ON m.item_id = oi.item_id
        WHERE oi.order_id = NEW.order_id
    )
    WHERE order_id = NEW.order_id;
END$$

CREATE TRIGGER trg_after_order_item_delete
AFTER DELETE ON Order_Item
FOR EACH ROW
BEGIN
    UPDATE Orders
    SET total_amount = (
        SELECT COALESCE(SUM(oi.quantity * m.price), 0.00)
        FROM Order_Item oi
        JOIN Menu_Item m ON m.item_id = oi.item_id
        WHERE oi.order_id = OLD.order_id
    )
    WHERE order_id = OLD.order_id;
END$$

DELIMITER ;


-- =====================================================================
-- VIEWS: Business Intelligence & Reports
-- =====================================================================

-- View 1: Low stock alert (items with stock <= 15 units)
CREATE OR REPLACE VIEW v_low_stock AS
SELECT 
    m.material_id,
    m.name AS material_name,
    m.stock_qty,
    m.unit,
    v.name AS vendor_name,
    v.phone AS vendor_phone
FROM Raw_Material m
JOIN Vendor v ON v.vendor_id = m.vendor_id
WHERE m.stock_qty <= 15.00;

-- View 2: Monthly profit calculation (turnover - total expenses)
CREATE OR REPLACE VIEW v_monthly_profit AS
SELECT 
    f.finance_id,
    f.month_year,
    f.turnover,
    ROUND((f.rent + f.bills + f.employee_salary + f.raw_material_cost + COALESCE(svc.service_cost, 0)), 2) AS total_expense,
    ROUND((f.turnover - (f.rent + f.bills + f.employee_salary + f.raw_material_cost + COALESCE(svc.service_cost, 0))), 2) AS profit
FROM Finance f
LEFT JOIN (
    SELECT finance_id, SUM(amount) AS service_cost
    FROM Finance_Service
    GROUP BY finance_id
) svc ON svc.finance_id = f.finance_id;


-- =====================================================================
-- SAMPLE SEED DATA
-- =====================================================================

-- Restaurant
INSERT INTO Restaurant (restaurant_id, name, owner, address, rent)
VALUES (1, 'Royal Spice Restaurant', 'Bhumi Sharma', '124 Brigade Road, Bangalore', 45000.00);

-- Employees
INSERT INTO Employee (employee_id, name, gender, dob, designation, shift, salary, address, restaurant_id) VALUES
(1, 'Aarav Patel', 'Male', '1990-05-14', 'Manager', 'Morning', 45000.00, 'Indiranagar, Bangalore', 1),
(2, 'Suresh Kumar', 'Male', '1988-11-20', 'Chef', 'Evening', 38000.00, 'Koramangala, Bangalore', 1),
(3, 'Priya Nair', 'Female', '1996-03-22', 'Cashier', 'Morning', 22000.00, 'HSR Layout, Bangalore', 1),
(4, 'Rohan Verma', 'Male', '1998-07-09', 'Waiter', 'Evening', 16000.00, 'BTM Layout, Bangalore', 1),
(5, 'Ananya Sen', 'Female', '1999-09-18', 'Waiter', 'Morning', 16000.00, 'Jayanagar, Bangalore', 1),
(6, 'Ramesh Yadav', 'Male', '1985-02-10', 'Cleaner', 'Night', 14000.00, 'MG Road, Bangalore', 1);

-- Vendors
INSERT INTO Vendor (vendor_id, name, phone, address) VALUES
(1, 'GreenField Fresh Veggies', '9876543210', 'APMC Yard, Yeshwanthpur, Bangalore'),
(2, 'Dairy Gold Supplies', '9876501234', 'Dairy Circle, Bannerghatta Road, Bangalore'),
(3, 'Royal Spice & Dry Goods', '9822334455', 'Chickpet Wholesale Market, Bangalore'),
(4, 'Prime Poultry & Meats', '9811223344', 'Russell Market, Shivajinagar, Bangalore');

-- Employee - Vendor Links ("Talks to")
INSERT INTO Employee_Vendor (employee_id, vendor_id) VALUES
(1, 1),
(1, 2),
(1, 3),
(1, 4),
(2, 1),
(2, 4);

-- Raw Materials
INSERT INTO Raw_Material (material_id, name, unit, unit_price, stock_qty, vendor_id) VALUES
(1, 'Basmati Rice', 'kg', 85.00, 50.00, 3),
(2, 'Paneer', 'kg', 320.00, 8.50, 2),        -- Low stock (< 15)
(3, 'Cooking Oil', 'litre', 140.00, 35.00, 3),
(4, 'Chicken', 'kg', 220.00, 12.00, 4),        -- Low stock (< 15)
(5, 'Fresh Milk', 'litre', 56.00, 6.00, 2),    -- Low stock (< 15)
(6, 'Tomatoes', 'kg', 35.00, 25.00, 1),
(7, 'Onions', 'kg', 40.00, 40.00, 1),
(8, 'Garam Masala', 'packet', 65.00, 18.00, 3);

-- Menu Items
INSERT INTO Menu_Item (item_id, name, category, price, restaurant_id) VALUES
(1, 'Paneer Tikka', 'Starter', 240.00, 1),
(2, 'Chicken Tandoori (Half)', 'Starter', 280.00, 1),
(3, 'Butter Chicken', 'Main Course', 340.00, 1),
(4, 'Paneer Butter Masala', 'Main Course', 290.00, 1),
(5, 'Dal Makhani', 'Main Course', 220.00, 1),
(6, 'Garlic Naan', 'Bread', 55.00, 1),
(7, 'Butter Roti', 'Bread', 30.00, 1),
(8, 'Chicken Dum Biryani', 'Main Course', 320.00, 1),
(9, 'Gulab Jamun (2 pcs)', 'Dessert', 90.00, 1),
(10, 'Mango Lassi', 'Beverage', 110.00, 1),
(11, 'Masala Chai', 'Beverage', 40.00, 1);

-- Customers
INSERT INTO Customer (customer_id, name, phone_number) VALUES
(1, 'Kavya Sharma', '9123456780'),
(2, 'Rahul Mehta', '9234567891'),
(3, 'Sneha Rao', '9345678902'),
(4, 'Vikram Singh', '9456789013'),
(5, 'Deepak Joshi', '9567890124');

-- Customer Emails (Multivalued attribute)
INSERT INTO Customer_Email (customer_id, email) VALUES
(1, 'kavya.sharma@gmail.com'),
(1, 'kavya.work@company.com'),
(2, 'rahul.mehta@outlook.com'),
(3, 'sneha.rao@gmail.com'),
(4, 'vikram.singh@yahoo.com'),
(5, 'deepak.joshi@gmail.com');

-- Orders (Triggers will compute total_amount automatically on Order_Item insert)
INSERT INTO Orders (order_id, customer_id, restaurant_id, table_number, order_time, status) VALUES
(1, 1, 1, 3, '2026-10-10 13:15:00', 'Paid'),
(2, 2, 1, 7, '2026-10-11 19:40:00', 'Paid'),
(3, 3, 1, 2, '2026-10-12 20:10:00', 'Served'),
(4, 4, 1, 5, '2026-10-13 14:05:00', 'Paid'),
(5, 5, 1, 1, '2026-10-14 12:30:00', 'Placed');

-- Order Items (Triggers will fire and update total_amount in Orders)
INSERT INTO Order_Item (order_id, item_id, quantity) VALUES
(1, 1, 1),  -- Paneer Tikka (240)
(1, 4, 1),  -- Paneer Butter Masala (290)
(1, 6, 2),  -- Garlic Naan 2x55 = 110
(1, 10, 2), -- Mango Lassi 2x110 = 220  Total: 860

(2, 2, 1),  -- Chicken Tandoori (280)
(2, 8, 2),  -- Chicken Dum Biryani 2x320 = 640
(2, 9, 2),  -- Gulab Jamun 2x90 = 180   Total: 1100

(3, 3, 1),  -- Butter Chicken (340)
(3, 6, 3),  -- Garlic Naan 3x55 = 165
(3, 10, 1), -- Mango Lassi (110)        Total: 615

(4, 8, 1),  -- Chicken Dum Biryani (320)
(4, 11, 2), -- Masala Chai 2x40 = 80    Total: 400

(5, 1, 1),  -- Paneer Tikka (240)
(5, 5, 1),  -- Dal Makhani (220)
(5, 7, 3);  -- Butter Roti 3x30 = 90    Total: 550

-- Services
INSERT INTO Service (service_id, service_name, cost, restaurant_id) VALUES
(1, 'Kitchen Deep Cleaning', 4500.00, 1),
(2, 'Chimney & Exhaust Maintenance', 3200.00, 1),
(3, 'Pest Control & Sanitization', 2800.00, 1),
(4, 'Food Quality & Safety Audit', 5000.00, 1);

-- Employee - Service Links ("Performs")
INSERT INTO Employee_Service (employee_id, service_id) VALUES
(6, 1),
(6, 3),
(2, 4),
(1, 4);

-- Feedback
INSERT INTO Feedback (feedback_id, customer_id, order_id, rating, comments, given_on) VALUES
(1, 1, 1, 5, 'Exceptional Paneer Tikka and quick service! Highly recommended.', '2026-10-10 14:10:00'),
(2, 2, 2, 4, 'Biryani was delicious and authentic. Gulab Jamun was served hot.', '2026-10-11 20:50:00'),
(3, 4, 4, 5, 'Great lunch ambience and courteous staff.', '2026-10-13 14:45:00');

-- Finance
INSERT INTO Finance (finance_id, restaurant_id, month_year, turnover, rent, bills, employee_salary, raw_material_cost, managed_by) VALUES
(1, 1, '2026-08-01', 320000.00, 45000.00, 18500.00, 151000.00, 68000.00, 1),
(2, 1, '2026-09-01', 345000.00, 45000.00, 19200.00, 151000.00, 72000.00, 1),
(3, 1, '2026-10-01', 280000.00, 45000.00, 16800.00, 151000.00, 59000.00, 1);

-- Finance - Service Links ("For")
INSERT INTO Finance_Service (finance_id, service_id, amount) VALUES
(1, 1, 4500.00),
(1, 3, 2800.00),
(2, 1, 4500.00),
(2, 2, 3200.00),
(3, 1, 4500.00),
(3, 4, 5000.00);
