# Smart Parking Management System (SPMS)
**DBMS Course Project • Relational Database & Tkinter GUI Application**

---

## 🌟 Executive Summary
The **Smart Parking Management System** is a full-featured, enterprise-grade desktop software engineered for commercial multi-lot parking facilities. It is built using **Python 3 (Tkinter/TTK)** for the client interface and **MySQL Server 8.0** for data persistence.

The database is normalized to **Third Normal Form (3NF)** and features **ACID-compliant transactions**, **declarative integrity constraints**, automated **ECA (Event-Condition-Action) Triggers**, a **Stored Procedure** for dynamic bill calculation, an analytical **SQL View** for real-time capacity monitoring, and **Indexes** for high-throughput queries.

---

## 📐 Database Architecture & 3NF Normalization

### Relational Schema
1. **`users`** (`user_id` [PK], `username` [UQ], `password_hash`, `role` [CHECK: 'admin'|'attendant'], `full_name`, `created_at`)
2. **`vehicle_owners`** (`owner_id` [PK], `name`, `phone`, `email`, `created_at`)
3. **`vehicles`** (`vehicle_id` [PK], `plate_number` [UQ, INDEX], `vehicle_type` [CHECK: 'Bike'|'Car'|'Truck'], `owner_id` [FK -> vehicle_owners.owner_id], `created_at`)
4. **`parking_lots`** (`lot_id` [PK], `lot_name` [UQ], `location`, `total_capacity` [CHECK >= 0], `created_at`)
5. **`parking_slots`** (`slot_id` [PK], `lot_id` [FK -> parking_lots.lot_id], `slot_number`, `slot_type` [CHECK: 'Bike'|'Car'|'Truck'], `status` [CHECK: 'Available'|'Occupied'|'Reserved'|'Maintenance'], `UQ(lot_id, slot_number)`)
6. **`parking_records`** (`record_id` [PK], `vehicle_id` [FK -> vehicles.vehicle_id], `slot_id` [FK -> parking_slots.slot_id], `entry_time`, `exit_time`, `status` [CHECK: 'Active'|'Completed'])
7. **`pricing`** (`vehicle_type` [PK], `rate_per_hour` [CHECK >= 0], `updated_at`)
8. **`payments`** (`payment_id` [PK], `record_id` [FK UQ -> parking_records.record_id], `amount` [CHECK >= 0], `payment_mode` [CHECK: 'Cash'|'UPI'|'Card'], `payment_time`)
9. **`reservations`** (`reservation_id` [PK], `vehicle_id` [FK -> vehicles.vehicle_id], `slot_id` [FK -> parking_slots.slot_id], `reserve_from`, `reserve_to`, `status` [CHECK: 'Pending'|'Active'|'Cancelled'|'Completed'])

---

### 3NF Normalization Analysis
* **1NF (First Normal Form)**:
  * Every table column contains only atomic, indivisible values.
  * Every table has an explicit Primary Key.
  * No repeating groups or multivalued attributes.
* **2NF (Second Normal Form)**:
  * Meets 1NF.
  * No partial dependencies. All non-prime attributes are fully functionally dependent on the primary key ($X \to Y$ where $X$ is the entire candidate key).
  * For example, Owner details (`name`, `phone`, `email`) are isolated in `vehicle_owners` rather than redundantly stored in `vehicles`.
* **3NF (Third Normal Form)**:
  * Meets 2NF.
  * No transitive dependencies exist ($X \to Y$ and $Y \to Z$ where $Z$ is non-prime).
  * Hourly parking rates are isolated in the `pricing` relation keyed on `vehicle_type`. Storing rate in `parking_slots` would produce a transitive dependency (`slot_id -> vehicle_type -> rate_per_hour`), violating 3NF.
  * Payment information is isolated in `payments` rather than denormalized into `parking_records`.

---

## ⚙️ Advanced DBMS Concepts Implemented

### 1. Database Triggers (Automated State Transitions)
* **`trg_parking_entry_occupied`**:
  Fires `AFTER INSERT ON parking_records`. When a vehicle checks in with status `'Active'`, the corresponding slot in `parking_slots` is automatically updated to `'Occupied'`.
