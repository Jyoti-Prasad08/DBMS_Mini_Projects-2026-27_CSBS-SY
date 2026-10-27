"""
Database Access Layer for Smart Parking Management System.
Uses mysql-connector-python with parameterized queries only.
Handles connection management, transactions, stored procedures, triggers, and views.
"""

import os
import datetime
from decimal import Decimal
from typing import List, Dict, Any, Optional, Tuple
import mysql.connector
from mysql.connector import Error

import config
from auth import hash_password, verify_password


class DatabaseManager:
    """Manages MySQL connections and database operations."""

    @staticmethod
    def get_connection():
        """Create and return a new MySQL connection."""
        return mysql.connector.connect(
            host=config.DB_HOST,
            port=config.DB_PORT,
            user=config.DB_USER,
            password=config.DB_PASSWORD,
            database=config.DB_NAME,
            connect_timeout=5,
            autocommit=False
        )

    @classmethod
    def test_connection(cls) -> Tuple[bool, str]:
        """Test whether database connection succeeds."""
        try:
            conn = cls.get_connection()
            if conn.is_connected():
                conn.close()
                return True, "Connected to MySQL successfully."
            return False, "Failed to connect."
        except Exception as e:
            return False, str(e)

    @staticmethod
    def test_custom_credentials(host, port, user, password, database) -> Tuple[bool, str]:
        """Test user-supplied connection credentials."""
        try:
            conn = mysql.connector.connect(
                host=host,
                port=int(port),
                user=user,
                password=password,
                connect_timeout=5
            )
            cur = conn.cursor()
            cur.execute(f"CREATE DATABASE IF NOT EXISTS `{database}`;")
            conn.commit()
            cur.close()
            conn.close()
            return True, "Connection verified successfully!"
        except Exception as e:
            return False, str(e)

    @classmethod
    def initialize_schema_if_needed(cls, sql_path="schema.sql") -> Tuple[bool, str]:
        """
        Execute schema.sql to initialize or reset database.
        Splits by DELIMITER for stored procedures and triggers.
        """
        if not os.path.exists(sql_path):
            return False, f"Schema file not found at {sql_path}"

        try:
            # Connect without specifying database first in case it needs creation
            root_conn = mysql.connector.connect(
                host=config.DB_HOST,
                port=config.DB_PORT,
                user=config.DB_USER,
                password=config.DB_PASSWORD
            )
            root_cur = root_conn.cursor()
            root_cur.execute(f"CREATE DATABASE IF NOT EXISTS {config.DB_NAME};")
            root_conn.commit()
            root_cur.close()
            root_conn.close()

            # Connect to the target database
            conn = cls.get_connection()
            cur = conn.cursor()

            with open(sql_path, "r", encoding="utf-8") as f:
                content = f.read()

            # Custom parser for delimiter blocks (triggers, procedures)
            raw_blocks = content.split("DELIMITER")
            for block in raw_blocks:
                clean_block = block.strip()
                if not clean_block:
                    continue

                if clean_block.startswith("$$"):
                    # Contains routines / triggers delimited by $$
                    routines = clean_block.split("$$")
                    for r in routines:
                        stmt = r.strip()
                        if stmt and stmt != ";":
                            cur.execute(stmt)
                else:
                    # Standard SQL statements delimited by ;
                    stmts = clean_block.split(";")
                    for stmt in stmts:
                        s = stmt.strip()
                        if s:
                            cur.execute(s)

            conn.commit()
            cur.close()
            conn.close()
            return True, "Database initialized successfully."
        except Exception as e:
            return False, f"Failed to initialize database: {str(e)}"


# =============================================================================
# GENERIC QUERY HELPERS (Strictly Parameterized)
# =============================================================================

