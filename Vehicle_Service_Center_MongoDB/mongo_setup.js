/**
 * Vehicle Service Center - MongoDB DBMS Setup & Queries Script
 * ============================================================
 * Usage:
 *   mongosh mongodb://localhost:27017/service_center mongo_setup.js
 */

db = db.getSiblingDB("service_center");

print("--- Resetting database collections & views ---");
db.departments.drop();
db.mechanics.drop();
db.customers.drop();
db.bays.drop();
db.services.drop();
db.bills.drop();
try { db.v_service_summary.drop(); } catch (e) {}
try { db.v_bay_status.drop(); } catch (e) {}

// ============================================================
// 1. COLLECTIONS WITH JSON SCHEMA VALIDATORS ($jsonSchema)
// ============================================================
print("Creating collections with JSON Schema Validators...");

// Departments
db.createCollection("departments", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["dept_id", "dept_name"],
      properties: {
        dept_id: { bsonType: "int" },
        dept_name: { bsonType: "string", minLength: 1 }
      }
    }
  }
});
db.departments.createIndex({ dept_id: 1 }, { unique: true });
db.departments.createIndex({ dept_name: 1 }, { unique: true });

// Mechanics (Multivalued specializations embedded as array)
db.createCollection("mechanics", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["mech_id", "name", "dept_id"],
      properties: {
        mech_id: { bsonType: "int" },
        name: { bsonType: "string", minLength: 1 },
        dept_id: { bsonType: "int" },
        specializations: {
          bsonType: "array",
          items: { bsonType: "string" }
        }
      }
    }
  }
});
db.mechanics.createIndex({ mech_id: 1 }, { unique: true });
db.mechanics.createIndex({ dept_id: 1 });

// Customers (Multivalued phones & Weak entity vehicles embedded)
db.createCollection("customers", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["cust_id", "first_name", "last_name", "dob"],
      properties: {
        cust_id: { bsonType: "int" },
        first_name: { bsonType: "string", minLength: 1 },
        last_name: { bsonType: "string", minLength: 1 },
        dob: { bsonType: "string", pattern: "^\\d{4}-\\d{2}-\\d{2}$" },
        phones: {
          bsonType: "array",
          items: {
            bsonType: "string",
            pattern: "^[0-9]{10}$",
            description: "Phone must be 10 numeric digits"
          }
        },
        vehicles: {
          bsonType: "array",
          items: {
            bsonType: "object",
            required: ["vehicle_id", "reg_date"],
            properties: {
              vehicle_id: { bsonType: "int" },
              reg_date: { bsonType: "string" },
              bay_id: { bsonType: ["int", "null"] }
            }
          }
        }
      }
    }
  }
});
db.customers.createIndex({ cust_id: 1 }, { unique: true });
db.customers.createIndex({ "vehicles.bay_id": 1 });

// Bays
db.createCollection("bays", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["bay_id", "bay_type", "occupied"],
      properties: {
        bay_id: { bsonType: "int" },
        bay_type: {
          enum: ["Lift", "Wash", "Alignment", "General"]
        },
        occupied: { enum: [0, 1] },
        assigned_vehicle: {
          bsonType: ["object", "null"],
          properties: {
            cust_id: { bsonType: "int" },
            vehicle_id: { bsonType: "int" }
          }
        }
      }
    }
  }
});
db.bays.createIndex({ bay_id: 1 }, { unique: true });

// Services
db.createCollection("services", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["service_id", "service_date", "cust_id", "charge", "status"],
      properties: {
        service_id: { bsonType: "int" },
        service_date: { bsonType: "string" },
        cust_id: { bsonType: "int" },
        charge: {
          bsonType: ["double", "int", "long", "decimal"],
          minimum: 0
        },
        status: { enum: ["Booked", "Completed"] },
        mechanic_ids: {
          bsonType: "array",
          items: { bsonType: "int" }
        }
      }
    }
  }
});
db.services.createIndex({ service_id: 1 }, { unique: true });
db.services.createIndex({ cust_id: 1 });
db.services.createIndex({ service_date: 1 });

// Bills
db.createCollection("bills", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["bill_id", "cust_id", "service_id", "amount"],
      properties: {
        bill_id: { bsonType: "int" },
        cust_id: { bsonType: "int" },
        service_id: { bsonType: "int" },
        amount: {
          bsonType: ["double", "int", "long", "decimal"],
          exclusiveMinimum: 0
        }
      }
    }
  }
});
db.bills.createIndex({ bill_id: 1 }, { unique: true });
db.bills.createIndex({ service_id: 1 }, { unique: true });
db.bills.createIndex({ cust_id: 1 });

// ============================================================
// 2. MONGODB NATIVE VIEWS
// ============================================================
print("Creating Views...");

