#!/usr/bin/env python3
"""
Vehicle Service Center - DBMS Mini Project (MongoDB Edition)
============================================================
Adapted from Relational ER Model (CUSTOMER, VEHICLE, SERVICE, MECHANIC,
BAY, BILL, DEPARTMENT) to Document-Oriented NoSQL using MongoDB.

Features demonstrated:
  * Document Modeling (Embedding weak entities, multivalued attributes)
  * MongoDB JSON Schema Validators ($jsonSchema)
  * Unique & Compound Indexes
  * MongoDB Native Views (v_service_summary, v_bay_status)
  * Aggregation Pipelines ($lookup, $group, $match, $unwind, $facet, $unionWith)
  * Modern MongoDB Window Functions ($setWindowFields)
  * Constraints, Integrity Rules & Triggers / Change Logic
  * Execution Plans via explain("executionStats")

Run:
  python3 service_center_mongo.py          -> Interactive CLI Menu
  python3 service_center_mongo.py --demo   -> Runs all 13 DBMS concepts with output
  python3 service_center_mongo.py --reset  -> Resets and re-seeds the database
"""

import sys
from datetime import date, datetime

try:
    import pymongo
    from pymongo.errors import DuplicateKeyError, OperationFailure, WriteError
except ImportError:
    print("\n[!] Error: 'pymongo' library is not installed.")
    print("    Please run: pip3 install pymongo\n")
    sys.exit(1)

# Configuration
MONGO_URI = "mongodb://localhost:27017/"
DB_NAME = "service_center"