def fetch_all(query: str, params: Optional[Tuple] = None) -> List[Dict[str, Any]]:
    """Execute a parameterized query and return all rows as list of dicts."""
    conn = DatabaseManager.get_connection()
    try:
        cur = conn.cursor(dictionary=True)
        cur.execute(query, params or ())
        results = cur.fetchall()
        cur.close()
        return results
    finally:
        conn.close()


def fetch_one(query: str, params: Optional[Tuple] = None) -> Optional[Dict[str, Any]]:
    """Execute a parameterized query and return a single row as a dict."""
    conn = DatabaseManager.get_connection()
    try:
        cur = conn.cursor(dictionary=True)
        cur.execute(query, params or ())
        result = cur.fetchone()
        cur.close()
        return result
    finally:
        conn.close()


def execute_dml(query: str, params: Optional[Tuple] = None) -> int:
    """Execute INSERT/UPDATE/DELETE query and commit. Returns lastrowid or affected rows."""
    conn = DatabaseManager.get_connection()
    try:
        cur = conn.cursor()
        cur.execute(query, params or ())
        conn.commit()
        last_id = cur.lastrowid
        cur.close()
        return last_id
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


# =============================================================================
# 1. AUTHENTICATION & USERS
# =============================================================================

def authenticate_user(username: str, password_plain: str) -> Optional[Dict[str, Any]]:
    """Verify user credentials against users table using SHA-256 hash."""
    user = fetch_one(
        "SELECT user_id, username, password_hash, role, full_name FROM users WHERE username = %s",
        (username,)
    )
    if not user:
        return None
    if verify_password(password_plain, user["password_hash"]):
        return user
    return None


def get_all_users() -> List[Dict[str, Any]]:
    """Retrieve all users without exposing raw password hashes."""
    return fetch_all(
        "SELECT user_id, username, role, full_name, created_at FROM users ORDER BY user_id ASC"
    )


def create_user(username: str, password_plain: str, role: str, full_name: str) -> int:
    """Insert a new user with hashed password."""
    pwd_hash = hash_password(password_plain)
    return execute_dml(
        "INSERT INTO users (username, password_hash, role, full_name) VALUES (%s, %s, %s, %s)",
        (username, pwd_hash, role, full_name)
    )


def delete_user(user_id: int) -> None:
    """Delete a user account by ID."""
    execute_dml("DELETE FROM users WHERE user_id = %s", (user_id,))


def update_user_password(user_id: int, new_password_plain: str) -> None:
    """Update password for an existing user."""
    pwd_hash = hash_password(new_password_plain)
    execute_dml(
        "UPDATE users SET password_hash = %s WHERE user_id = %s",
        (pwd_hash, user_id)
    )


# =============================================================================
# 2. DASHBOARD & KPIS
# =============================================================================

def get_dashboard_kpis() -> Dict[str, Any]:
    """
    Fetch system-wide KPIs:
    - Total Slots
    - Available Slots
    - Occupied Slots
    - Reserved Slots
    - Today's Total Revenue
    - Active Vehicles
    """
    conn = DatabaseManager.get_connection()
    try:
        cur = conn.cursor(dictionary=True)

        # Slot counts
        cur.execute("""
            SELECT 
                COUNT(*) AS total_slots,
                SUM(CASE WHEN status = 'Available' THEN 1 ELSE 0 END) AS available_slots,
                SUM(CASE WHEN status = 'Occupied' THEN 1 ELSE 0 END) AS occupied_slots,
                SUM(CASE WHEN status = 'Reserved' THEN 1 ELSE 0 END) AS reserved_slots,
                SUM(CASE WHEN status = 'Maintenance' THEN 1 ELSE 0 END) AS maintenance_slots
            FROM parking_slots
        """)
        slot_kpi = cur.fetchone() or {}

        # Active vehicles
        cur.execute("SELECT COUNT(*) AS active_vehicles FROM parking_records WHERE status = 'Active'")
        active_res = cur.fetchone() or {}

        # Today's Revenue
        cur.execute("""
            SELECT COALESCE(SUM(amount), 0.00) AS today_revenue, COUNT(*) AS today_payments_count
            FROM payments 
            WHERE DATE(payment_time) = CURDATE()
        """)
        revenue_res = cur.fetchone() or {}

        cur.close()

        return {
            "total_slots": slot_kpi.get("total_slots", 0) or 0,
            "available_slots": slot_kpi.get("available_slots", 0) or 0,
            "occupied_slots": slot_kpi.get("occupied_slots", 0) or 0,
            "reserved_slots": slot_kpi.get("reserved_slots", 0) or 0,
            "maintenance_slots": slot_kpi.get("maintenance_slots", 0) or 0,
            "active_vehicles": active_res.get("active_vehicles", 0) or 0,
            "today_revenue": float(revenue_res.get("today_revenue", 0.00)),
            "today_payments_count": revenue_res.get("today_payments_count", 0) or 0
        }
    finally:
        conn.close()


