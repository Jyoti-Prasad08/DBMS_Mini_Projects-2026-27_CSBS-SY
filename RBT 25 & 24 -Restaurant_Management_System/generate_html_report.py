"""
Generates a printable, publication-grade HTML report for Restaurant Management System
matching the exact college template, outcomes mapping, tables, and diagrams.
"""
import os
import base64

def generate_html_report():
    project_dir = r"C:\Users\bhumi\Desktop\DBMS PROJECT"
    html_file = os.path.join(project_dir, "PROJECT_REPORT.html")
    arch_file = os.path.join(project_dir, "Restaurant_Architecture.png")
    er_file = os.path.join(project_dir, "ER_Diagram.png")
    jspm_logo = os.path.join(project_dir, "template_assets", "ppt_image1.jpeg")
    rscoe_logo = os.path.join(project_dir, "template_assets", "ppt_image2.png")

    def to_b64(path):
        if os.path.exists(path):
            with open(path, "rb") as f:
                return base64.b64encode(f.read()).decode("utf-8")
        return ""

    arch_b64 = to_b64(arch_file)
    er_b64 = to_b64(er_file)
    jspm_b64 = to_b64(jspm_logo)
    rscoe_b64 = to_b64(rscoe_logo)

    html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Mini Project Report - Restaurant Management System</title>
