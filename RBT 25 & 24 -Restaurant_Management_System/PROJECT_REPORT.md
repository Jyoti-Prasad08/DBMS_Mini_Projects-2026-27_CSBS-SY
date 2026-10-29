# RESTAURANT MANAGEMENT SYSTEM (RMS)
## Comprehensive Database Management Systems Mini Project Report

---

**Institution:** JSPM’s Rajarshi Shahu College of Engineering, Tathawade, Pune  
*(An Autonomous Institute affiliated to Savitribai Phule Pune University)*  
**Department:** Department of Computer Science and Business Systems  
**Academic Year:** 2026–27 (Semester III)  
**Project Title:** Restaurant Management System  
**Submitted By:** Bhumi (PRN: ________), Name 2 (PRN: ________)  
**Guided By:** Prof. Rutuja S. Bachhav  
**Course Name:** Database Management System (DBMS)  
**Project Location:** `C:\Users\bhumi\Desktop\DBMS PROJECT`  

---

## COURSE OUTCOMES, POS, PSOS & SDGS MAPPED

### Course Outcomes (COs)
- **CO1:** Design a database schema and 2–tier application for a given problem statement.
- **CO2:** Design SQL DDL/DML queries to create, secure, populate, maintain, and query a database using integrity constraints, stored triggers, views, and PL/SQL blocks.

### Program Outcomes (POs) & PSOs
- **PO1, PO2, PO3, PO4, PO5, PO8, PO9, PO10, PO11:** Applied mathematical, engineering, computing, problem analysis, tool usage, teamwork, and lifelong learning principles.
- **PSO 1, PSO 2, PSO 3:** Integrated technical proficiency, data-driven decision making, interdisciplinary collaboration & professional ethics.

### Sustainable Development Goals (SDGs)
- **SDG 4:** Quality Education
- **SDG 8:** Decent Work and Economic Growth
- **SDG 9:** Industry, Innovation and Infrastructure
- **SDG 12:** Responsible Consumption and Production

---

## 1. ABSTRACT
Food service establishments handle a continuous flow of customer orders, table turnarounds, kitchen preparations, staff duties, ingredient procurement, and supplier payments. When managed using paper kitchen order tickets (KOTs) or disconnected spreadsheets, operations suffer from billing calculation errors, inventory stockouts, delayed kitchen delivery, and lack of financial audit trails.

This mini project presents a complete **Restaurant Management System (RMS)** that unifies the entire operational lifecycle into a robust relational database. The core business data (restaurant, employees, vendors, raw materials, menu items, customers, orders, services, finances, and feedback) is housed in a normalized MySQL 8.0 database named `restaurant_db`, designed strictly according to Chen notation ER specifications and Third Normal Form (3NF). Business logic, such as automatic bill total calculation upon ordering, is enforced at the database layer via active triggers (`trg_after_order_item_*`). Real-time operational alerts for low ingredient stocks (<= 15 units) and monthly net profit statements are provided through dedicated views (`v_low_stock`, `v_monthly_profit`). A responsive web application built with Streamlit and Python connects to MySQL, offering 10 interactive modules including an interactive SQL Laboratory for academic evaluation.

---

## 2. INTRODUCTION
### Background / Motivation
A modern restaurant is a data-driven business. Point-of-Sale (POS) order dispatch, dynamic bill calculation, stock inventory tracking, and financial ledgers must be handled as database transactions to guarantee consistency across concurrent operations. In traditional dining setups, orders are handwritten on paper slips and inventory is checked manually. These outdated methods lead to revenue leakage, billing discrepancies, and stock depletion during peak dining hours.

### Problem Definition
To design and implement a database-driven Restaurant Management System that stores restaurant, employee, vendor, raw material, menu item, customer, order, service, finance, and feedback data; automates order billing calculation via active triggers; tracks ingredient stock thresholds; and provides real-time financial and operational analytics through dedicated database views.

### Objectives
- Design an ER model and map it to a relational schema in Third Normal Form (3NF) with primary keys, foreign keys, and CHECK constraints.
- Implement the schema in MySQL 8.0 using DDL, and populate it with realistic test data across 15 tables.
- Enforce business rules inside the database through active triggers (automated billing) and views (low stock, monthly profit).
- Formulate 10 analytical SQL queries using joins, GROUP BY, HAVING, subqueries, and set operations.
- Build a functional Streamlit web application providing 10 operational modules and an interactive SQL Lab for live demonstration.

---

## 3. LITERATURE SURVEY / EXISTING SYSTEM