def get_lot_availability_view() -> List[Dict[str, Any]]:
    """Query the database VIEW v_lot_availability for lot capacity summaries."""
    return fetch_all("SELECT * FROM v_lot_availability ORDER BY lot_id ASC")


def get_active_parking_monitor() -> List[Dict[str, Any]]:
    """Query the database VIEW v_active_parking for currently parked vehicles."""
    return fetch_all("SELECT * FROM v_active_parking ORDER BY entry_time DESC")


# =============================================================================
# 3. VEHICLE ENTRY & AUTO-ALLOCATION
# =============================================================================

def find_vehicle_by_plate(plate_number: str) -> Optional[Dict[str, Any]]:
    """Lookup vehicle and owner by plate number."""
    query = """
        SELECT v.vehicle_id, v.plate_number, v.vehicle_type, v.owner_id,
               vo.name AS owner_name, vo.phone AS owner_phone, vo.email AS owner_email
        FROM vehicles v
        JOIN vehicle_owners vo ON v.owner_id = vo.owner_id
        WHERE v.plate_number = %s
    """
    return fetch_one(query, (plate_number.strip().upper(),))


def check_vehicle_already_parked(plate_number: str) -> Optional[Dict[str, Any]]:
    """Check if vehicle is currently inside parking with status 'Active'."""
    query = """
        SELECT pr.record_id, pr.entry_time, ps.slot_number, pl.lot_name
        FROM parking_records pr
        JOIN vehicles v ON pr.vehicle_id = v.vehicle_id
        JOIN parking_slots ps ON pr.slot_id = ps.slot_id
        JOIN parking_lots pl ON ps.lot_id = pl.lot_id
        WHERE v.plate_number = %s AND pr.status = 'Active'
    """
    return fetch_one(query, (plate_number.strip().upper(),))


def find_first_available_slot(lot_id: Optional[int], vehicle_type: str) -> Optional[Dict[str, Any]]:
    """
    Auto-allocate first available slot matching vehicle_type in the given lot
    or across all lots if lot_id is None.
    """
    params = [vehicle_type]
    lot_clause = ""
    if lot_id:
        lot_clause = "AND ps.lot_id = %s"
        params.append(lot_id)

    query = f"""
        SELECT ps.slot_id, ps.slot_number, ps.slot_type, ps.status, pl.lot_id, pl.lot_name
        FROM parking_slots ps
        JOIN parking_lots pl ON ps.lot_id = pl.lot_id
        WHERE ps.status = 'Available'
          AND ps.slot_type = %s
          {lot_clause}
        ORDER BY ps.lot_id ASC, ps.slot_number ASC
        LIMIT 1
    """
    return fetch_one(query, tuple(params))