* **`trg_parking_exit_available`**:
  Fires `AFTER UPDATE ON parking_records`. When an active parking record transitions to status `'Completed'`, the slot status is automatically freed back to `'Available'`.
* **`trg_reservation_insert`**:
  Fires `AFTER INSERT ON reservations`. Automatically marks the slot as `'Reserved'` when an active reservation is registered.
* **`trg_reservation_update`**:
  Fires `AFTER UPDATE ON reservations`. If a reservation is cancelled or marked completed, the slot is freed back to `'Available'`.

### 2. Stored Procedure (`sp_calculate_parking_fee`)
* Encapsulates duration and fee computation directly on the MySQL engine:
  $$\text{duration\_minutes} = \text{TIMESTAMPDIFF(MINUTE, entry\_time, exit\_time)}$$
  $$\text{billable\_hours} = \lceil \text{duration\_minutes} / 60 \rceil \quad (\min = 1)$$
  $$\text{total\_fee} = \text{billable\_hours} \times \text{rate\_per\_hour}$$
* Invoked dynamically at vehicle checkout via `cursor.callproc()`.

### 3. Database Views
* **`v_lot_availability`**: Aggregates capacity, available slots, occupied slots, reserved slots, maintenance slots, and occupancy percentage per lot via conditional `SUM(CASE ...)` aggregation.
* **`v_active_parking`**: Joins `parking_records`, `vehicles`, `vehicle_owners`, `parking_slots`, and `parking_lots` to present real-time active parking telemetry.

### 4. Indexing & Query Optimization
* **`idx_vehicle_plate`**: B-Tree index on `vehicles(plate_number)` for $O(\log N)$ license plate lookups.
* **`idx_records_status`**: Index on `parking_records(status)` for instantaneous checkout searches.
* **`idx_slots_lot_type_status`**: Composite index on `parking_slots(lot_id, slot_type, status)` for fast auto-allocation of available slots.

---

## 🖥 GUI Application Structure & Features

```
e:\DBMS\
├── Start_Smart_Parking.bat # One-click Windows launcher (checks Python & packages, starts app)
├── Start_Silent.vbs        # Silent one-click Windows launcher (no background black console)
├── run.bat                 # Convenient short-name click-to-run batch file
├── check_database.bat      # One-click inspector to check all MySQL tables, views & triggers
├── check_database.py       # Python database inspection script
├── schema.sql              # MySQL DDL, Triggers, Stored Procedure, Views, Seed Data
├── config.py               # Database credentials, UI theme colors & fonts
├── auth.py                 # SHA-256 password hashing & UserSession state
├── db.py                   # Parameterized query engine, connection management & transactions
├── main.py                 # Application entry point & ttk.Notebook orchestrator
├── test_system.py          # Automated verification test suite (7 suites)
├── login_screen.py         # Modal login window with admin/attendant roles
├── dashboard_screen.py     # Live KPI cards, View v_lot_availability & active monitor
├── vehicle_entry_screen.py # Auto-allocation algorithm, owner lookup, ticket generator
├── vehicle_exit_screen.py  # Fee calculation via SP, payment checkout, invoice generator
├── slot_management_screen.py # Color-coded visual grid (Green/Red/Orange/Gray) & CRUD
├── reservations_screen.py  # Slot reservation booking & cancellation
├── reports_screen.py       # Parking history search/filters, revenue report, CSV export
└── admin_screen.py         # Pricing management, user accounts, DB re-seed utility
```

### Key Modules:
1. **Login Screen**:
   * Role-based access control (Admin vs. Attendant).
   * Verifies SHA-256 hashed passwords.
   * Demo chips for instant one-click credential filling.
2. **Dashboard**:
   * Real-time KPI tiles: Total Slots, Available Slots, Occupied Slots, Reserved Slots, Active Vehicles, Today's Total Revenue.
   * Lot capacity & utilization table populated directly from the `v_lot_availability` view.
   * Live active vehicles monitor from `v_active_parking`.