| Approach | Strengths | Limitations / Gap |
|---|---|---|
| **Paper registers & KOTs** | Cheap, no training required | No search, arithmetic mistakes, easy to lose slips |
| **Spreadsheets (Excel)** | Sorting and totals | No constraints, weak multi-user safety, manual formulas |
| **Commercial POS (Toast, Petpooja)** | Full feature set | Costly, closed proprietary design, not suited for learning |
| **Student RMS projects** | Easy to build | Rules kept in app code; weak triggers, unnormalized schema |
| **Proposed: MySQL + Streamlit RMS** | Rules inside DB (triggers & views); 3NF schema | Single restaurant prototype, expandable to multi-branch |

---

## 4. PROPOSED SYSTEM & ARCHITECTURE

### 3-Tier Architecture
- **Tier 1 (Presentation):** Streamlit Web Interface (10 interactive modules).
- **Tier 2 (Application / Logic):** Python 3.13 Engine, `mysql-connector-python`, `pandas`, transaction handlers.
- **Tier 3 (Database):** MySQL 8.0 (InnoDB) with 15 tables in 3NF, active triggers, and analytical views.

### Table 1: Relationships in the ER Model
| Relationship | Entities | Cardinality |
|---|---|---|
| Employs | Restaurant – Employee | 1 : N |
| Serves | Restaurant – Menu_Item | 1 : N |
| Provides | Restaurant – Service | 1 : N |
| Records | Restaurant – Finance | 1 : N |
| Receives | Restaurant – Orders | 1 : N |
| Places | Customer – Orders | 1 : N |
| Gives | Customer – Feedback | 1 : N |
| About (optional) | Orders – Feedback | 1 : N |
| Contains | Orders – Menu_Item (Order_Item) | M : N |
| Supplies | Vendor – Raw_Material | 1 : N |
| Talks to | Employee – Vendor (Employee_Vendor) | M : N |
| Performs | Employee – Service (Employee_Service) | M : N |
| Manages | Employee – Finance | 1 : N |
| For | Finance – Service (Finance_Service) | M : N |

### Table 2: Relational Schema of restaurant_db (3NF)
| Table | Primary key | Foreign keys | Important constraints |
|---|---|---|---|
| Restaurant | restaurant_id | - | NOT NULL name, owner, address; rent >= 0 |
| Employee | employee_id | restaurant_id -> Restaurant | ENUM gender, shift; salary > 0; ON DELETE CASCADE |
| Vendor | vendor_id | - | NOT NULL name, phone, address |
| Employee_Vendor | (employee_id, vendor_id) | employee_id, vendor_id | Composite PK; M:N bridge table |
| Raw_Material | material_id | vendor_id -> Vendor | unit_price > 0, stock_qty >= 0 |
| Menu_Item | item_id | restaurant_id -> Restaurant | category NOT NULL, price > 0 |
| Customer | customer_id | - | NOT NULL name, phone_number |
| Customer_Email | (customer_id, email) | customer_id -> Customer | Composite PK; Multivalued email in 3NF |
| Orders | order_id | customer_id, restaurant_id | table_number > 0; ENUM status; total_amount >= 0 |
| Order_Item | (order_id, item_id) | order_id, item_id | quantity > 0; triggers update Orders.total_amount |
| Service | service_id | restaurant_id -> Restaurant | cost >= 0 |
| Employee_Service | (employee_id, service_id) | employee_id, service_id | Composite PK; M:N bridge table |
| Finance | finance_id | restaurant_id, managed_by | UNIQUE month_year; turnover >= 0 |
| Finance_Service | (finance_id, service_id) | finance_id, service_id | Composite PK; amount >= 0 |
| Feedback | feedback_id | customer_id, order_id | CHECK rating BETWEEN 1 AND 5 |

---

## 5. METHODOLOGY & IMPLEMENTATION

### 5.1 System & Design Approach
The development of the Restaurant Management System (RMS) adopts a structured engineering methodology combining a **Top-Down Database Life Cycle**, an industry-standard **3-Tier Layered Architecture**, and an **Active Database Management Paradigm**:

1. **Top-Down Database Design Methodology:**
   - **Requirement Analysis:** Identified and categorized core functional restaurant entities: restaurant branches, role-based staff, suppliers, raw material inventories, menu items, customer accounts, orders, line-item billings, financial ledgers, and customer ratings.
   - **Conceptual Schema Modeling (ER Model):** Created an Entity-Relationship model following Chen’s notation to define entity boundaries, composite/multivalued attributes, and relationship cardinalities ($1:1$, $1:N$, and $M:N$).
   - **Logical Schema Mapping:** Converted ER abstractions into relational tables, resolving $M:N$ associations into dedicated junction tables (`Order_Item`, `Employee_Vendor`, `Employee_Service`, `Finance_Service`) with composite primary keys.
   - **Schema Normalization (3NF):** Systematically decomposed tables up to Third Normal Form (3NF). Eliminated repeating groups and multivalued attributes by isolating customer emails into a `Customer_Email` table (1NF), removed partial dependencies from composite keys (2NF), and resolved transitive dependencies so all non-key fields functionally depend strictly on primary keys (3NF), thereby preventing update, insertion, and deletion anomalies.

2. **3-Tier Architectural Approach:**
   - **Presentation Tier (Frontend):** Implemented using Streamlit 1.65.0, providing a responsive, intuitive web dashboard spanning 10 specialized operational modules and an interactive SQL Laboratory.
   - **Application / Logic Tier (Middleware):** Built with Python 3.13 to handle business rules, session persistence, connection pooling, and secure parameterized queries via `mysql-connector-python`.
   - **Data Tier (Storage & Integrity):** Hosted on MySQL 8.0 with the ACID-compliant InnoDB storage engine, ensuring transactional atomicity, persistence, constraints, triggers, and views.

3. **Active Database & Server-Side Integrity Approach:**
   - **Automated Calculations via PL/SQL Triggers:** Implemented `AFTER INSERT`, `AFTER UPDATE`, and `AFTER DELETE` triggers on `Order_Item` to compute item subtotals, apply $5\%$ taxes, and update order grand totals inside the database kernel rather than relying solely on client code.
   - **Analytical Views:** Encapsulated reporting queries into reusable views (`v_low_stock` for threshold-based ingredient reorder alerts and `v_monthly_profit` for net income statements).
   - **Declarative Constraints:** Enforced referential integrity via Foreign Keys with `ON DELETE RESTRICT` (protecting transaction histories) and `ON DELETE CASCADE` (purging orphan line items), combined with `CHECK` constraints (validating feedback scores).

4. **Modular & Fault-Tolerant Software Engineering:**
   - Implemented modular component boundaries with defensive fallback shims to ensure smooth operation across varied system environments.

### Table 3: Tools & Technologies Used
| Layer | Tool / Technology | Purpose |
|---|---|---|
| Relational database | MySQL 8.0 (InnoDB), MySQL Workbench | 15 tables, 2 views, 3 triggers, transactions, ACID safety |
| Application / Logic | Python 3.13, mysql-connector-python, pandas | Data wrangling, connection pooling, transaction helpers |
| Web front end | Streamlit 1.65.0 | Multi-page responsive dashboard with 10 operational modules |
| Design & Modeling | Matplotlib, Draw.io | 3-Tier architecture and Chen ER diagrams |

### Table 4: Database Objects Implemented in MySQL
| Object | Name | What it does |
|---|---|---|
| View | `v_low_stock` | Monitors ingredients with stock <= 15 and displays vendor contact details |
| View | `v_monthly_profit` | Aggregates monthly turnover, operating costs and calculates net profit |
| Trigger | `trg_after_order_item_insert` | AFTER INSERT ON Order_Item: dynamically recalculates Orders.total_amount |
| Trigger | `trg_after_order_item_update` | AFTER UPDATE ON Order_Item: updates Orders.total_amount dynamically |
| Trigger | `trg_after_order_item_delete` | AFTER DELETE ON Order_Item: updates Orders.total_amount dynamically |
| Constraint | `feedback_chk_1` | Enforces customer rating to be strictly between 1 and 5 |
| Constraint | `fk_orders_customer` | ON DELETE RESTRICT: prevents accidental deletion of customers with orders |
| Constraint | `fk_order_item_orders` | ON DELETE CASCADE: automatically cleans line items when order is purged |

---

## 6. RESULTS AND DISCUSSION

### Table 5: Objects Created and Data Loaded
| Item | Count | Item | Count |
|---|---|---|---|
| Tables | 15 | Restaurant | 1 |
| Views | 2 | Employees (with shifts) | 6 |
| Triggers | 3 | Vendors / Raw Materials | 4 / 8 |
| Constraints | 18 | Menu Items (5 categories) | 11 |
| Customers (with emails) | 5 (6 emails) | Orders (with 11 line items) | 5 |
| Services / Feedback | 4 / 3 | Finance Monthly Records | 3 |

### Sample Analytical Query Results