def register_vehicle_entry(
    plate_number: str,
    vehicle_type: str,
    owner_name: str,
    owner_phone: str,
    owner_email: Optional[str],
    lot_id: Optional[int]
) -> Dict[str, Any]:
    """
    Atomic transaction to register vehicle entry:
    1. Check if vehicle is already parked
    2. Auto-allocate first available slot matching vehicle_type
    3. Find or insert owner
    4. Find or insert vehicle
    5. Insert parking record with status 'Active'
       (Trigger trg_parking_entry_occupied sets slot to 'Occupied' automatically)
    6. Return ticket details
    """
    plate = plate_number.strip().upper()
    existing_park = check_vehicle_already_parked(plate)
    if existing_park:
        raise ValueError(f"Vehicle '{plate}' is already parked in Slot {existing_park['slot_number']} ({existing_park['lot_name']})!")

    slot = find_first_available_slot(lot_id, vehicle_type)
    if not slot:
        raise ValueError(f"No available '{vehicle_type}' slots found in selected parking lot.")

    conn = DatabaseManager.get_connection()
    try:
        cur = conn.cursor(dictionary=True)

        # Step 1: Owner
        cur.execute("SELECT owner_id FROM vehicle_owners WHERE phone = %s", (owner_phone.strip(),))
        owner_row = cur.fetchone()
        if owner_row:
            owner_id = owner_row["owner_id"]
            cur.execute(
                "UPDATE vehicle_owners SET name = %s, email = %s WHERE owner_id = %s",
                (owner_name.strip(), owner_email.strip() if owner_email else None, owner_id)
            )
        else:
            cur.execute(
                "INSERT INTO vehicle_owners (name, phone, email) VALUES (%s, %s, %s)",
                (owner_name.strip(), owner_phone.strip(), owner_email.strip() if owner_email else None)
            )
            owner_id = cur.lastrowid

        # Step 2: Vehicle
        cur.execute("SELECT vehicle_id, vehicle_type FROM vehicles WHERE plate_number = %s", (plate,))
        veh_row = cur.fetchone()
        if veh_row:
            vehicle_id = veh_row["vehicle_id"]
            # Update owner/type if needed
            cur.execute(
                "UPDATE vehicles SET vehicle_type = %s, owner_id = %s WHERE vehicle_id = %s",
                (vehicle_type, owner_id, vehicle_id)
            )
        else:
            cur.execute(
                "INSERT INTO vehicles (plate_number, vehicle_type, owner_id) VALUES (%s, %s, %s)",
                (plate, vehicle_type, owner_id)
            )
            vehicle_id = cur.lastrowid

        # Step 3: Insert Parking Record
        entry_time = datetime.datetime.now()
        cur.execute(
            """
            INSERT INTO parking_records (vehicle_id, slot_id, entry_time, status)
            VALUES (%s, %s, %s, 'Active')
            """,
            (vehicle_id, slot["slot_id"], entry_time)
        )
        record_id = cur.lastrowid

        # Fetch rate from pricing
        cur.execute("SELECT rate_per_hour FROM pricing WHERE vehicle_type = %s", (vehicle_type,))
        rate_row = cur.fetchone()
        rate = float(rate_row["rate_per_hour"]) if rate_row else 20.0

        conn.commit()
        cur.close()

        return {
            "record_id": record_id,
            "plate_number": plate,
            "vehicle_type": vehicle_type,
            "owner_name": owner_name,
            "owner_phone": owner_phone,
            "lot_name": slot["lot_name"],
            "slot_number": slot["slot_number"],
            "slot_id": slot["slot_id"],
            "entry_time": entry_time.strftime("%Y-%m-%d %H:%M:%S"),
            "rate_per_hour": rate
        }
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


# =============================================================================
# 4. VEHICLE EXIT & PAYMENT (Stored Procedure + Trigger)
# =============================================================================