# ---------------------------------------------------------------- SCHEMAS & VALIDATORS
def init_database(client, reset=False):
    """
    Initializes collections with MongoDB JSON Schema validators,
    unique indexes, and aggregation views.
    """
    db = client[DB_NAME]
    existing = db.list_collection_names()

    if reset:
        # Drop collections and views
        for coll in ["departments", "mechanics", "customers", "bays", "services", "bills",
                     "v_service_summary", "v_bay_status"]:
            if coll in existing:
                db[coll].drop()
        existing = []

    if "departments" in existing:
        return db

    # 1. Department collection with Schema Validation
    db.create_collection("departments", validator={
        "$jsonSchema": {
            "bsonType": "object",
            "required": ["dept_id", "dept_name"],
            "properties": {
                "dept_id": {"bsonType": "int", "description": "must be an int and is required"},
                "dept_name": {"bsonType": "string", "minLength": 1, "description": "must be non-empty string"}
            }
        }
    })
    db.departments.create_index("dept_id", unique=True)
    db.departments.create_index("dept_name", unique=True)

    # 2. Mechanic collection (Multivalued specializations embedded as array)
    db.create_collection("mechanics", validator={
        "$jsonSchema": {
            "bsonType": "object",
            "required": ["mech_id", "name", "dept_id"],
            "properties": {
                "mech_id": {"bsonType": "int"},
                "name": {"bsonType": "string", "minLength": 1},
                "dept_id": {"bsonType": "int"},
                "specializations": {
                    "bsonType": "array",
                    "items": {"bsonType": "string"}
                }
            }
        }
    })
    db.mechanics.create_index("mech_id", unique=True)
    db.mechanics.create_index("dept_id")

    # 3. Customer collection (Multivalued phones & Weak Entity vehicles embedded)
    db.create_collection("customers", validator={
        "$jsonSchema": {
            "bsonType": "object",
            "required": ["cust_id", "first_name", "last_name", "dob"],
            "properties": {
                "cust_id": {"bsonType": "int"},
                "first_name": {"bsonType": "string", "minLength": 1},
                "last_name": {"bsonType": "string", "minLength": 1},
                "dob": {"bsonType": "string", "pattern": "^\\d{4}-\\d{2}-\\d{2}$"},
                "phones": {
                    "bsonType": "array",
                    "items": {
                        "bsonType": "string",
                        "pattern": "^[0-9]{10}$",
                        "description": "phone numbers must be exactly 10 digits"
                    }
                },
                "vehicles": {
                    "bsonType": "array",
                    "items": {
                        "bsonType": "object",
                        "required": ["vehicle_id", "reg_date"],
                        "properties": {
                            "vehicle_id": {"bsonType": "int"},
                            "reg_date": {"bsonType": "string"},
                            "bay_id": {"bsonType": ["int", "null"]}
                        }
                    }
                }
            }
        }
    })
    db.customers.create_index("cust_id", unique=True)
    db.customers.create_index("vehicles.bay_id")

    # 4. Bay collection
    db.create_collection("bays", validator={
        "$jsonSchema": {
            "bsonType": "object",
            "required": ["bay_id", "bay_type", "occupied"],
            "properties": {
                "bay_id": {"bsonType": "int"},
                "bay_type": {
                    "enum": ["Lift", "Wash", "Alignment", "General"],
                    "description": "bay_type must be Lift, Wash, Alignment, or General"
                },
                "occupied": {"enum": [0, 1]},
                "assigned_vehicle": {
                    "bsonType": ["object", "null"],
                    "properties": {
                        "cust_id": {"bsonType": "int"},
                        "vehicle_id": {"bsonType": "int"}
                    }
                }
            }
        }
    })
    db.bays.create_index("bay_id", unique=True)

    # 5. Service collection
    db.create_collection("services", validator={
        "$jsonSchema": {
            "bsonType": "object",
            "required": ["service_id", "service_date", "cust_id", "charge", "status"],
            "properties": {
                "service_id": {"bsonType": "int"},
                "service_date": {"bsonType": "string"},
                "cust_id": {"bsonType": "int"},
                "charge": {
                    "bsonType": ["double", "int", "long", "decimal"],
                    "minimum": 0,
                    "description": "charge cannot be negative"
                },
                "status": {"enum": ["Booked", "Completed"]},
                "mechanic_ids": {
                    "bsonType": "array",
                    "items": {"bsonType": "int"}
                }
            }
        }
    })
    db.services.create_index("service_id", unique=True)
    db.services.create_index("cust_id")
    db.services.create_index("service_date")

    # 6. Bill collection
    db.create_collection("bills", validator={
        "$jsonSchema": {
            "bsonType": "object",
            "required": ["bill_id", "cust_id", "service_id", "amount"],
            "properties": {
                "bill_id": {"bsonType": "int"},
                "cust_id": {"bsonType": "int"},
                "service_id": {"bsonType": "int"},
                "amount": {
                    "bsonType": ["double", "int", "long", "decimal"],
                    "exclusiveMinimum": 0,
                    "description": "amount must be strictly positive"
                }
            }
        }
    })
    db.bills.create_index("bill_id", unique=True)
    db.bills.create_index("service_id", unique=True)
    db.bills.create_index("cust_id")

    # 7. Native MongoDB Views
    # View A: v_service_summary
    db.command({
        "create": "v_service_summary",
        "viewOn": "services",
        "pipeline": [
            {
                "$lookup": {
                    "from": "customers",
                    "localField": "cust_id",
                    "foreignField": "cust_id",
                    "as": "c"
                }
            },
            {
                "$lookup": {
                    "from": "mechanics",
                    "localField": "mechanic_ids",
                    "foreignField": "mech_id",
                    "as": "m"
                }
            },
            {
                "$project": {
                    "_id": 0,
                    "service_id": "$service_id",
                    "service_date": "$service_date",
                    "customer": {
                        "$concat": [
                            {"$ifNull": [{"$first": "$c.first_name"}, ""]},
                            " ",
                            {"$ifNull": [{"$first": "$c.last_name"}, ""]}
                        ]
                    },
                    "status": "$status",
                    "charge": "$charge",
                    "mechanics": {
                        "$reduce": {
                            "input": "$m.name",
                            "initialValue": "",
                            "in": {
                                "$cond": [
                                    {"$eq": ["$$value", ""]},
                                    "$$this",
                                    {"$concat": ["$$value", ", ", "$$this"]}
                                ]
                            }
                        }
                    }
                }
            }
        ]
    })

    # View B: v_bay_status
    db.command({
        "create": "v_bay_status",
        "viewOn": "bays",
        "pipeline": [
            {
                "$project": {
                    "_id": 0,
                    "bay_id": "$bay_id",
                    "bay_type": "$bay_type",
                    "state": {
                        "$cond": [{"$eq": ["$occupied", 1]}, "Occupied", "Free"]
                    },
                    "cust_id": "$assigned_vehicle.cust_id",
                    "vehicle_id": "$assigned_vehicle.vehicle_id"
                }
            }
        ]
    })

    # ------------------------------------------------------------ SEED DATA
    seed_database(db)
    return db