db.createView("v_service_summary", "services", [
  {
    $lookup: {
      from: "customers",
      localField: "cust_id",
      foreignField: "cust_id",
      as: "c"
    }
  },
  {
    $lookup: {
      from: "mechanics",
      localField: "mechanic_ids",
      foreignField: "mech_id",
      as: "m"
    }
  },
  {
    $project: {
      _id: 0,
      service_id: "$service_id",
      service_date: "$service_date",
      customer: {
        $concat: [
          { $ifNull: [{ $first: "$c.first_name" }, ""] },
          " ",
          { $ifNull: [{ $first: "$c.last_name" }, ""] }
        ]
      },
      status: "$status",
      charge: "$charge",
      mechanics: {
        $reduce: {
          input: "$m.name",
          initialValue: "",
          in: {
            $cond: [
              { $eq: ["$$value", ""] },
              "$$this",
              { $concat: ["$$value", ", ", "$$this"] }
            ]
          }
        }
      }
    }
  }
]);

db.createView("v_bay_status", "bays", [
  {
    $project: {
      _id: 0,
      bay_id: "$bay_id",
      bay_type: "$bay_type",
      state: {
        $cond: [{ $eq: ["$occupied", 1] }, "Occupied", "Free"]
      },
      cust_id: "$assigned_vehicle.cust_id",
      vehicle_id: "$assigned_vehicle.vehicle_id"
    }
  }
]);

// ============================================================
// 3. SEED DATA
// ============================================================
print("Seeding initial documents...");

db.departments.insertMany([
  { dept_id: 1, dept_name: "Engine" },
  { dept_id: 2, dept_name: "Electrical" },
  { dept_id: 3, dept_name: "Body & Paint" },
  { dept_id: 4, dept_name: "Tyres" }
]);

db.mechanics.insertMany([
  { mech_id: 1, name: "Ramesh Patil", dept_id: 1, specializations: ["Diesel engines", "Turbo repair"] },
  { mech_id: 2, name: "Sunil Jadhav", dept_id: 2, specializations: ["Wiring", "Battery"] },
  { mech_id: 3, name: "Akbar Shaikh", dept_id: 3, specializations: ["Dent removal"] },
  { mech_id: 4, name: "Vikas More", dept_id: 1, specializations: ["Petrol engines"] },
  { mech_id: 5, name: "Deepak Kale", dept_id: 4, specializations: ["Wheel alignment"] }
]);

db.customers.insertMany([
  {
    cust_id: 1, first_name: "Aarav", last_name: "Kulkarni", dob: "2001-05-14",
    phones: ["9876543210", "9123456780"],
    vehicles: [
      { vehicle_id: 1, reg_date: "2022-02-10", bay_id: 1 },
      { vehicle_id: 2, reg_date: "2024-07-19", bay_id: null }
    ]
  },
  {
    cust_id: 2, first_name: "Sneha", last_name: "Deshmukh", dob: "1998-11-02",
    phones: ["9988776655"],
    vehicles: [
      { vehicle_id: 1, reg_date: "2021-12-01", bay_id: 3 }
    ]
  },
  {
    cust_id: 3, first_name: "Rohan", last_name: "Pawar", dob: "1995-03-21",
    phones: ["9012345678"],
    vehicles: [
      { vehicle_id: 1, reg_date: "2023-04-25", bay_id: null }
    ]
  },
  {
    cust_id: 4, first_name: "Priya", last_name: "Joshi", dob: "2002-08-30",
    phones: ["9345678901"],
    vehicles: [
      { vehicle_id: 1, reg_date: "2025-01-15", bay_id: null }
    ]
  },
  {
    cust_id: 5, first_name: "Karan", last_name: "Mehta", dob: "1990-01-09",
    phones: [],
    vehicles: []
  }
]);

db.bays.insertMany([
  { bay_id: 1, bay_type: "Lift", occupied: 1, assigned_vehicle: { cust_id: 1, vehicle_id: 1 } },
  { bay_id: 2, bay_type: "Lift", occupied: 0, assigned_vehicle: null },
  { bay_id: 3, bay_type: "Wash", occupied: 1, assigned_vehicle: { cust_id: 2, vehicle_id: 1 } },
  { bay_id: 4, bay_type: "Alignment", occupied: 0, assigned_vehicle: null },
  { bay_id: 5, bay_type: "General", occupied: 0, assigned_vehicle: null }
]);

db.services.insertMany([
  { service_id: 1, service_date: "2026-09-01", cust_id: 1, charge: 4500.0, status: "Completed", mechanic_ids: [1, 4] },
  { service_id: 2, service_date: "2026-09-05", cust_id: 2, charge: 1200.0, status: "Completed", mechanic_ids: [3] },
  { service_id: 3, service_date: "2026-09-12", cust_id: 3, charge: 8000.0, status: "Completed", mechanic_ids: [1, 2] },
  { service_id: 4, service_date: "2026-09-20", cust_id: 1, charge: 2500.0, status: "Completed", mechanic_ids: [5] },
  { service_id: 5, service_date: "2026-10-01", cust_id: 4, charge: 3000.0, status: "Booked", mechanic_ids: [2] }
]);