#### Query 1: Monthly Revenue (SUM, COUNT, GROUP BY)
| month | total_orders | total_revenue | average_order_amount |
|---|---|---|---|
| 2026-10 | 5 | 3525.00 | 705.00 |
| 2026-09 | 4 | 2890.00 | 722.50 |

#### Query 2: Best-Selling Menu Items by Category
| category | total_items_ordered | total_quantity_sold | estimated_revenue |
|---|---|---|---|
| Main Course | 5 | 6 | 1790.00 |
| Starter | 3 | 3 | 760.00 |
| Bread | 4 | 8 | 445.00 |
| Beverage | 3 | 4 | 380.00 |
| Dessert | 1 | 2 | 180.00 |

#### Query 3: High-Value Customers (JOIN, GROUP BY, HAVING)
| customer_id | cust_name | completed_orders | total_spent |
|---|---|---|---|
| 2 | Rahul Mehta | 1 | 1100.00 |
| 1 | Kavya Sharma | 1 | 860.00 |
| 3 | Sneha Rao | 1 | 615.00 |
| 5 | Deepak Joshi | 1 | 550.00 |
| 4 | Vikram Singh | 1 | 400.00 |

#### Query 4: Itemized Bill Breakdown on Order 1
| order_id | customer | item | quantity | unit_price | line_total |
|---|---|---|---|---|---|
| 1 | Kavya Sharma | Paneer Tikka | 1 | 240.00 | 240.00 |
| 1 | Kavya Sharma | Paneer Butter Masala | 1 | 290.00 | 290.00 |
| 1 | Kavya Sharma | Garlic Naan | 2 | 55.00 | 110.00 |
| 1 | Kavya Sharma | Mango Lassi | 2 | 110.00 | 220.00 |

### Table 12: Business-Rule Validation Behavior
| Action tried | Response from the database |
|---|---|
| Deleting customer with active orders | ERROR 1451: Foreign key constraint fails (ON DELETE RESTRICT) |
| Inserting feedback with rating 6 or 0 | ERROR 3819: Check constraint "feedback_chk_1" is violated |
| Inserting row into Order_Item | Orders.total_amount automatically recalculated via MySQL trigger |
| Checking low-stock ingredients | View v_low_stock automatically filters items with stock_qty <= 15 |
| Calculating monthly net profit | View v_monthly_profit dynamically computes turnover minus operating expenses |
| Customer with multiple email addresses | Normalized into Customer_Email in 3NF without repeating groups |

### Table 13: Comparison with Existing Methods
| Feature | Registers & KOTs | Spreadsheets | Proposed system |
|---|---|---|---|
| Automatic bill calculation | No (manual) | Manual formulas | Yes (active MySQL triggers) |
| Stockout alerting | No | Weak / manual | Yes (view v_low_stock) |
| Multi-user ACID safety | No | No | Yes (InnoDB engine) |
| Referential integrity rules | No | No | Foreign Keys, CHECK constraints |
| Multi-valued attribute handling | Mixed text | Comma lists | Yes (Customer_Email in 3NF) |
| Financial profit analysis | Manual | Error-prone | Yes (view v_monthly_profit) |
| Interactive SQL console | None | None | Yes (built-in SQL Lab) |

---

## 7. CONCLUSION AND FUTURE SCOPE
A complete Restaurant Management System was designed from an ER diagram to a working 2-tier application. The relational design satisfies 3NF, business rules live inside MySQL as constraints, 2 views, and 3 active billing triggers, and a modular Streamlit UI provides intuitive management. The project covers all course outcomes (CO1, CO2), program outcomes, and relevant SDGs.

**Future Scope:** Table-side QR-code digital ordering, payment gateway webhooks (Razorpay/Stripe), machine learning demand forecasting, and multi-branch chain support.

---

## 8. REFERENCES
1. E. F. Codd, “A Relational Model of Data for Large Shared Data Banks,” CACM, vol. 13, no. 6, pp. 377–387, 1970.
2. P. P. Chen, “The Entity-Relationship Model: Toward a Unified View of Data,” ACM TODS, vol. 1, no. 1, pp. 9–36, 1976.
3. R. Elmasri and S. B. Navathe, *Fundamentals of Database Systems*, 7th ed., Pearson, 2016.
4. A. Silberschatz, H. F. Korth and S. Sudarshan, *Database System Concepts*, 7th ed., McGraw-Hill, 2019.
5. MySQL 8.0 Reference Manual: https://dev.mysql.com/doc/refman/8.0/en/
6. Streamlit Python Framework Documentation: https://docs.streamlit.io/