def seed_database(db):
    """Populates MongoDB collections with initial project data."""
    # Departments
    db.departments.insert_many([
        {"dept_id": 1, "dept_name": "Engine"},
        {"dept_id": 2, "dept_name": "Electrical"},
        {"dept_id": 3, "dept_name": "Body & Paint"},
        {"dept_id": 4, "dept_name": "Tyres"}
    ])

    # Mechanics (with embedded multivalued specializations)
    db.mechanics.insert_many([
        {"mech_id": 1, "name": "Ramesh Patil", "dept_id": 1, "specializations": ["Diesel engines", "Turbo repair"]},
        {"mech_id": 2, "name": "Sunil Jadhav", "dept_id": 2, "specializations": ["Wiring", "Battery"]},
        {"mech_id": 3, "name": "Akbar Shaikh", "dept_id": 3, "specializations": ["Dent removal"]},
        {"mech_id": 4, "name": "Vikas More", "dept_id": 1, "specializations": ["Petrol engines"]},
        {"mech_id": 5, "name": "Deepak Kale", "dept_id": 4, "specializations": ["Wheel alignment"]}
    ])

    # Customers (with embedded multivalued phones & vehicles)
    db.customers.insert_many([
        {
            "cust_id": 1, "first_name": "Aarav", "last_name": "Kulkarni", "dob": "2001-05-14",
            "phones": ["9876543210", "9123456780"],
            "vehicles": [
                {"vehicle_id": 1, "reg_date": "2022-02-10", "bay_id": 1},
                {"vehicle_id": 2, "reg_date": "2024-07-19", "bay_id": None}
            ]
        },
        {
            "cust_id": 2, "first_name": "Sneha", "last_name": "Deshmukh", "dob": "1998-11-02",
            "phones": ["9988776655"],
            "vehicles": [
                {"vehicle_id": 1, "reg_date": "2021-12-01", "bay_id": 3}
            ]
        },
        {
            "cust_id": 3, "first_name": "Rohan", "last_name": "Pawar", "dob": "1995-03-21",
            "phones": ["9012345678"],
            "vehicles": [
                {"vehicle_id": 1, "reg_date": "2023-04-25", "bay_id": None}
            ]
        },
        {
            "cust_id": 4, "first_name": "Priya", "last_name": "Joshi", "dob": "2002-08-30",
            "phones": ["9345678901"],
            "vehicles": [
                {"vehicle_id": 1, "reg_date": "2025-01-15", "bay_id": None}
            ]
        },
        {
            "cust_id": 5, "first_name": "Karan", "last_name": "Mehta", "dob": "1990-01-09",
            "phones": [],
            "vehicles": []
        }
    ])

    # Bays
    db.bays.insert_many([
        {"bay_id": 1, "bay_type": "Lift", "occupied": 1, "assigned_vehicle": {"cust_id": 1, "vehicle_id": 1}},
        {"bay_id": 2, "bay_type": "Lift", "occupied": 0, "assigned_vehicle": None},
        {"bay_id": 3, "bay_type": "Wash", "occupied": 1, "assigned_vehicle": {"cust_id": 2, "vehicle_id": 1}},
        {"bay_id": 4, "bay_type": "Alignment", "occupied": 0, "assigned_vehicle": None},
        {"bay_id": 5, "bay_type": "General", "occupied": 0, "assigned_vehicle": None}
    ])

    # Services
    db.services.insert_many([
        {"service_id": 1, "service_date": "2026-09-01", "cust_id": 1, "charge": 4500.0, "status": "Completed", "mechanic_ids": [1, 4]},
        {"service_id": 2, "service_date": "2026-09-05", "cust_id": 2, "charge": 1200.0, "status": "Completed", "mechanic_ids": [3]},
        {"service_id": 3, "service_date": "2026-09-12", "cust_id": 3, "charge": 8000.0, "status": "Completed", "mechanic_ids": [1, 2]},
        {"service_id": 4, "service_date": "2026-09-20", "cust_id": 1, "charge": 2500.0, "status": "Completed", "mechanic_ids": [5]},
        {"service_id": 5, "service_date": "2026-10-01", "cust_id": 4, "charge": 3000.0, "status": "Booked", "mechanic_ids": [2]}
    ])

    # Bills (Services 1, 2, 3, 4 completed with 18% GST auto-calculated)
    db.bills.insert_many([
        {"bill_id": 1, "cust_id": 1, "service_id": 1, "amount": round(4500.0 * 1.18, 2)},
        {"bill_id": 2, "cust_id": 2, "service_id": 2, "amount": round(1200.0 * 1.18, 2)},
        {"bill_id": 3, "cust_id": 3, "service_id": 3, "amount": round(8000.0 * 1.18, 2)},
        {"bill_id": 4, "cust_id": 1, "service_id": 4, "amount": round(2500.0 * 1.18, 2)}
    ])


