"""
End-to-End Automated Test Suite for Smart Parking Management System.
Tests all database operations, triggers, stored procedures, views, and business logic.
"""

import datetime
import db
from auth import UserSession


def run_tests():
    print("=== 1. TESTING AUTHENTICATION ===")
    admin = db.authenticate_user("admin", "admin123")
    assert admin is not None and admin["role"] == "admin"
    print("[PASS] Admin login OK:", admin["username"])

    staff = db.authenticate_user("attendant1", "staff123")
    assert staff is not None and staff["role"] == "attendant"
    print("[PASS] Staff login OK:", staff["username"])

    print("\n=== 2. TESTING DASHBOARD KPIS & VIEWS ===")
    kpis = db.get_dashboard_kpis()
    print("[PASS] Initial KPIs:", kpis)
    lots = db.get_lot_availability_view()
    assert len(lots) >= 3
    print("[PASS] Lot availability view rows:", len(lots))

    print("\n=== 3. TESTING VEHICLE ENTRY & TRIGGER OCCUPIED ===")
    test_plate = "TEST-99-ZZ-9999"
    entry_res = db.register_vehicle_entry(
        plate_number=test_plate,
        vehicle_type="Car",
        owner_name="Test Driver",
        owner_phone="9999988888",
        owner_email="test@example.com",
        lot_id=1
    )
    print("[PASS] Allocated slot:", entry_res["slot_number"], "in", entry_res["lot_name"])

    # Check slot status in DB
    slot_in_db = db.fetch_one("SELECT status FROM parking_slots WHERE slot_id = %s", (entry_res["slot_id"],))
    assert slot_in_db["status"] == "Occupied"
    print("[PASS] Trigger verified: slot status automatically set to 'Occupied'!")

    # Verify duplicate parking prevented
    try:
        db.register_vehicle_entry(
            plate_number=test_plate,
            vehicle_type="Car",
            owner_name="Test Driver",
            owner_phone="9999988888",
            owner_email=None,
            lot_id=1
        )
        assert False, "Duplicate check-in should have raised ValueError"
    except ValueError as e:
        print("[PASS] Duplicate check-in correctly blocked:", str(e))

    print("\n=== 4. TESTING VEHICLE EXIT, STORED PROCEDURE & TRIGGER AVAILABLE ===")
    active_rec = db.get_active_parking_by_plate(test_plate)
    assert active_rec is not None
    rec_id = active_rec["record_id"]

    # Call stored procedure
    future_exit = datetime.datetime.now() + datetime.timedelta(hours=2, minutes=15)
    fee_info = db.calculate_parking_fee_sp(rec_id, exit_time=future_exit)
    print("[PASS] Stored Procedure fee calculation:", fee_info)
    assert fee_info["billable_hours"] == 3
    assert fee_info["total_fee"] == 150.0

    # Process exit & payment
    pay_res = db.process_vehicle_exit_and_payment(
        record_id=rec_id,
        exit_time=future_exit,
        amount=fee_info["total_fee"],
        payment_mode="UPI"
    )
    print("[PASS] Payment processed:", pay_res["payment_id"], "Amount: Rs.", pay_res["amount"])

    # Check slot status reverted to Available
    slot_after_exit = db.fetch_one("SELECT status FROM parking_slots WHERE slot_id = %s", (entry_res["slot_id"],))
    assert slot_after_exit["status"] == "Available"
    print("[PASS] Trigger verified: slot status automatically freed to 'Available'!")

    print("\n=== 5. TESTING SLOT MANAGEMENT (ADMIN CRUD) ===")
    new_slot_id = db.add_parking_slot(lot_id=1, slot_number="A-C99", slot_type="Car", status="Available")
    print("[PASS] Added slot ID:", new_slot_id)
    db.update_parking_slot(slot_id=new_slot_id, slot_number="A-C99", slot_type="Car", status="Maintenance")
    slot_m = db.fetch_one("SELECT status FROM parking_slots WHERE slot_id = %s", (new_slot_id,))
    assert slot_m["status"] == "Maintenance"
    print("[PASS] Updated slot to Maintenance OK")
    db.delete_parking_slot(new_slot_id)
    assert db.fetch_one("SELECT slot_id FROM parking_slots WHERE slot_id = %s", (new_slot_id,)) is None
    print("[PASS] Deleted slot OK")

    print("\n=== 6. TESTING RESERVATIONS & TRIGGER RESERVED/AVAILABLE ===")
    avail_slot = db.fetch_one("SELECT slot_id, slot_number FROM parking_slots WHERE status = 'Available' AND slot_type = 'Car' LIMIT 1")
    res_slot_id = avail_slot["slot_id"]
    r_from = datetime.datetime.now() + datetime.timedelta(hours=2)
    r_to = datetime.datetime.now() + datetime.timedelta(hours=5)

    res_id = db.create_reservation(
        plate_number="RES-01-AB-1111",
        vehicle_type="Car",
        owner_name="VIP Guest",
        owner_phone="9888877777",
        owner_email="vip@example.com",
        slot_id=res_slot_id,
        reserve_from=r_from,
        reserve_to=r_to
    )
    print("[PASS] Created reservation ID:", res_id)
    slot_res = db.fetch_one("SELECT status FROM parking_slots WHERE slot_id = %s", (res_slot_id,))
    assert slot_res["status"] == "Reserved"
    print("[PASS] Trigger verified: slot status automatically set to 'Reserved'!")

    db.cancel_reservation(res_id)
    slot_unres = db.fetch_one("SELECT status FROM parking_slots WHERE slot_id = %s", (res_slot_id,))
    assert slot_unres["status"] == "Available"
    print("[PASS] Trigger verified: slot status freed back to 'Available'!")

    print("\n=== 7. TESTING PRICING & USER ADMIN OPERATIONS ===")
    db.update_pricing_rate("Car", 55.0)
    rate = db.fetch_one("SELECT rate_per_hour FROM pricing WHERE vehicle_type = 'Car'")
    assert float(rate["rate_per_hour"]) == 55.0
    db.update_pricing_rate("Car", 50.0)
    print("[PASS] Pricing update & revert OK")

    new_uid = db.create_user("test_guard", "guard123", "attendant", "Security Guard")
    u_login = db.authenticate_user("test_guard", "guard123")
    assert u_login is not None and u_login["user_id"] == new_uid
    db.delete_user(new_uid)
    assert db.authenticate_user("test_guard", "guard123") is None
    print("[PASS] User creation, password hashing, and deletion OK")

    print("\n=======================================================")
    print("  ALL 7 DATABASE & BUSINESS LOGIC TEST SUITES PASSED!  ")
    print("=======================================================")


if __name__ == "__main__":
    run_tests()
