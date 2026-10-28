# 🔧 Vehicle Service Center - MongoDB DBMS Mini Project

A complete academic DBMS mini-project implemented with **MongoDB** (NoSQL Document Store) and **Python (PyMongo + Streamlit)**.

Adapted from the relational ER model with entities:
**CUSTOMER**, **VEHICLE** (weak entity), **SERVICE**, **MECHANIC**, **BAY**, **BILL**, and **DEPARTMENT**.

---

## 📁 Project Structure

| File | Purpose |
| :--- | :--- |
| `service_center_mongo.py` | Core Python application with MongoDB schemas, `$jsonSchema` validators, business rules, procedures, and the 13 DBMS concepts demo. |
| `app.py` | Streamlit web application providing a full UI dashboard, customer/vehicle/service/bay management, and an interactive MongoDB query console. |
| `mongo_setup.js` | Standalone MongoDB shell (`mongosh`) script that builds collections, schema validators, indexes, views, seed data, and executes demo queries. |
| `run_project.sh` | Interactive shell launcher (detects MongoDB, sets up Python virtualenv, installs dependencies, and launches demo or UI). |
| `requirements.txt` | Python dependencies (`pymongo`, `streamlit`, `pandas`). |
| `DBMS_PROJECT_REPORT.md` | Comprehensive academic DBMS project report covering relational-to-document mapping, pipeline translations, indexes, and ACID transactions. |

---

## ⚡ Quick Start

### 1. Ensure MongoDB is Running
MongoDB is already installed on your Mac (`/opt/homebrew/bin/mongosh`, `mongod`). Start the service if not active:
```bash
brew services start mongodb-community
# or run directly:
# mongod --config /opt/homebrew/etc/mongod.conf --fork
```

### 2. Install Python Dependencies
```bash
pip3 install -r requirements.txt
```

### 3. Run Options

#### Option A: One-Click Interactive Launcher
```bash
chmod +x run_project.sh
./run_project.sh
```

#### Option B: Run Full DBMS Concepts Demo (CLI)
Runs all 13 database concepts (Lookups, Aggregation, Views, Triggers, Schema Validation, Window Functions, Explain Plans):
```bash
python3 service_center_mongo.py --demo
```

#### Option C: Interactive CLI Menu
```bash
python3 service_center_mongo.py
```

#### Option D: Launch Streamlit Web UI
```bash
streamlit run app.py
```

#### Option E: Run Directly via MongoDB Shell (`mongosh`)
```bash
mongosh mongodb://localhost:27017/service_center mongo_setup.js
```

---

## 🧠 Relational vs MongoDB Concepts Covered

| # | DBMS Concept | SQL / SQLite Implementation | MongoDB NoSQL Implementation |
|---|---|---|---|
| 1 | **Multi-Entity JOIN** | `JOIN customer JOIN vehicle LEFT JOIN bay` | Aggregation `$lookup` stage with `$unwind` |
| 2 | **GROUP BY + HAVING** | `GROUP BY cust_id HAVING SUM(amount) > 5000` | Aggregation `$group` + `$match: { total: { $gt: 5000 } }` |
| 3 | **Subqueries** | `WHERE charge > (SELECT AVG(charge) ...)` | Aggregation `$group` with `$avg` + `$expr: { $gt: [...] }` |
| 4 | **Correlated Subquery** | `WHERE NOT EXISTS (SELECT 1 FROM vehicle ...)` | Nested query on embedded array: `{ vehicles: { $not: { $elemMatch: { bay_id: { $ne: null } } } } }` |
| 5 | **Workload & Left Join** | `LEFT JOIN service_mechanic GROUP BY m.mech_id` | Pipeline `$lookup` on array field + `$size` |
| 6 | **Multivalued Attributes** | Separate junction tables (`mechanic_specialization`, `customer_phone`) | **Native arrays** embedded directly in documents |
| 7 | **UNION / Set Operations**| `UNION SELECT ...` | Aggregation stage `$unionWith` |
| 8 | **Window Functions** | `RANK() OVER (ORDER BY SUM(amount) DESC)` | MongoDB 5.0+ `$setWindowFields` stage with `$denseRank` |
| 9 | **Database Views** | `CREATE VIEW v_service_summary` | MongoDB Read-Only Views via `db.createView(...)` |
| 10| **Constraints & Check Rules** | `CHECK`, `NOT NULL`, `FOREIGN KEY` | Native **MongoDB JSON Schema Validation (`$jsonSchema`)** and Unique Indexes |
| 11| **Triggers / Business Logic**| `CREATE TRIGGER ...` | Application hooks / atomic operations enforcing age >= 18, bay collision checks, and auto-billing with 18% GST |
| 12| **Transactions / Atomicity** | `with conn:` (ACID rollback) | Atomic document updates and validated batch writes |
| 13| **Index Optimization** | `EXPLAIN QUERY PLAN` | `db.command({ explain: ..., verbosity: "executionStats" })` showing `IXSCAN` |