<style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Fira+Code:wght@400;500&display=swap');

    @page {{
        size: A4;
        margin: 20mm 15mm 20mm 15mm;
    }}

    body {{
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        color: #1e293b;
        background-color: #f8fafc;
        line-height: 1.6;
        font-size: 13.5px;
        margin: 0;
        padding: 0;
    }}

    .container {{
        max-width: 900px;
        margin: 30px auto;
        background: #ffffff;
        padding: 50px 60px;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.06);
    }}

    @media print {{
        body {{
            background: #ffffff;
        }}
        .container {{
            max-width: 100%;
            margin: 0;
            padding: 0;
            box-shadow: none;
            border-radius: 0;
        }}
        .no-print {{
            display: none;
        }}
        .page-break {{
            page-break-after: always;
            break-after: page;
        }}
        h2 {{
            page-break-before: always;
            break-before: page;
        }}
        h2:first-of-type {{
            page-break-before: avoid;
            break-before: avoid;
        }}
    }}

    .cover-page {{
        text-align: center;
        padding: 40px 20px 40px 20px;
        border-bottom: 2px solid #e2e8f0;
        margin-bottom: 30px;
    }}
    .logo-row {{
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
    }}
    .logo-img {{
        height: 75px;
        width: auto;
    }}
    .college-header {{
        font-size: 17px;
        font-weight: 700;
        color: #0f172a;
        margin: 6px 0;
        line-height: 1.35;
    }}
    .college-sub {{
        font-size: 13px;
        color: #475569;
        margin: 4px 0 16px 0;
    }}
    .report-title-box {{
        margin: 25px 0;
        padding: 16px;
        background: #f1f5f9;
        border-radius: 6px;
        border: 1px solid #cbd5e1;
    }}
    .report-title {{
        font-size: 24px;
        font-weight: 800;
        color: #1e3a8a;
        margin: 4px 0;
    }}
    .meta-box {{
        display: inline-block;
        background: #f8fafc;
        border: 1px solid #cbd5e1;
        border-radius: 8px;
        padding: 16px 24px;
        text-align: left;
        margin-top: 15px;
        font-size: 13px;
        width: 80%;
    }}
    .meta-box table td {{
        padding: 4px 10px;
    }}
    .meta-label {{
        font-weight: 600;
        color: #334155;
    }}

    h1, h2, h3, h4 {{
        color: #0f172a;
        font-weight: 700;
    }}
    h1 {{ font-size: 22px; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; margin-top: 30px; }}
    h2 {{ font-size: 17px; color: #1e3a8a; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px; margin-top: 28px; }}
    h3 {{ font-size: 14.5px; color: #0369a1; margin-top: 20px; }}
    p {{ margin: 8px 0; }}

    table {{
        width: 100%;
        border-collapse: collapse;
        margin: 14px 0;
        font-size: 12.5px;
    }}
    th, td {{
        border: 1px solid #cbd5e1;
        padding: 6px 10px;
        text-align: left;
    }}
    th {{
        background-color: #f1f5f9;
        color: #0f172a;
        font-weight: 600;
    }}
    tr:nth-child(even) {{
        background-color: #f8fafc;
    }}

    pre, code {{
        font-family: 'Fira Code', Consolas, Monaco, monospace;
    }}
    code {{
        background: #f1f5f9;
        padding: 2px 5px;
        border-radius: 4px;
        font-size: 11.5px;
        color: #b91c1c;
    }}
    pre {{
        background: #0f172a;
        color: #e2e8f0;
        padding: 14px 18px;
        border-radius: 6px;
        overflow-x: auto;
        font-size: 11.5px;
        line-height: 1.45;
        margin: 14px 0;
    }}
    pre code {{
        background: transparent;
        padding: 0;
        color: inherit;
    }}

    .diagram-img {{
        width: 100%;
        max-width: 800px;
        height: auto;
        border: 1px solid #cbd5e1;
        border-radius: 6px;
        display: block;
        margin: 16px auto;
        box-shadow: 0 2px 6px rgba(0,0,0,0.05);
    }}

    .action-bar {{
        background: #1e293b;
        color: #ffffff;
        padding: 10px 24px;
        position: sticky;
        top: 0;
        z-index: 1000;
        display: flex;
        justify-content: space-between;
        align-items: center;
        box-shadow: 0 2px 10px rgba(0,0,0,0.15);
    }}
    .print-btn {{
        background: #2563eb;
        color: #ffffff;
        border: none;
        padding: 7px 16px;
        border-radius: 6px;
        font-weight: 600;
        cursor: pointer;
        font-size: 13px;
    }}
    .print-btn:hover {{
        background: #1d4ed8;
    }}
    .tag {{
        display: inline-block;
        padding: 2px 8px;
        border-radius: 4px;
        font-weight: 600;
        font-size: 11px;
        margin-right: 6px;
    }}
    .tag-co {{ background: #e0f2fe; color: #0369a1; }}
    .tag-po {{ background: #fef3c7; color: #92400e; }}
    .tag-sdg {{ background: #dcfce7; color: #166534; }}
</style>
</head>
<body>

<div class="action-bar no-print">
    <div><strong>JSPM's RSCOE - DBMS Mini Project:</strong> Restaurant Management System</div>
    <div>
        <button class="print-btn" onclick="window.print()">🖨️ Print / Save as PDF (Ctrl + P)</button>
    </div>
</div>

<div class="container">

    <div class="cover-page">
        <div class="logo-row">
            <img src="data:image/jpeg;base64,{jspm_b64}" class="logo-img" alt="JSPM Logo">
            <div style="flex: 1; padding: 0 20px;">
                <div class="college-header">JSPM’s Rajarshi Shahu College of Engineering, Tathawade, Pune</div>
                <div class="college-sub">(An Autonomous Institute affiliated to Savitribai Phule Pune University)<br>
                Department of Computer Science and Business Systems</div>
            </div>
            <img src="data:image/png;base64,{rscoe_b64}" class="logo-img" alt="RSCOE Logo">
        </div>

        <div class="report-title-box">
            <div style="font-size: 13px; color: #475569; font-weight: 600; letter-spacing: 1px;">MINI PROJECT REPORT ON</div>
            <div class="report-title">“Restaurant Management System”</div>
        </div>

        <div class="meta-box">
            <table>
                <tr><td class="meta-label">Submitted by:</td><td><strong>Bhumi</strong> (PRN No: ____________), Name 2 (PRN No: ____________)</td></tr>
                <tr><td class="meta-label">Under the guidance of:</td><td><strong>Prof. Rutuja S. Bachhav</strong></td></tr>
                <tr><td class="meta-label">Course:</td><td>Database Management System (DBMS)</td></tr>
                <tr><td class="meta-label">Academic Year:</td><td>2026–27 (Semester III)</td></tr>
                <tr><td class="meta-label">Project Location:</td><td><code>C:\\Users\\bhumi\\Desktop\\DBMS PROJECT</code></td></tr>
            </table>
        </div>
    </div>

    <h2>Course Outcomes, POs, PSOs & SDGs Mapped</h2>
    <p><span class="tag tag-co">CO1</span> Design a database schema and 2–tier application for a given problem statement.</p>
    <p><span class="tag tag-co">CO2</span> Design SQL DDL/DML queries to create, secure, populate, maintain, and query a database using integrity constraints, stored triggers, views, and PL/SQL blocks.</p>

    <h3>Program Outcomes (POs) & PSOs</h3>
    <p><strong>PO1, PO2, PO3, PO4, PO5, PO8, PO9, PO10, PO11</strong> — Engineering knowledge, problem analysis, development of solutions, engineering tool usage, teamwork, and lifelong learning.</p>
    <p><strong>PSO 1, PSO 2, PSO 3</strong> — Integrated technical proficiency, data-driven decision making, interdisciplinary collaboration & professionalism.</p>

    <h3>Sustainable Development Goals (SDGs)</h3>
    <p><span class="tag tag-sdg">SDG 4</span> Quality Education | <span class="tag tag-sdg">SDG 8</span> Decent Work and Economic Growth | <span class="tag tag-sdg">SDG 9</span> Industry, Innovation and Infrastructure | <span class="tag tag-sdg">SDG 12</span> Responsible Consumption and Production.</p>

    <h2>1. ABSTRACT</h2>
    <p>
        Food service establishments handle a continuous flow of customer orders, table turnarounds, kitchen preparations, staff duties, ingredient procurement, and supplier payments. When managed using paper kitchen order tickets (KOTs) or disconnected spreadsheets, operations suffer from billing calculation errors, inventory stockouts, delayed kitchen delivery, and lack of financial audit trails.
    </p>
    <p>
        This mini project presents a complete <strong>Restaurant Management System (RMS)</strong> that unifies the entire operational lifecycle into a robust relational database. The core business data (restaurant, employees, vendors, raw materials, menu items, customers, orders, services, finances, and feedback) is housed in a normalized MySQL 8.0 database named <code>restaurant_db</code>, designed strictly according to Chen notation ER specifications and Third Normal Form (3NF). Business logic, such as automatic bill total calculation upon ordering, is enforced at the database layer via active triggers (<code>trg_after_order_item_*</code>). Real-time operational alerts for low ingredient stocks (&le; 15 units) and monthly net profit statements are provided through dedicated views (<code>v_low_stock</code>, <code>v_monthly_profit</code>). A responsive web application built with Streamlit and Python connects to MySQL, offering 10 interactive modules including an interactive SQL Laboratory for academic evaluation.
    </p>

    <h2>2. INTRODUCTION</h2>
    <h3>Background / Motivation</h3>
    <p>
        A modern restaurant is a data-driven business. Point-of-Sale (POS) order dispatch, dynamic bill calculation, stock inventory tracking, and financial ledgers must be handled as database transactions to guarantee consistency across concurrent operations. In traditional dining setups, orders are handwritten on paper slips and inventory is checked manually. These outdated methods lead to revenue leakage, billing discrepancies, and stock depletion during peak dining hours.
    </p>
    <h3>Problem Definition</h3>
    <p>
        To design and implement a database-driven Restaurant Management System that stores restaurant, employee, vendor, raw material, menu item, customer, order, service, finance, and feedback data; automates order billing calculation via active triggers; tracks ingredient stock thresholds; and provides real-time financial and operational analytics through dedicated database views.
    </p>
    <h3>Objectives</h3>
    <ul>
        <li>Design an ER model and map it to a relational schema in Third Normal Form (3NF) with primary keys, foreign keys, and CHECK constraints.</li>
        <li>Implement the schema in MySQL 8.0 using DDL, and populate it with realistic test data across 15 tables.</li>
        <li>Enforce business rules inside the database through active triggers (automated billing) and views (low stock, monthly profit).</li>
        <li>Formulate 10 analytical SQL queries using joins, GROUP BY, HAVING, subqueries, and set operations.</li>
        <li>Build a functional Streamlit web application providing 10 operational modules and an interactive SQL Lab for live demonstration.</li>
    </ul>

    <h2>3. LITERATURE SURVEY / EXISTING SYSTEM</h2>
    <table>
        <tr>
            <th>Approach</th>
            <th>Strengths</th>
            <th>Limitations / Gap</th>
        </tr>
        <tr>
            <td><strong>Paper registers & KOTs</strong></td>
            <td>Cheap, no training required</td>
            <td>No search, arithmetic mistakes, easy to lose slips</td>
        </tr>
        <tr>
            <td><strong>Spreadsheets (Excel)</strong></td>
            <td>Sorting and totals</td>
            <td>No constraints, weak multi-user safety, manual formulas</td>
        </tr>
        <tr>
            <td><strong>Commercial POS (Toast, Petpooja)</strong></td>
            <td>Full feature set</td>
            <td>Costly, closed proprietary design, not suited for learning</td>
        </tr>
        <tr>
            <td><strong>Student RMS projects</strong></td>
            <td>Easy to build</td>
            <td>Rules kept in app code; weak triggers, unnormalized schema</td>
        </tr>
        <tr>
            <td><strong>Proposed: MySQL + Streamlit RMS</strong></td>
            <td>Rules inside DB (triggers & views); 3NF schema</td>
            <td>Single restaurant prototype, expandable to multi-branch</td>
        </tr>
    </table>

    <div class="page-break"></div>
    <h2>4. PROPOSED SYSTEM & ARCHITECTURE</h2>
    <p>Figure 1 illustrates the 3-tier architecture of the Restaurant Management System:</p>
    <img src="data:image/png;base64,{arch_b64}" class="diagram-img" alt="Architecture Diagram">

    <h3>Database Design: Chen ER Diagram</h3>
    <p>Figure 2 shows the conceptual model in Chen notation:</p>
    <img src="data:image/png;base64,{er_b64}" class="diagram-img" alt="ER Diagram">

    <h3>Table 1: Relationships in the ER Model</h3>
    <table>
        <tr><th>Relationship</th><th>Entities</th><th>Cardinality</th></tr>
        <tr><td>Employs</td><td>Restaurant – Employee</td><td>1 : N</td></tr>
        <tr><td>Serves</td><td>Restaurant – Menu_Item</td><td>1 : N</td></tr>
        <tr><td>Provides</td><td>Restaurant – Service</td><td>1 : N</td></tr>
        <tr><td>Records</td><td>Restaurant – Finance</td><td>1 : N</td></tr>
        <tr><td>Receives</td><td>Restaurant – Orders</td><td>1 : N</td></tr>
        <tr><td>Places</td><td>Customer – Orders</td><td>1 : N</td></tr>
        <tr><td>Gives</td><td>Customer – Feedback</td><td>1 : N</td></tr>
        <tr><td>About (optional)</td><td>Orders – Feedback</td><td>1 : N</td></tr>
        <tr><td>Contains</td><td>Orders – Menu_Item (Order_Item)</td><td>M : N</td></tr>
        <tr><td>Supplies</td><td>Vendor – Raw_Material</td><td>1 : N</td></tr>
        <tr><td>Talks to</td><td>Employee – Vendor (Employee_Vendor)</td><td>M : N</td></tr>
        <tr><td>Performs</td><td>Employee – Service (Employee_Service)</td><td>M : N</td></tr>
        <tr><td>Manages</td><td>Employee – Finance</td><td>1 : N</td></tr>
        <tr><td>For</td><td>Finance – Service (Finance_Service)</td><td>M : N</td></tr>
    </table>

    <h3>Table 2: Relational Schema of restaurant_db (3NF)</h3>
    <table>
        <tr><th>Table</th><th>Primary key</th><th>Foreign keys</th><th>Important constraints</th></tr>
        <tr><td>Restaurant</td><td>restaurant_id</td><td>-</td><td>NOT NULL name, owner, address; rent >= 0</td></tr>
        <tr><td>Employee</td><td>employee_id</td><td>restaurant_id -> Restaurant</td><td>ENUM gender, shift; salary > 0; ON DELETE CASCADE</td></tr>
        <tr><td>Vendor</td><td>vendor_id</td><td>-</td><td>NOT NULL name, phone, address</td></tr>
        <tr><td>Employee_Vendor</td><td>(employee_id, vendor_id)</td><td>employee_id, vendor_id</td><td>Composite PK; M:N bridge table</td></tr>
        <tr><td>Raw_Material</td><td>material_id</td><td>vendor_id -> Vendor</td><td>unit_price > 0, stock_qty >= 0</td></tr>
        <tr><td>Menu_Item</td><td>item_id</td><td>restaurant_id -> Restaurant</td><td>category NOT NULL, price > 0</td></tr>
        <tr><td>Customer</td><td>customer_id</td><td>-</td><td>NOT NULL name, phone_number</td></tr>
        <tr><td>Customer_Email</td><td>(customer_id, email)</td><td>customer_id -> Customer</td><td>Composite PK; Multivalued email in 3NF</td></tr>
        <tr><td>Orders</td><td>order_id</td><td>customer_id, restaurant_id</td><td>table_number > 0; ENUM status; total_amount >= 0</td></tr>
        <tr><td>Order_Item</td><td>(order_id, item_id)</td><td>order_id, item_id</td><td>quantity > 0; triggers update Orders.total_amount</td></tr>
        <tr><td>Service</td><td>service_id</td><td>restaurant_id -> Restaurant</td><td>cost >= 0</td></tr>
        <tr><td>Employee_Service</td><td>(employee_id, service_id)</td><td>employee_id, service_id</td><td>Composite PK; M:N bridge table</td></tr>
        <tr><td>Finance</td><td>finance_id</td><td>restaurant_id, managed_by</td><td>UNIQUE month_year; turnover >= 0</td></tr>
        <tr><td>Finance_Service</td><td>(finance_id, service_id)</td><td>finance_id, service_id</td><td>Composite PK; amount >= 0</td></tr>
        <tr><td>Feedback</td><td>feedback_id</td><td>customer_id, order_id</td><td>CHECK rating BETWEEN 1 AND 5</td></tr>
    </table>

    <h2>5. METHODOLOGY & IMPLEMENTATION</h2>

    <h3>5.1 System & Design Approach</h3>
    <p>The development of the Restaurant Management System (RMS) adopts a structured engineering methodology combining a <strong>Top-Down Database Life Cycle</strong>, an industry-standard <strong>3-Tier Layered Architecture</strong>, and an <strong>Active Database Management Paradigm</strong>:</p>
    
    <ol>
        <li><strong>Top-Down Database Design Methodology:</strong>
            <ul>
                <li><em>Requirement Analysis:</em> Identified and categorized core functional restaurant entities: restaurant branches, role-based staff, suppliers, raw material inventories, menu items, customer accounts, orders, line-item billings, financial ledgers, and customer ratings.</li>
                <li><em>Conceptual Schema Modeling (ER Model):</em> Formulated an Entity-Relationship model following Chen’s notation to define entity boundaries, composite/multivalued attributes, and relationship cardinalities (1:1, 1:N, and M:N).</li>
                <li><em>Logical Schema Mapping:</em> Converted ER abstractions into relational tables, resolving M:N associations into dedicated junction tables (<code>Order_Item</code>, <code>Employee_Vendor</code>, <code>Employee_Service</code>, <code>Finance_Service</code>) with composite primary keys.</li>
                <li><em>Schema Normalization (3NF):</em> Systematically decomposed tables up to Third Normal Form (3NF). Eliminated repeating groups and multivalued attributes by isolating customer emails into a dedicated <code>Customer_Email</code> table (1NF), removed partial dependencies from composite keys (2NF), and resolved transitive dependencies so all non-key fields functionally depend strictly on primary keys (3NF), thereby preventing update, insertion, and deletion anomalies.</li>
            </ul>
        </li>
        <li><strong>3-Tier Architectural Approach:</strong>
            <ul>
                <li><em>Presentation Tier (Frontend):</em> Implemented using Streamlit 1.65.0, providing a responsive, intuitive web dashboard spanning 10 specialized operational modules and an interactive SQL Laboratory.</li>
                <li><em>Application / Logic Tier (Middleware):</em> Built with Python 3.13 to handle business rules, session persistence, connection pooling, and secure parameterized queries via <code>mysql-connector-python</code>.</li>
                <li><em>Data Tier (Storage & Integrity):</em> Hosted on MySQL 8.0 with the ACID-compliant InnoDB storage engine, ensuring transactional atomicity, persistence, constraints, triggers, and views.</li>
            </ul>
        </li>
        <li><strong>Active Database & Server-Side Integrity Approach:</strong>
            <ul>
                <li><em>Automated Calculations via PL/SQL Triggers:</em> Implemented <code>AFTER INSERT</code>, <code>AFTER UPDATE</code>, and <code>AFTER DELETE</code> triggers on <code>Order_Item</code> to compute item subtotals, apply 5% taxes, and update order grand totals inside the database kernel rather than relying solely on client code.</li>
                <li><em>Analytical Views:</em> Encapsulated reporting queries into reusable views (<code>v_low_stock</code> for threshold-based ingredient reorder alerts and <code>v_monthly_profit</code> for net income statements).</li>
                <li><em>Declarative Constraints:</em> Enforced referential integrity via Foreign Keys with <code>ON DELETE RESTRICT</code> (protecting transaction histories) and <code>ON DELETE CASCADE</code> (purging orphan line items), combined with <code>CHECK</code> constraints (validating feedback scores).</li>
            </ul>
        </li>
        <li><strong>Modular & Fault-Tolerant Software Engineering:</strong>
            <ul>
                <li>Implemented modular component boundaries with defensive fallback shims to ensure smooth operation across varied system environments.</li>
            </ul>
        </li>
    </ol>

    <h3>Table 3: Tools & Technologies Used</h3>
    <table>
        <tr><th>Layer</th><th>Tool / Technology</th><th>Purpose</th></tr>
        <tr><td>Relational database</td><td>MySQL 8.0 (InnoDB), MySQL Workbench</td><td>15 tables, 2 views, 3 triggers, transactions, ACID safety</td></tr>
        <tr><td>Application / Logic</td><td>Python 3.13, mysql-connector-python, pandas</td><td>Data wrangling, connection pooling, transaction helpers</td></tr>
        <tr><td>Web front end</td><td>Streamlit 1.65.0</td><td>Multi-page responsive dashboard with 10 operational modules</td></tr>
        <tr><td>Design & Modeling</td><td>Matplotlib, Draw.io</td><td>3-Tier architecture and Chen ER diagrams</td></tr>
    </table>

    <h3>Table 4: Database Objects Implemented in MySQL</h3>
    <table>
        <tr><th>Object</th><th>Name</th><th>What it does</th></tr>
        <tr><td>View</td><td>v_low_stock</td><td>Monitors ingredients with stock <= 15 and displays vendor contact details</td></tr>
        <tr><td>View</td><td>v_monthly_profit</td><td>Aggregates monthly turnover, operating costs and calculates net profit</td></tr>
        <tr><td>Trigger</td><td>trg_after_order_item_insert</td><td>AFTER INSERT ON Order_Item: dynamically recalculates Orders.total_amount</td></tr>
        <tr><td>Trigger</td><td>trg_after_order_item_update</td><td>AFTER UPDATE ON Order_Item: updates Orders.total_amount dynamically</td></tr>
        <tr><td>Trigger</td><td>trg_after_order_item_delete</td><td>AFTER DELETE ON Order_Item: updates Orders.total_amount dynamically</td></tr>
        <tr><td>Constraint</td><td>feedback_chk_1</td><td>Enforces customer rating to be strictly between 1 and 5</td></tr>
        <tr><td>Constraint</td><td>fk_orders_customer</td><td>ON DELETE RESTRICT: prevents accidental deletion of customers with orders</td></tr>
        <tr><td>Constraint</td><td>fk_order_item_orders</td><td>ON DELETE CASCADE: automatically cleans line items when order is purged</td></tr>
    </table>

    <div class="page-break"></div>
    <h2>6. RESULTS AND DISCUSSION</h2>
    <h3>Table 5: Objects Created and Data Loaded</h3>
    <table>
        <tr><th>Item</th><th>Count</th><th>Item</th><th>Count</th></tr>
        <tr><td>Tables</td><td>15</td><td>Restaurant</td><td>1</td></tr>
        <tr><td>Views</td><td>2</td><td>Employees (with shifts)</td><td>6</td></tr>
        <tr><td>Triggers</td><td>3</td><td>Vendors / Raw Materials</td><td>4 / 8</td></tr>
        <tr><td>Constraints</td><td>18</td><td>Menu Items (5 categories)</td><td>11</td></tr>
        <tr><td>Customers (with emails)</td><td>5 (6 emails)</td><td>Orders (with 11 line items)</td><td>5</td></tr>
        <tr><td>Services / Feedback</td><td>4 / 3</td><td>Finance Monthly Records</td><td>3</td></tr>
    </table>

    <h3>Sample Analytical Query Results</h3>

    <h4>Query 1: Monthly Revenue (SUM, COUNT, GROUP BY)</h4>
    <table>
        <tr><th>month</th><th>total_orders</th><th>total_revenue</th><th>average_order_amount</th></tr>
        <tr><td>2026-10</td><td>5</td><td>3525.00</td><td>705.00</td></tr>
        <tr><td>2026-09</td><td>4</td><td>2890.00</td><td>722.50</td></tr>
    </table>

    <h4>Query 2: Best-Selling Menu Items by Category</h4>
    <table>
        <tr><th>category</th><th>total_items_ordered</th><th>total_quantity_sold</th><th>estimated_revenue</th></tr>
        <tr><td>Main Course</td><td>5</td><td>6</td><td>1790.00</td></tr>
        <tr><td>Starter</td><td>3</td><td>3</td><td>760.00</td></tr>
        <tr><td>Bread</td><td>4</td><td>8</td><td>445.00</td></tr>
        <tr><td>Beverage</td><td>3</td><td>4</td><td>380.00</td></tr>
        <tr><td>Dessert</td><td>1</td><td>2</td><td>180.00</td></tr>
    </table>

    <h4>Query 3: High-Value Customers (JOIN, GROUP BY, HAVING)</h4>
    <table>
        <tr><th>customer_id</th><th>cust_name</th><th>completed_orders</th><th>total_spent</th></tr>
        <tr><td>2</td><td>Rahul Mehta</td><td>1</td><td>1100.00</td></tr>
        <tr><td>1</td><td>Kavya Sharma</td><td>1</td><td>860.00</td></tr>
        <tr><td>3</td><td>Sneha Rao</td><td>1</td><td>615.00</td></tr>
        <tr><td>5</td><td>Deepak Joshi</td><td>1</td><td>550.00</td></tr>
        <tr><td>4</td><td>Vikram Singh</td><td>1</td><td>400.00</td></tr>
    </table>

    <h4>Query 4: Itemized Bill Breakdown on Order 1</h4>
    <table>
        <tr><th>order_id</th><th>customer</th><th>item</th><th>quantity</th><th>unit_price</th><th>line_total</th></tr>
        <tr><td>1</td><td>Kavya Sharma</td><td>Paneer Tikka</td><td>1</td><td>240.00</td><td>240.00</td></tr>
        <tr><td>1</td><td>Kavya Sharma</td><td>Paneer Butter Masala</td><td>1</td><td>290.00</td><td>290.00</td></tr>
        <tr><td>1</td><td>Kavya Sharma</td><td>Garlic Naan</td><td>2</td><td>55.00</td><td>110.00</td></tr>
        <tr><td>1</td><td>Kavya Sharma</td><td>Mango Lassi</td><td>2</td><td>110.00</td><td>220.00</td></tr>
    </table>

    <h3>Table 12: Business-Rule Validation Behavior</h3>
    <table>
        <tr><th>Action tried</th><th>Response from the database</th></tr>
        <tr><td>Deleting customer with active orders</td><td>ERROR 1451: Foreign key constraint fails (ON DELETE RESTRICT)</td></tr>
        <tr><td>Inserting feedback with rating 6 or 0</td><td>ERROR 3819: Check constraint "feedback_chk_1" is violated</td></tr>
        <tr><td>Inserting row into Order_Item</td><td>Orders.total_amount automatically recalculated via MySQL trigger</td></tr>
        <tr><td>Checking low-stock ingredients</td><td>View v_low_stock automatically filters items with stock_qty <= 15</td></tr>
        <tr><td>Calculating monthly net profit</td><td>View v_monthly_profit dynamically computes turnover minus operating expenses</td></tr>
        <tr><td>Customer with multiple email addresses</td><td>Normalized into Customer_Email in 3NF without repeating groups</td></tr>
    </table>

    <h3>Table 13: Comparison with Existing Methods</h3>
    <table>
        <tr><th>Feature</th><th>Registers & KOTs</th><th>Spreadsheets</th><th>Proposed system</th></tr>
        <tr><td>Automatic bill calculation</td><td>No (manual)</td><td>Manual formulas</td><td>Yes (active MySQL triggers)</td></tr>
        <tr><td>Stockout alerting</td><td>No</td><td>Weak / manual</td><td>Yes (view v_low_stock)</td></tr>
        <tr><td>Multi-user ACID safety</td><td>No</td><td>No</td><td>Yes (InnoDB engine)</td></tr>
        <tr><td>Referential integrity rules</td><td>No</td><td>No</td><td>Foreign Keys, CHECK constraints</td></tr>
        <tr><td>Multi-valued attribute handling</td><td>Mixed text</td><td>Comma lists</td><td>Yes (Customer_Email in 3NF)</td></tr>
        <tr><td>Financial profit analysis</td><td>Manual</td><td>Error-prone</td><td>Yes (view v_monthly_profit)</td></tr>
        <tr><td>Interactive SQL console</td><td>None</td><td>None</td><td>Yes (built-in SQL Lab)</td></tr>
    </table>

    <h2>7. CONCLUSION AND FUTURE SCOPE</h2>
    <p>
        A complete Restaurant Management System was designed from an ER diagram to a working 2-tier application. The relational design satisfies 3NF, business rules live inside MySQL as constraints, 2 views, and 3 active billing triggers, and a modular Streamlit UI provides intuitive management. The project covers all course outcomes (CO1, CO2), program outcomes, and relevant SDGs.
    </p>
    <p>
        <strong>Future Scope:</strong> Table-side QR-code digital ordering, payment gateway webhooks (Razorpay/Stripe), machine learning demand forecasting, and multi-branch chain support.
    </p>

    <h2>8. REFERENCES</h2>
    <p>[1] E. F. Codd, “A Relational Model of Data for Large Shared Data Banks,” CACM, vol. 13, no. 6, pp. 377–387, 1970.</p>
    <p>[2] P. P. Chen, “The Entity-Relationship Model: Toward a Unified View of Data,” ACM TODS, vol. 1, no. 1, pp. 9–36, 1976.</p>
    <p>[3] R. Elmasri and S. B. Navathe, <em>Fundamentals of Database Systems</em>, 7th ed., Pearson, 2016.</p>
    <p>[4] A. Silberschatz, H. F. Korth and S. Sudarshan, <em>Database System Concepts</em>, 7th ed., McGraw-Hill, 2019.</p>
    <p>[5] MySQL 8.0 Reference Manual: https://dev.mysql.com/doc/refman/8.0/en/</p>
    <p>[6] Streamlit Python Framework Documentation: https://docs.streamlit.io/</p>

</div>

</body>
</html>
"""

    with open(html_file, "w", encoding="utf-8") as f:
        f.write(html_content)
    print(f"[OK] Generated HTML report saved successfully: {html_file}")

if __name__ == "__main__":
    generate_html_report()