def connect(reset=False):
    """Connects to MongoDB and returns the database handle."""
    try:
        client = pymongo.MongoClient(MONGO_URI, serverSelectionTimeoutMS=2500)
        client.admin.command('ping')
    except Exception as e:
        print(f"\n[!] Cannot connect to MongoDB at {MONGO_URI}")
        print("    Ensure mongod service is running. E.g.:")
        print("    brew services start mongodb-community  OR  mongod --dbpath <data_dir>\n")
        raise ConnectionError(f"MongoDB connection failed: {e}")

    return init_database(client, reset=reset)


# ---------------------------------------------------------------- DISPLAY HELPERS
def print_table(headers, rows):
    """Formats and prints list of dicts/tuples as an ASCII table."""
    if not rows:
        print("(no rows)")
        return

    # Convert rows to list of lists if given as dicts
    if isinstance(rows[0], dict):
        matrix = [[str(r.get(h, "")) for h in headers] for r in rows]
    else:
        matrix = [[str(x) for x in r] for r in rows]

    col_widths = [max(len(str(h)), max(len(row[i]) for row in matrix)) for i, h in enumerate(headers)]
    fmt = lambda r: " | ".join(str(x).ljust(col_widths[i]) for i, x in enumerate(r))

    print(fmt(headers))
    print("-+-".join("-" * w for w in col_widths))
    for row in matrix:
        print(fmt(row))
    print()


def attempt(label, action):
    """Runs a database action expected to be blocked by schema validator / business rule."""
    try:
        action()
        print(f"  {label}: allowed")
    except (WriteError, OperationFailure, DuplicateKeyError, ValueError) as e:
        err_msg = str(e)
        if "Document failed validation" in err_msg:
            err_msg = "Document failed schema validation ($jsonSchema)"
        elif "duplicate key error" in err_msg:
            err_msg = "Duplicate key violates unique index constraint"
        print(f"  {label}: BLOCKED -> {err_msg}")


# ---------------------------------------------------------------- BUSINESS LOGIC (PROCEDURES)
def add_customer(db, first_name, last_name, dob_str, phones=None):
    """Inserts a new customer with age validation (Trigger equivalent) and phones."""
    # Age check (must be at least 18 years old)
    try:
        dob = datetime.strptime(dob_str, "%Y-%m-%d").date()
    except ValueError:
        raise ValueError("Date of birth must be YYYY-MM-DD")

    today = date.today()
    age = today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))
    if age < 18:
        raise ValueError("Customer must be at least 18 years old")

    nxt_id = 1
    last = db.customers.find_one(sort=[("cust_id", -1)])
    if last:
        nxt_id = last["cust_id"] + 1

    phone_list = [p.strip() for p in (phones or []) if p.strip()]

    doc = {
        "cust_id": nxt_id,
        "first_name": first_name.strip(),
        "last_name": last_name.strip(),
        "dob": dob_str,
        "phones": phone_list,
        "vehicles": []
    }
    db.customers.insert_one(doc)
    return nxt_id