3. **Vehicle Entry**:
   * Auto-detection: Typing an existing plate number automatically fetches owner name, phone, and vehicle type.
   * Auto-allocation: Finds the first available slot matching the vehicle type (Car/Bike/Truck) in the selected lot.
   * Duplicate prevention: Flags an error if a vehicle is already parked.
   * Printable Parking Ticket summary card with a "Save / Print Ticket (.txt)" button.
4. **Vehicle Exit & Payment**:
   * Search by license plate or pick directly from the active vehicles treeview.
   * Calls MySQL Stored Procedure `sp_calculate_parking_fee` to compute exact duration and rounded-up billable hours.
   * Supports Cash, UPI, and Card payment methods.
   * Generates a formal Receipt/Invoice summary card with "Save Receipt (.txt)".
5. **Slot Management**:
   * Interactive **Color-Coded Visual Map**:
     * 🟢 **Green** (`#16a34a`): Available
     * 🔴 **Red** (`#dc2626`): Occupied
     * 🟠 **Orange** (`#ea580c`): Reserved
     * ⚪ **Gray** (`#64748b`): Maintenance
   * Filter slots by lot, status, or vehicle type.
   * **Role-Protected**: Admins can Add, Edit, Delete, or toggle Maintenance on slots. Attendants have read-only access.
6. **Reservations**:
   * Book advance slots by selecting lot, available slot, vehicle, and reservation time window.
   * Cancelling a reservation automatically reverts the slot status to 'Available'.
7. **Records & Reports**:
   * Search and filter parking records by plate number, status (Active/Completed), and date range (YYYY-MM-DD).
   * Daily Revenue Analytics breakdown showing transaction counts and revenue by payment mode (Cash, UPI, Card).
   * **Export to CSV**: Export filtered parking history or daily revenue reports with a single click.
8. **Admin Panel**:
   * Accessible only to `admin` role.
   * Hourly Pricing Management: Update rates for Bike, Car, and Truck.
   * User Management: View users, create new accounts with SHA-256 hashed passwords, delete users, reset passwords.
   * Database Reset Utility: Re-run `schema.sql` to re-seed demo data safely.

---

## 🚀 Quickstart Guide

### 1. Prerequisites
* Python 3.10+
* MySQL Server 8.0+
* `mysql-connector-python` library:
  ```bash
  pip install mysql-connector-python
  ```

### 2. Database Setup
Ensure MySQL is running on `localhost:3306`. By default, `config.py` connects with:
* Host: `localhost`
* Port: `3306`
* User: `root`
* Password: `1234`
* Database: `smart_parking_db`

You can change these in `config.py` or export environment variables:
```bash
set SPMS_DB_PASSWORD=your_password
```

Initialize the database schema:
```powershell
Get-Content schema.sql | mysql -u root -p1234
```
*(Or let `main.py` auto-initialize it on first startup).*

### 3. Run Automated Tests
Execute the comprehensive test suite to verify all triggers, procedures, views, and constraints:
```bash
python test_system.py
```

### 4. Launch the GUI Application
Double-click [`Start_Smart_Parking.bat`](file:///e:/DBMS/Start_Smart_Parking.bat) in File Explorer, or run:
```bash
python main.py
```
*(Or double-click [`Start_Silent.vbs`](file:///e:/DBMS/Start_Silent.vbs) if you want to run the app silently without any command prompt window).*

---

## 🔑 Default Credentials

| Role | Username | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin` | `admin123` | Full access (CRUD slots, manage pricing, manage users, DB reset) |
| **Attendant 1** | `attendant1` | `staff123` | Standard operations (Entry, Exit, View slots, Reservations, Reports) |
| **Attendant 2** | `attendant2` | `staff123` | Standard operations (Entry, Exit, View slots, Reservations, Reports) |

---

## 🛡️ Security & Integrity Highlights
* **Zero SQL Injection**: 100% of database operations use parameterized queries (`%s` placeholders).
* **Cryptographic Hashing**: User passwords are stored using SHA-256 message digests.
* **Declarative Constraints**: `CHECK` constraints on role, vehicle types, slot statuses, and payment modes guarantee invalid data cannot enter the database at the engine level.
* **Referential Integrity**: Cascading updates and restricted deletes prevent orphaned records.

