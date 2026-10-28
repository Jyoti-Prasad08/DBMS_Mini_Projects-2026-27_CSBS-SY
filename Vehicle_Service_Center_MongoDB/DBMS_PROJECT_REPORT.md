# DBMS Mini Project Report
# Vehicle Service Center Management System
### Relational-to-Document Database (MongoDB) Architecture

---

## 1. Executive Summary

This project implements a **Vehicle Service Center Management System** using **MongoDB** as the underlying Database Management System (DBMS), paired with a **Python (PyMongo)** backend and **Streamlit** dashboard. 

The domain models seven foundational entities:
1. `DEPARTMENT`: Operating sections of the service center (Engine, Electrical, Body & Paint, Tyres).
2. `MECHANIC`: Certified technicians assigned to specific departments, with multivalued technical specializations.
3. `CUSTOMER`: Clients registered with composite names, birthdates, and multivalued phone numbers.
4. `VEHICLE`: Weak entity owned by a customer, tracked by registration date and repair bay occupancy.
5. `BAY`: Service slots classified by type (`Lift`, `Wash`, `Alignment`, `General`) and real-time occupancy.
6. `SERVICE`: Scheduled maintenance and repair jobs linking customers to multiple assigned mechanics.
7. `BILL`: Financial invoices generated automatically upon service completion, applying an 18% GST calculation.

---

## 2. Conceptual Modeling: ER to Document Mapping

In traditional Relational DBMS, the schema required **10 normalized tables** (including 2 junction tables for multivalued attributes and 1 junction table for M:N service-mechanic relationships).

In **MongoDB**, we leverage the **Document Model** by strategically choosing between **Embedding** and **Referencing**:

### A. Embedding Decisions (Denormalization)
* **Multivalued Attributes (1:M Strong Coupling)**:
  * In RDBMS: `customer_phone` and `mechanic_specialization` required separate tables and foreign key joins.
  * In MongoDB: Stored as native **arrays of strings** (`phones: ["9876543210"]`, `specializations: ["Diesel engines", "Turbo repair"]`). This guarantees $O(1)$ single-read retrieval without JOIN overhead.
* **Weak Entity (`VEHICLE`)**:
  * In RDBMS: Weak entity with composite primary key `(cust_id, vehicle_id)` and foreign key referencing `customer`.
  * In MongoDB: Embedded directly inside the `customer` document as an array of subdocuments. Because a vehicle is intrinsically owned by its customer and lifecycle-dependent on them, embedding reflects natural real-world containment and supports atomic updates.

### B. Referencing Decisions (Normalized Relationships)
* `departments` $\rightarrow$ `mechanics`: Referenced via `dept_id`. Mechanics change or join departments independently; separating collections avoids unbounded document growth.
* `services` $\rightarrow$ `customers` & `mechanics`: Referenced via `cust_id` and array `mechanic_ids: [1, 4]`. This models the $M:N$ Attends relationship elegantly using an **array of references** without requiring a dedicated junction table (`service_mechanic`).
* `bays` $\rightarrow$ `assigned_vehicle`: Referenced via `{ cust_id, vehicle_id }` subdocument to maintain 1:1 slot assignment while preventing race conditions.
* `bills` $\rightarrow$ `services`: Referenced via unique `service_id` to enforce a strict 1:1 invoice-to-service relationship.

---

## 3. Collections & Schema Validation ($jsonSchema)

To enforce strict relational integrity within a schema-flexible document store, we configure **MongoDB Collection JSON Schema Validation**:

```javascript
// Example: Customer Collection Validator
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
            description: "Phone numbers must be exactly 10 digits"
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
```

---

## 4. Query Comparison: SQL vs MongoDB Aggregation

### 1. Multi-Table JOIN vs `$lookup` Pipeline
* **SQL**:
  ```sql
  SELECT c.first_name, v.vehicle_id, v.reg_date, b.bay_id, b.bay_type
  FROM customer c 
  JOIN vehicle v ON v.cust_id = c.cust_id
  LEFT JOIN bay b ON b.bay_id = v.bay_id;
  ```
