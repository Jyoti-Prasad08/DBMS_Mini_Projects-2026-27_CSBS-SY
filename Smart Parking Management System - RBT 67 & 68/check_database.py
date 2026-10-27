"""
Interactive MySQL Database Inspector for Smart Parking Management System.
Run this script to inspect tables, row counts, views, triggers, and procedures.
"""

import config
import db


def inspect_database():
    print("=" * 70)
    print("      SMART PARKING MANAGEMENT SYSTEM - DATABASE INSPECTOR")
    print("=" * 70)
    print(f"Target Database : {config.DB_NAME}")
    print(f"Host / Port     : {config.DB_HOST}:{config.DB_PORT}")
    print(f"User            : {config.DB_USER}")
    print("-" * 70)

    conn = db.DatabaseManager.get_connection()
    cur = conn.cursor(dictionary=True)

    # 1. Tables and Row Counts
    print("\n[1] TABLES & ROW COUNTS:")
    print(f"{'Table Name':<25} {'Row Count':<12}")
    print("-" * 37)

    tables = [
        "users", "vehicle_owners", "vehicles", "parking_lots",
        "parking_slots", "pricing", "parking_records", "payments", "reservations"
    ]
    for tbl in tables:
        cur.execute(f"SELECT COUNT(*) AS cnt FROM {tbl}")
        row = cur.fetchone()
        cnt = row["cnt"] if row else 0
        print(f"  {tbl:<23} : {cnt} rows")

    # 2. Database Views
    print("\n[2] DATABASE VIEWS:")
    print("  * v_lot_availability (Lot capacity & live occupancy metrics)")
    print("  * v_active_parking   (Real-time active parking telemetry)")

    print("\n  --> Querying v_lot_availability:")
    cur.execute("SELECT lot_id, lot_name, total_slots, available_slots, occupied_slots, reserved_slots, occupancy_rate_pct FROM v_lot_availability")
    for r in cur.fetchall():
        pct = float(r['occupancy_rate_pct']) if r['occupancy_rate_pct'] is not None else 0.0
        print(f"     Lot #{r['lot_id']} {r['lot_name']:<28} | Slots: {r['total_slots']} | Avail: {r['available_slots']} | Occ: {r['occupied_slots']} | Res: {r['reserved_slots']} | Occ%: {pct:.1f}%")

    # 3. Triggers
    print("\n[3] DATABASE TRIGGERS:")
    cur.execute(f"SHOW TRIGGERS FROM `{config.DB_NAME}`;")
    triggers = cur.fetchall()
    for trg in triggers:
        print(f"  * Trigger: {trg['Trigger']:<28} | Event: {trg['Event']:<8} | Timing: {trg['Timing']:<7} | Table: {trg['Table']}")

    # 4. Stored Procedures
    print("\n[4] STORED PROCEDURES:")
    cur.execute(f"SHOW PROCEDURE STATUS WHERE Db = '{config.DB_NAME}';")
    procs = cur.fetchall()
    for p in procs:
        print(f"  * Procedure: {p['Name']}")

    # 5. Recent Active Parking Records
    print("\n[5] ACTIVE PARKED VEHICLES (parking_records WHERE status = 'Active'):")
    cur.execute("""
        SELECT pr.record_id, v.plate_number, v.vehicle_type, vo.name AS owner_name,
               ps.slot_number, pl.lot_name, pr.entry_time
        FROM parking_records pr
        JOIN vehicles v ON pr.vehicle_id = v.vehicle_id
        JOIN vehicle_owners vo ON v.owner_id = vo.owner_id
        JOIN parking_slots ps ON pr.slot_id = ps.slot_id
        JOIN parking_lots pl ON ps.lot_id = pl.lot_id
        WHERE pr.status = 'Active'
    """)
    active = cur.fetchall()
    if active:
        for a in active:
            print(f"     Ticket #{a['record_id']} | Plate: {a['plate_number']} ({a['vehicle_type']}) | Slot: {a['slot_number']} ({a['lot_name']}) | Owner: {a['owner_name']}")
    else:
        print("     (No active vehicles parked currently)")

    # 6. Registered Users
    print("\n[6] SYSTEM USERS (users table):")
    cur.execute("SELECT user_id, username, role, full_name FROM users")
    for u in cur.fetchall():
        print(f"     User #{u['user_id']} | Username: {u['username']:<14} | Role: {u['role']:<10} | Name: {u['full_name']}")

    cur.close()
    conn.close()
    print("\n" + "=" * 70)
    print("Database check completed successfully.")
    print("=" * 70)


if __name__ == "__main__":
    inspect_database()