def get_active_parking_by_plate(plate_number: str) -> Optional[Dict[str, Any]]:
    """Retrieve full details of an active parking record for checkout."""
    query = """
        SELECT 
            pr.record_id,
            pr.entry_time,
            pr.status AS record_status,
            v.vehicle_id,
            v.plate_number,
            v.vehicle_type,
            vo.name AS owner_name,
            vo.phone AS owner_phone,
            ps.slot_id,
            ps.slot_number,
            pl.lot_id,
            pl.lot_name,
            pr.entry_time
        FROM parking_records pr
        JOIN vehicles v ON pr.vehicle_id = v.vehicle_id
        JOIN vehicle_owners vo ON v.owner_id = vo.owner_id
        JOIN parking_slots ps ON pr.slot_id = ps.slot_id
        JOIN parking_lots pl ON ps.lot_id = pl.lot_id
        WHERE v.plate_number = %s AND pr.status = 'Active'
    """
    return fetch_one(query, (plate_number.strip().upper(),))


def calculate_parking_fee_sp(record_id: int, exit_time: Optional[datetime.datetime] = None) -> Dict[str, Any]:
    """
    Invokes the MySQL STORED PROCEDURE 'sp_calculate_parking_fee'
    Args: (IN p_record_id, IN p_exit_time, OUT p_duration_minutes, OUT p_billable_hours, OUT p_hourly_rate, OUT p_total_fee)
    """
    conn = DatabaseManager.get_connection()
    try:
        cur = conn.cursor()
        args = [record_id, exit_time, 0, 0, 0.0, 0.0]
        result = cur.callproc("sp_calculate_parking_fee", args)
        cur.close()

        # result indices:
        # 0: record_id, 1: exit_time, 2: duration_minutes, 3: billable_hours, 4: hourly_rate, 5: total_fee
        return {
            "record_id": result[0],
            "exit_time": result[1] or exit_time or datetime.datetime.now(),
            "duration_minutes": int(result[2]),
            "billable_hours": int(result[3]),
            "hourly_rate": float(result[4]),
            "total_fee": float(result[5])
        }
    finally:
        conn.close()