def add_vehicle(db, cust_id, reg_date):
    """Registers a new vehicle under customer (weak entity composite key logic)."""
    cust = db.customers.find_one({"cust_id": cust_id})
    if not cust:
        raise ValueError(f"Customer id {cust_id} not found")

    existing_vids = [v["vehicle_id"] for v in cust.get("vehicles", [])]
    nxt_vid = max(existing_vids, default=0) + 1

    new_veh = {
        "vehicle_id": nxt_vid,
        "reg_date": reg_date,
        "bay_id": None
    }
    db.customers.update_one(
        {"cust_id": cust_id},
        {"$push": {"vehicles": new_veh}}
    )
    return nxt_vid


def book_service(db, cust_id, sdate, charge, mech_ids):
    """
    Atomic transaction equivalent: Validates customer and mechanics,
    then books service with all assigned mechanics.
    """
    if not db.customers.find_one({"cust_id": cust_id}):
        raise ValueError(f"Customer ID {cust_id} does not exist (Foreign Key violation)")

    for m in mech_ids:
        if not db.mechanics.find_one({"mech_id": m}):
            raise ValueError(f"Mechanic ID {m} does not exist (Foreign Key violation)")

    if charge < 0:
        raise ValueError("Charge cannot be negative")

    nxt_sid = 1
    last = db.services.find_one(sort=[("service_id", -1)])
    if last:
        nxt_sid = last["service_id"] + 1

    db.services.insert_one({
        "service_id": nxt_sid,
        "service_date": sdate,
        "cust_id": cust_id,
        "charge": float(charge),
        "status": "Booked",
        "mechanic_ids": mech_ids
    })
    return nxt_sid


def complete_service(db, service_id):
    """
    Trigger equivalent: Marks service 'Completed' and auto-generates bill
    with 18% GST (amount = charge * 1.18).
    """
    svc = db.services.find_one({"service_id": service_id})
    if not svc:
        raise ValueError(f"Service {service_id} not found")

    if svc.get("status") == "Completed":
        print(f"Service {service_id} is already completed.")
        return

    # Update service status
    db.services.update_one({"service_id": service_id}, {"$set": {"status": "Completed"}})

    # Auto Bill generation trigger
    nxt_bid = 1
    last_bill = db.bills.find_one(sort=[("bill_id", -1)])
    if last_bill:
        nxt_bid = last_bill["bill_id"] + 1

    bill_amount = round(float(svc["charge"]) * 1.18, 2)
    db.bills.insert_one({
        "bill_id": nxt_bid,
        "cust_id": svc["cust_id"],
        "service_id": service_id,
        "amount": bill_amount
    })
    return nxt_bid


def assign_bay(db, cust_id, vehicle_id, bay_id):
    """
    Bay assignment trigger / integrity checks:
    - Check if bay exists and is not occupied
    - Atomically update bay occupancy and vehicle bay_id
    """
    cust = db.customers.find_one({"cust_id": cust_id, "vehicles.vehicle_id": vehicle_id})
    if not cust:
        raise ValueError(f"Vehicle {vehicle_id} for customer {cust_id} not found")

    current_veh = next(v for v in cust["vehicles"] if v["vehicle_id"] == vehicle_id)
    old_bay_id = current_veh.get("bay_id")

    if bay_id is not None:
        bay = db.bays.find_one({"bay_id": bay_id})
        if not bay:
            raise ValueError(f"Bay {bay_id} does not exist")
        if bay["occupied"] == 1 and bay["bay_id"] != old_bay_id:
            raise ValueError("Bay is already occupied")

    # Free old bay if previously occupied
    if old_bay_id is not None:
        db.bays.update_one(
            {"bay_id": old_bay_id},
            {"$set": {"occupied": 0, "assigned_vehicle": None}}
        )

    # Assign new bay
    if bay_id is not None:
        db.bays.update_one(
            {"bay_id": bay_id},
            {"$set": {"occupied": 1, "assigned_vehicle": {"cust_id": cust_id, "vehicle_id": vehicle_id}}}
        )

    # Update customer's vehicle document
    db.customers.update_one(
        {"cust_id": cust_id, "vehicles.vehicle_id": vehicle_id},
        {"$set": {"vehicles.$.bay_id": bay_id}}
    )