* **MongoDB**:
  ```javascript
  db.customers.aggregate([
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
  ]);
  ```

### 2. GROUP BY + HAVING vs `$group` + `$match`
* **SQL**:
  ```sql
  SELECT c.cust_id, c.first_name, COUNT(*) AS bills, SUM(b.amount) AS total
  FROM customer c JOIN bill b ON b.cust_id = c.cust_id
  GROUP BY c.cust_id HAVING SUM(b.amount) > 5000 ORDER BY total DESC;
  ```
* **MongoDB**:
  ```javascript
  db.bills.aggregate([
    { $group: { _id: "$cust_id", bills: { $sum: 1 }, total: { $sum: "$amount" } } },
    { $match: { total: { $gt: 5000 } } },
    { $lookup: { from: "customers", localField: "_id", foreignField: "cust_id", as: "c" } },
    { $project: { _id: 0, cust_id: "$_id", first_name: { $first: "$c.first_name" }, bills: 1, total: 1 } },
    { $sort: { total: -1 } }
  ]);
  ```

### 3. Window Function (Ranking)
* **SQL**:
  ```sql
  SELECT c.first_name, SUM(b.amount) AS spent,
         RANK() OVER (ORDER BY SUM(b.amount) DESC) AS rnk
  FROM customer c JOIN bill b ON b.cust_id = c.cust_id GROUP BY c.cust_id;
  ```
* **MongoDB**:
  ```javascript
  db.bills.aggregate([
    { $group: { _id: "$cust_id", spent: { $sum: "$amount" } } },
    { $lookup: { from: "customers", localField: "_id", foreignField: "cust_id", as: "c" } },
    { $project: { _id: 0, first_name: { $first: "$c.first_name" }, spent: 1 } },
    {
      $setWindowFields: {
        sortBy: { spent: -1 },
        output: { rnk: { $denseRank: {} } }
      }
    }
  ]);
  ```

---

## 5. Views & Triggers in MongoDB

### Database Views
MongoDB supports declarative, non-materialized views using `db.createView`:
1. `v_service_summary`: Consolidates service records, customer full name, and comma-concatenated mechanic names.
2. `v_bay_status`: Translates binary flag (`occupied: 0/1`) to human-readable `'Occupied'` / `'Free'` with vehicle identifiers.

### Triggers & Business Rules
* **Age Verification (>= 18)**: Handled on customer insertion before persistence.
* **Bay Mutual Exclusion**: Concurrency rule ensuring no two vehicles occupy the same service bay.
* **Automatic Invoice Generation**: When a service status changes to `'Completed'`, a trigger computes:
  $$\text{Invoice Amount} = \text{Charge} \times 1.18 \quad (\text{Base} + 18\% \text{ GST})$$
  and inserts the record into the `bills` collection atomically.

---

## 6. Indexing & Query Execution Optimization

Indexes configured on high-traffic filter and join columns:
* `idx_service_cust` on `services(cust_id)`
* `idx_service_date` on `services(service_date)`
* `idx_bill_cust` on `bills(cust_id)`
* Unique index on `departments(dept_name)`
* Unique index on `bills(service_id)` (enforcing 1:1 service-bill constraint)

Query plan analysis using `explain("executionStats")` confirms that lookups on `services` by `cust_id` execute via **`IXSCAN`** (Index Scan) rather than **`COLLSCAN`** (Collection Scan), ensuring scalable $O(\log N)$ performance.

---

## 7. Conclusion

By migrating the Vehicle Service Center system from relational SQLite to document-oriented MongoDB, the application achieves:
1. Significant query simplification through document embedding (eliminating 3 junction tables).
2. Strict integrity enforcement using `$jsonSchema` validators and unique indexes.
3. Expressive analytical reporting using the MongoDB Aggregation Framework and Window Functions (`$setWindowFields`).
4. Real-time visual monitoring via an interactive Streamlit UI dashboard.