db.bills.insertMany([
  { bill_id: 1, cust_id: 1, service_id: 1, amount: 5310.0 },
  { bill_id: 2, cust_id: 2, service_id: 2, amount: 1416.0 },
  { bill_id: 3, cust_id: 3, service_id: 3, amount: 9440.0 },
  { bill_id: 4, cust_id: 1, service_id: 4, amount: 2950.0 }
]);

print("[✓] Setup and seed complete!\n");

// ============================================================
// 4. DEMO QUERIES IN MONGODB
// ============================================================
print("=== 1. $lookup: customer -> vehicle -> bay ===");
printjson(db.customers.aggregate([
  { $unwind: "$vehicles" },
  {
    $lookup: {
      from: "bays",
      localField: "vehicles.bay_id",
      foreignField: "bay_id",
      as: "bay_info"
    }
  },
  {
    $project: {
      _id: 0,
      first_name: 1,
      vehicle_id: "$vehicles.vehicle_id",
      reg_date: "$vehicles.reg_date",
      bay_id: "$vehicles.bay_id",
      bay_type: { $ifNull: [{ $first: "$bay_info.bay_type" }, "None"] }
    }
  }
]).toArray());

print("\n=== 2. $group + $match (HAVING > 5000) ===");
printjson(db.bills.aggregate([
  {
    $group: {
      _id: "$cust_id",
      bills: { $sum: 1 },
      total: { $sum: "$amount" }
    }
  },
  { $match: { total: { $gt: 5000 } } },
  {
    $lookup: {
      from: "customers",
      localField: "_id",
      foreignField: "cust_id",
      as: "c"
    }
  },
  {
    $project: {
      _id: 0,
      cust_id: "$_id",
      first_name: { $first: "$c.first_name" },
      bills: 1,
      total: 1
    }
  },
  { $sort: { total: -1 } }
]).toArray());

print("\n=== 3. Subquery: services costlier than average ===");
printjson(db.services.aggregate([
  {
    $group: {
      _id: null,
      avgCharge: { $avg: "$charge" },
      docs: { $push: "$$ROOT" }
    }
  },
  { $unwind: "$docs" },
  {
    $match: {
      $expr: { $gt: ["$docs.charge", "$avgCharge"] }
    }
  },
  {
    $project: {
      _id: 0,
      service_id: "$docs.service_id",
      cust_id: "$docs.cust_id",
      charge: "$docs.charge"
    }
  }
]).toArray());

print("\n=== 4. Correlated subquery equivalent: Customers with no vehicle in bay ===");
printjson(db.customers.find({
  vehicles: {
    $not: {
      $elemMatch: { bay_id: { $ne: null } }
    }
  }
}, { _id: 0, first_name: 1, last_name: 1 }).toArray());

print("\n=== 5. Left outer join & workload: Mechanics, department & workload ===");
printjson(db.mechanics.aggregate([
  {
    $lookup: {
      from: "departments",
      localField: "dept_id",
      foreignField: "dept_id",
      as: "dept"
    }
  },
  {
    $lookup: {
      from: "services",
      localField: "mech_id",
      foreignField: "mechanic_ids",
      as: "assigned"
    }
  },
  {
    $project: {
      _id: 0,
      name: 1,
      dept_name: { $first: "$dept.dept_name" },
      services: { $size: "$assigned" }
    }
  }
]).toArray());

print("\n=== 6. Multivalued attributes: specializations ===");
printjson(db.mechanics.find({}, { _id: 0, name: 1, specializations: 1 }).toArray());

print("\n=== 7. $unionWith: Customers and Mechanics ===");
printjson(db.customers.aggregate([
  { $project: { _id: 0, who: "$first_name", kind: { $literal: "customer" } } },
  {
    $unionWith: {
      coll: "mechanics",
      pipeline: [{ $project: { _id: 0, who: "$name", kind: { $literal: "mechanic" } } }]
    }
  },
  { $sort: { kind: 1, who: 1 } }
]).toArray());

print("\n=== 8. Window function ($setWindowFields): rank customers ===");
printjson(db.bills.aggregate([
  { $group: { _id: "$cust_id", spent: { $sum: "$amount" } } },
  {
    $lookup: {
      from: "customers",
      localField: "_id",
      foreignField: "cust_id",
      as: "c"
    }
  },
  {
    $project: {
      _id: 0,
      first_name: { $first: "$c.first_name" },
      spent: 1
    }
  },
  {
    $setWindowFields: {
      sortBy: { spent: -1 },
      output: { rnk: { $denseRank: {} } }
    }
  }
]).toArray());

print("\n=== 9. Views ===");
print("View v_service_summary:");
printjson(db.v_service_summary.find().toArray());

print("View v_bay_status:");
printjson(db.v_bay_status.find().toArray());