def release_bay(db, cust_id, vehicle_id):
    """Releases bay currently assigned to vehicle."""
    assign_bay(db, cust_id, vehicle_id, None)


# ---------------------------------------------------------------- DBMS CONCEPTS DEMO
def demo(db):
    """Runs all 13 core DBMS / MongoDB concepts with detailed output."""
    def h(title):
        print(f"\n=== {title} ===")

    h("1. $lookup (INNER/LEFT JOIN): customer -> vehicle -> bay")
    pipeline = [
        {"$unwind": "$vehicles"},
        {
            "$lookup": {
                "from": "bays",
                "localField": "vehicles.bay_id",
                "foreignField": "bay_id",
                "as": "bay_info"
            }
        },
        {
            "$project": {
                "_id": 0,
                "first_name": "$first_name",
                "vehicle_id": "$vehicles.vehicle_id",
                "reg_date": "$vehicles.reg_date",
                "bay_id": "$vehicles.bay_id",
                "bay_type": {"$ifNull": [{"$first": "$bay_info.bay_type"}, "None"]}
            }
        }
    ]
    res = list(db.customers.aggregate(pipeline))
    print_table(["first_name", "vehicle_id", "reg_date", "bay_id", "bay_type"], res)

    h("2. $group + $match (GROUP BY + HAVING): customers spending > 5000")
    pipeline = [
        {
            "$group": {
                "_id": "$cust_id",
                "bills": {"$sum": 1},
                "total": {"$sum": "$amount"}
            }
        },
        {"$match": {"total": {"$gt": 5000}}},
        {
            "$lookup": {
                "from": "customers",
                "localField": "_id",
                "foreignField": "cust_id",
                "as": "c"
            }
        },
        {
            "$project": {
                "_id": 0,
                "cust_id": "$_id",
                "first_name": {"$first": "$c.first_name"},
                "bills": 1,
                "total": 1
            }
        },
        {"$sort": {"total": -1}}
    ]
    res = list(db.bills.aggregate(pipeline))
    print_table(["cust_id", "first_name", "bills", "total"], res)

    h("3. Subquery Aggregation: services costlier than the average service")
    pipeline = [
        {
            "$group": {
                "_id": None,
                "avgCharge": {"$avg": "$charge"},
                "all_services": {"$push": "$$ROOT"}
            }
        },
        {"$unwind": "$all_services"},
        {
            "$match": {
                "$expr": {"$gt": ["$all_services.charge", "$avgCharge"]}
            }
        },
        {
            "$project": {
                "_id": 0,
                "service_id": "$all_services.service_id",
                "cust_id": "$all_services.cust_id",
                "charge": "$all_services.charge"
            }
        }
    ]
    res = list(db.services.aggregate(pipeline))
    print_table(["service_id", "cust_id", "charge"], res)

    h("4. Correlated Subquery Equivalent: customers with no vehicle in a bay")
    query = {
        "vehicles": {
            "$not": {
                "$elemMatch": {"bay_id": {"$ne": None}}
            }
        }
    }
    res = list(db.customers.find(query, {"_id": 0, "first_name": 1, "last_name": 1}))
    print_table(["first_name", "last_name"], res)

    h("5. $lookup + Workload aggregation: mechanics, department & workload (0 = idle)")
    pipeline = [
        {
            "$lookup": {
                "from": "departments",
                "localField": "dept_id",
                "foreignField": "dept_id",
                "as": "dept"
            }
        },
        {
            "$lookup": {
                "from": "services",
                "localField": "mech_id",
                "foreignField": "mechanic_ids",
                "as": "assigned"
            }
        },
        {
            "$project": {
                "_id": 0,
                "name": 1,
                "dept_name": {"$first": "$dept.dept_name"},
                "services": {"$size": "$assigned"}
            }
        }
    ]
    res = list(db.mechanics.aggregate(pipeline))
    print_table(["name", "dept_name", "services"], res)

    h("6. Multivalued Attribute Pattern: all specializations per mechanic")
    res = []
    for m in db.mechanics.find({}, {"_id": 0, "name": 1, "specializations": 1}):
        res.append({
            "name": m["name"],
            "specializations": ", ".join(m.get("specializations", []))
        })
    print_table(["name", "specializations"], res)

    h("7. $unionWith (UNION): customers and mechanics in one combined list")
    pipeline = [
        {"$project": {"_id": 0, "who": "$first_name", "kind": {"$literal": "customer"}}},
        {
            "$unionWith": {
                "coll": "mechanics",
                "pipeline": [
                    {"$project": {"_id": 0, "who": "$name", "kind": {"$literal": "mechanic"}}}
                ]
            }
        },
        {"$sort": {"kind": 1, "who": 1}}
    ]
    res = list(db.customers.aggregate(pipeline))
    print_table(["who", "kind"], res)

    h("8. Window Function ($setWindowFields): rank customers by money spent")
    pipeline = [
        {
            "$group": {
                "_id": "$cust_id",
                "spent": {"$sum": "$amount"}
            }
        },
        {
            "$lookup": {
                "from": "customers",
                "localField": "_id",
                "foreignField": "cust_id",
                "as": "c"
            }
        },
        {
            "$project": {
                "_id": 0,
                "first_name": {"$first": "$c.first_name"},
                "spent": 1
            }
        },
        {
            "$setWindowFields": {
                "sortBy": {"spent": -1},
                "output": {
                    "rnk": {"$denseRank": {}}
                }
            }
        }
    ]
    res = list(db.bills.aggregate(pipeline))
    print_table(["first_name", "spent", "rnk"], res)

    h("9. MongoDB Views (v_service_summary & v_bay_status)")
    print("[View: v_service_summary]")
    v_services = list(db.v_service_summary.find())
    print_table(["service_id", "service_date", "customer", "status", "charge", "mechanics"], v_services)

    print("[View: v_bay_status]")
    v_bays = list(db.v_bay_status.find())
    print_table(["bay_id", "bay_type", "state", "cust_id", "vehicle_id"], v_bays)

    h("10. Constraints, Schema Validation & Integrity")
    attempt("invalid phone (letters)",
            lambda: db.customers.insert_one({"cust_id": 99, "first_name": "Bad", "last_name": "Phone", "dob": "2000-01-01", "phones": ["98abc"]}))
    attempt("negative charge",
            lambda: db.services.insert_one({"service_id": 99, "service_date": "2026-10-15", "cust_id": 1, "charge": -5.0, "status": "Booked"}))
    attempt("service for unknown customer (FK check)",
            lambda: book_service(db, 999, "2026-10-15", 100, [1]))
    attempt("duplicate department name (UNIQUE Index)",
            lambda: db.departments.insert_one({"dept_id": 99, "dept_name": "Engine"}))
    attempt("invalid bay type (ENUM check)",
            lambda: db.bays.insert_one({"bay_id": 99, "bay_type": "Helipad", "occupied": 0}))

    h("11. Triggers & Stored Logic")
    attempt("customer born 2012 (age check)",
            lambda: add_customer(db, "Tiny", "Tim", "2012-01-01"))
    attempt("move vehicle 1/2 into occupied bay 1",
            lambda: assign_bay(db, 1, 2, 1))

    assign_bay(db, 1, 2, 2)
    print("  vehicle 1/2 moved to free bay 2; bay table now:")
    print_table(["bay_id", "bay_type", "state", "cust_id", "vehicle_id"], list(db.v_bay_status.find()))

    sid = book_service(db, 5, "2026-10-15", 10000, [1, 3])
    bid = complete_service(db, sid)
    print(f"  completed service {sid}, bill auto-generated by trigger (10000 + 18% GST = 11800):")
    b = db.bills.find_one({"service_id": sid}, {"_id": 0})
    print(f"  Bill Record: {b}")

    h("12. Transaction / Atomic Booking: all or nothing")
    before = db.services.count_documents({})
    try:
        book_service(db, 2, "2026-10-16", 700, [1, 999])  # mechanic 999 does not exist
    except ValueError as e:
        print("  booking failed:", e)
    after = db.services.count_documents({})
    print(f"  services before={before}, after={after} (no half-booked service created)")

    h("13. Index Analysis (explain('executionStats'))")
    explain_res = db.command({
        "explain": {
            "find": "services",
            "filter": {"cust_id": 1}
        },
        "verbosity": "executionStats"
    })
    stages = []
    curr = explain_res.get("executionStats", {}).get("executionStages", {})
    while curr:
        stages.append(curr.get("stage"))
        curr = curr.get("inputStage", {})
    print(f"  Execution stage chain: {' -> '.join(stages)}")
    print(f"  Index scan used (IXSCAN): {'IXSCAN' in stages}")