def process_vehicle_exit_and_payment(
    record_id: int,
    exit_time: datetime.datetime,
    amount: float,
    payment_mode: str
) -> Dict[str, Any]:
    """
    Completes parking and records payment atomically:
    1. Updates parking_records status='Completed', exit_time=exit_time
       (Trigger trg_parking_exit_available automatically resets slot status='Available')
    2. Inserts into payments table
    3. Returns exit receipt summary
    """
    if payment_mode not in ("Cash", "UPI", "Card"):
        raise ValueError("Invalid payment mode. Must be Cash, UPI, or Card.")

    conn = DatabaseManager.get_connection()
    try:
        cur = conn.cursor(dictionary=True)

        # Verify active record
        cur.execute(
            """
            SELECT pr.record_id, pr.entry_time, v.plate_number, v.vehicle_type,
                   ps.slot_number, pl.lot_name, vo.name AS owner_name
            FROM parking_records pr
            JOIN vehicles v ON pr.vehicle_id = v.vehicle_id
            JOIN vehicle_owners vo ON v.owner_id = vo.owner_id
            JOIN parking_slots ps ON pr.slot_id = ps.slot_id
            JOIN parking_lots pl ON ps.lot_id = pl.lot_id
            WHERE pr.record_id = %s AND pr.status = 'Active'
            """,
            (record_id,)
        )
        rec = cur.fetchone()
        if not rec:
            raise ValueError(f"No active parking record found for ID {record_id}.")

        # 1. Update parking record to Completed
        cur.execute(
            """
            UPDATE parking_records 
            SET status = 'Completed', exit_time = %s 
            WHERE record_id = %s
            """,
            (exit_time, record_id)
        )

        # 2. Insert payment
        payment_time = exit_time
        cur.execute(
            """
            INSERT INTO payments (record_id, amount, payment_mode, payment_time)
            VALUES (%s, %s, %s, %s)
            """,
            (record_id, amount, payment_mode, payment_time)
        )
        payment_id = cur.lastrowid

        conn.commit()
        cur.close()

        duration = exit_time - rec["entry_time"]
        hours = max(1, int(round((duration.total_seconds() + 3599) // 3600)))

        return {
            "payment_id": payment_id,
            "record_id": record_id,
            "plate_number": rec["plate_number"],
            "vehicle_type": rec["vehicle_type"],
            "owner_name": rec["owner_name"],
            "lot_name": rec["lot_name"],
            "slot_number": rec["slot_number"],
            "entry_time": rec["entry_time"].strftime("%Y-%m-%d %H:%M:%S"),
            "exit_time": exit_time.strftime("%Y-%m-%d %H:%M:%S"),
            "billable_hours": hours,
            "amount": amount,
            "payment_mode": payment_mode,
            "payment_time": payment_time.strftime("%Y-%m-%d %H:%M:%S")
        }
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


# =============================================================================
# 5. SLOT MANAGEMENT
# =============================================================================

def get_all_lots() -> List[Dict[str, Any]]:
    """Retrieve all parking lots."""
    return fetch_all("SELECT lot_id, lot_name, location, total_capacity FROM parking_lots ORDER BY lot_id ASC")


def get_slots_filtered(
    lot_id: Optional[int] = None,
    status: Optional[str] = None,
    slot_type: Optional[str] = None
) -> List[Dict[str, Any]]:
    """Filter parking slots by lot, status, and type."""
    query = """
        SELECT 
            ps.slot_id,
            ps.slot_number,
            ps.slot_type,
            ps.status,
            ps.lot_id,
            pl.lot_name,
            pl.location
        FROM parking_slots ps
        JOIN parking_lots pl ON ps.lot_id = pl.lot_id
        WHERE 1=1
    """
    params = []
    if lot_id and lot_id != 0:
        query += " AND ps.lot_id = %s"
        params.append(lot_id)
    if status and status != "All":
        query += " AND ps.status = %s"
        params.append(status)
    if slot_type and slot_type != "All":
        query += " AND ps.slot_type = %s"
        params.append(slot_type)

    query += " ORDER BY ps.lot_id ASC, ps.slot_number ASC"
    return fetch_all(query, tuple(params))


def add_parking_slot(lot_id: int, slot_number: str, slot_type: str, status: str = "Available") -> int:
    """Add a new slot to a lot and update lot capacity."""
    # Check duplicate
    existing = fetch_one(
        "SELECT slot_id FROM parking_slots WHERE lot_id = %s AND slot_number = %s",
        (lot_id, slot_number.strip().upper())
    )
    if existing:
        raise ValueError(f"Slot '{slot_number}' already exists in this parking lot!")

    conn = DatabaseManager.get_connection()
    try:
        cur = conn.cursor()
        cur.execute(
            """
            INSERT INTO parking_slots (lot_id, slot_number, slot_type, status)
            VALUES (%s, %s, %s, %s)
            """,
            (lot_id, slot_number.strip().upper(), slot_type, status)
        )
        slot_id = cur.lastrowid
        cur.execute("UPDATE parking_lots SET total_capacity = total_capacity + 1 WHERE lot_id = %s", (lot_id,))
        conn.commit()
        cur.close()
        return slot_id
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def update_parking_slot(slot_id: int, slot_number: str, slot_type: str, status: str) -> None:
    """Update an existing slot's attributes."""
    execute_dml(
        """
        UPDATE parking_slots 
        SET slot_number = %s, slot_type = %s, status = %s 
        WHERE slot_id = %s
        """,
        (slot_number.strip().upper(), slot_type, status, slot_id)
    )


def delete_parking_slot(slot_id: int) -> None:
    """Delete a parking slot (only if it has no active parking record)."""
    active = fetch_one("SELECT record_id FROM parking_records WHERE slot_id = %s AND status = 'Active'", (slot_id,))
    if active:
        raise ValueError("Cannot delete slot: A vehicle is currently parked here!")

    slot = fetch_one("SELECT lot_id FROM parking_slots WHERE slot_id = %s", (slot_id,))
    if not slot:
        raise ValueError("Slot not found.")

    conn = DatabaseManager.get_connection()
    try:
        cur = conn.cursor()
        cur.execute("DELETE FROM parking_slots WHERE slot_id = %s", (slot_id,))
        cur.execute("UPDATE parking_lots SET total_capacity = GREATEST(0, total_capacity - 1) WHERE lot_id = %s", (slot["lot_id"],))
        conn.commit()
        cur.close()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


# =============================================================================
# 6. RESERVATIONS
# =============================================================================

def get_reservations(status_filter: Optional[str] = None) -> List[Dict[str, Any]]:
    """Retrieve reservations with vehicle, owner, and slot details."""
    query = """
        SELECT 
            r.reservation_id,
            v.plate_number,
            v.vehicle_type,
            vo.name AS owner_name,
            vo.phone AS owner_phone,
            pl.lot_name,
            ps.slot_number,
            ps.slot_id,
            r.reserve_from,
            r.reserve_to,
            r.status,
            r.created_at
        FROM reservations r
        JOIN vehicles v ON r.vehicle_id = v.vehicle_id
        JOIN vehicle_owners vo ON v.owner_id = vo.owner_id
        JOIN parking_slots ps ON r.slot_id = ps.slot_id
        JOIN parking_lots pl ON ps.lot_id = pl.lot_id
        WHERE 1=1
    """
    params = []
    if status_filter and status_filter != "All":
        query += " AND r.status = %s"
        params.append(status_filter)

    query += " ORDER BY r.reserve_from DESC"
    return fetch_all(query, tuple(params))


def create_reservation(
    plate_number: str,
    vehicle_type: str,
    owner_name: str,
    owner_phone: str,
    owner_email: Optional[str],
    slot_id: int,
    reserve_from: datetime.datetime,
    reserve_to: datetime.datetime
) -> int:
    """Create a reservation and set slot status to 'Reserved' (via trigger)."""
    plate = plate_number.strip().upper()
    conn = DatabaseManager.get_connection()
    try:
        cur = conn.cursor(dictionary=True)

        # Check slot availability
        cur.execute("SELECT status, slot_number FROM parking_slots WHERE slot_id = %s", (slot_id,))
        slot = cur.fetchone()
        if not slot:
            raise ValueError("Selected parking slot does not exist.")
        if slot["status"] != "Available":
            raise ValueError(f"Slot {slot['slot_number']} is currently '{slot['status']}' and cannot be reserved.")

        # Ensure Owner
        cur.execute("SELECT owner_id FROM vehicle_owners WHERE phone = %s", (owner_phone.strip(),))
        owner = cur.fetchone()
        if owner:
            owner_id = owner["owner_id"]
        else:
            cur.execute(
                "INSERT INTO vehicle_owners (name, phone, email) VALUES (%s, %s, %s)",
                (owner_name.strip(), owner_phone.strip(), owner_email.strip() if owner_email else None)
            )
            owner_id = cur.lastrowid

        # Ensure Vehicle
        cur.execute("SELECT vehicle_id FROM vehicles WHERE plate_number = %s", (plate,))
        veh = cur.fetchone()
        if veh:
            vehicle_id = veh["vehicle_id"]
        else:
            cur.execute(
                "INSERT INTO vehicles (plate_number, vehicle_type, owner_id) VALUES (%s, %s, %s)",
                (plate, vehicle_type, owner_id)
            )
            vehicle_id = cur.lastrowid

        # Insert Reservation (Trigger trg_reservation_insert marks slot Reserved)
        cur.execute(
            """
            INSERT INTO reservations (vehicle_id, slot_id, reserve_from, reserve_to, status)
            VALUES (%s, %s, %s, %s, 'Active')
            """,
            (vehicle_id, slot_id, reserve_from, reserve_to)
        )
        res_id = cur.lastrowid

        conn.commit()
        cur.close()
        return res_id
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def cancel_reservation(reservation_id: int) -> None:
    """Cancel a reservation (Trigger trg_reservation_update sets slot to Available)."""
    res = fetch_one("SELECT status FROM reservations WHERE reservation_id = %s", (reservation_id,))
    if not res:
        raise ValueError("Reservation not found.")
    if res["status"] in ("Cancelled", "Completed"):
        raise ValueError(f"Reservation is already {res['status']}.")

    execute_dml(
        "UPDATE reservations SET status = 'Cancelled' WHERE reservation_id = %s",
        (reservation_id,)
    )


# =============================================================================
# 7. PARKING RECORDS & REPORTS
# =============================================================================

def get_parking_history(
    plate_filter: Optional[str] = None,
    status_filter: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None
) -> List[Dict[str, Any]]:
    """Query parking records with optional filters for plate, status, and dates."""
    query = """
        SELECT 
            pr.record_id,
            v.plate_number,
            v.vehicle_type,
            vo.name AS owner_name,
            vo.phone AS owner_phone,
            pl.lot_name,
            ps.slot_number,
            pr.entry_time,
            pr.exit_time,
            pr.status AS record_status,
            COALESCE(p.amount, 0.00) AS payment_amount,
            COALESCE(p.payment_mode, 'Pending') AS payment_mode,
            p.payment_time
        FROM parking_records pr
        JOIN vehicles v ON pr.vehicle_id = v.vehicle_id
        JOIN vehicle_owners vo ON v.owner_id = vo.owner_id
        JOIN parking_slots ps ON pr.slot_id = ps.slot_id
        JOIN parking_lots pl ON ps.lot_id = pl.lot_id
        LEFT JOIN payments p ON pr.record_id = p.record_id
        WHERE 1=1
    """
    params = []
    if plate_filter and plate_filter.strip():
        query += " AND v.plate_number LIKE %s"
        params.append(f"%{plate_filter.strip().upper()}%")
    if status_filter and status_filter != "All":
        query += " AND pr.status = %s"
        params.append(status_filter)
    if date_from and date_from.strip():
        query += " AND DATE(pr.entry_time) >= %s"
        params.append(date_from.strip())
    if date_to and date_to.strip():
        query += " AND DATE(pr.entry_time) <= %s"
        params.append(date_to.strip())

    query += " ORDER BY pr.entry_time DESC"
    return fetch_all(query, tuple(params))


def get_daily_revenue_breakdown() -> List[Dict[str, Any]]:
    """Calculate daily revenue analytics and transaction counts."""
    query = """
        SELECT 
            DATE(payment_time) AS pay_date,
            COUNT(*) AS total_transactions,
            SUM(CASE WHEN payment_mode = 'Cash' THEN amount ELSE 0 END) AS cash_revenue,
            SUM(CASE WHEN payment_mode = 'UPI' THEN amount ELSE 0 END) AS upi_revenue,
            SUM(CASE WHEN payment_mode = 'Card' THEN amount ELSE 0 END) AS card_revenue,
            SUM(amount) AS total_revenue
        FROM payments
        GROUP BY DATE(payment_time)
        ORDER BY pay_date DESC
        LIMIT 30
    """
    return fetch_all(query)


# =============================================================================
# 8. PRICING MANAGEMENT
# =============================================================================

def get_pricing_rates() -> List[Dict[str, Any]]:
    """Retrieve all vehicle pricing rates."""
    return fetch_all("SELECT vehicle_type, rate_per_hour, updated_at FROM pricing ORDER BY vehicle_type ASC")


def update_pricing_rate(vehicle_type: str, rate_per_hour: float) -> None:
    """Update hourly parking rate for vehicle type."""
    if rate_per_hour < 0:
        raise ValueError("Hourly rate cannot be negative.")
    execute_dml(
        "UPDATE pricing SET rate_per_hour = %s WHERE vehicle_type = %s",
        (rate_per_hour, vehicle_type)
    )