# ---------------------------------------------------------------- INTERACTIVE MENU
def ask(prompt):
    return input(prompt).strip()


def menu(db):
    banner = """
===================================================
     VEHICLE SERVICE CENTER - MONGODB DBMS CLI     
===================================================
 1. Add customer        5. Complete service (auto bill)
 2. Add vehicle         6. Assign vehicle to bay
 3. Book service        7. Release bay
 4. View services       8. View bays
 9. View bills         10. Run full DBMS demo
 0. Exit
==================================================="""
    while True:
        print(banner)
        choice = ask("Enter choice: ")
        try:
            if choice == "1":
                fn = ask("First name: ")
                ln = ask("Last name: ")
                dob = ask("DOB (YYYY-MM-DD): ")
                phones = [p.strip() for p in ask("Phones (comma-separated 10 digits): ").split(",") if p.strip()]
                cid = add_customer(db, fn, ln, dob, phones)
                print(f"[+] Customer created successfully with ID: {cid}")

            elif choice == "2":
                cid = int(ask("Customer id: "))
                rd = ask("Registration date (YYYY-MM-DD): ")
                vid = add_vehicle(db, cid, rd)
                print(f"[+] Vehicle registered with ID: {vid}")

            elif choice == "3":
                cid = int(ask("Customer id: "))
                sdate = ask("Service date (YYYY-MM-DD): ")
                charge = float(ask("Charge (₹): "))
                mechs = [int(x) for x in ask("Mechanic IDs (comma separated, e.g. 1,4): ").split(",") if x.strip()]
                sid = book_service(db, cid, sdate, charge, mechs)
                print(f"[+] Service booked with ID: {sid}")

            elif choice == "4":
                print("\n--- Services Summary (from View: v_service_summary) ---")
                rows = list(db.v_service_summary.find())
                print_table(["service_id", "service_date", "customer", "status", "charge", "mechanics"], rows)

            elif choice == "5":
                sid = int(ask("Service id to complete: "))
                bid = complete_service(db, sid)
                print(f"[+] Service {sid} completed! Bill generated with ID: {bid}")

            elif choice == "6":
                cid = int(ask("Customer id: "))
                vid = int(ask("Vehicle id: "))
                bid = int(ask("Bay id: "))
                assign_bay(db, cid, vid, bid)
                print(f"[+] Vehicle {vid} assigned to Bay {bid}.")

            elif choice == "7":
                cid = int(ask("Customer id: "))
                vid = int(ask("Vehicle id: "))
                release_bay(db, cid, vid)
                print(f"[+] Bay released for vehicle {vid}.")

            elif choice == "8":
                print("\n--- Bay Status (from View: v_bay_status) ---")
                rows = list(db.v_bay_status.find())
                print_table(["bay_id", "bay_type", "state", "cust_id", "vehicle_id"], rows)

            elif choice == "9":
                print("\n--- Bills ---")
                rows = list(db.bills.find({}, {"_id": 0}))
                print_table(["bill_id", "cust_id", "service_id", "amount"], rows)

            elif choice == "10":
                demo(db)

            elif choice == "0":
                print("Exiting...")
                break
            else:
                print("Invalid choice, please try again.")

        except Exception as e:
            print(f"[!] Error: {e}")


# ---------------------------------------------------------------- MAIN
if __name__ == "__main__":
    reset_db = "--reset" in sys.argv
    is_demo = "--demo" in sys.argv

    db = connect(reset=reset_db)

    if is_demo:
        demo(db)
    else:
        menu(db)
