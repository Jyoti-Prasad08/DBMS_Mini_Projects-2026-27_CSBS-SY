"""
Builds the complete Restaurant Management System presentation using the exact template.
"""
import os
import zipfile
import shutil
from pptx import Presentation

def build_presentation():
    template_pptx = r"C:\Users\bhumi\.gemini\antigravity\brain\c25199fc-7f68-4093-aa1b-8c6e84ee5d67\.user_uploaded\media_1791961036224_7b8a388a.pptx"
    out_pptx = r"C:\Users\bhumi\Desktop\DBMS PROJECT\Restaurant_Management_System_Presentation.pptx"
    arch_img = r"C:\Users\bhumi\Desktop\DBMS PROJECT\Restaurant_Architecture.png"
    er_img = r"C:\Users\bhumi\Desktop\DBMS PROJECT\ER_Diagram.png"

    temp_dir = r"C:\Users\bhumi\Desktop\DBMS PROJECT\temp_ppt_build"
    if os.path.exists(temp_dir):
        shutil.rmtree(temp_dir)
    os.makedirs(temp_dir, exist_ok=True)

    # 1. Unzip template
    with zipfile.ZipFile(template_pptx, 'r') as zin:
        zin.extractall(temp_dir)

    # 2. Replace media files
    target_img3 = os.path.join(temp_dir, 'ppt', 'media', 'image3.png')
    target_img4 = os.path.join(temp_dir, 'ppt', 'media', 'image4.png')

    if os.path.exists(arch_img) and os.path.exists(target_img3):
        shutil.copyfile(arch_img, target_img3)
    if os.path.exists(er_img) and os.path.exists(target_img4):
        shutil.copyfile(er_img, target_img4)

    # 3. Repack
    with zipfile.ZipFile(out_pptx, 'w', zipfile.ZIP_DEFLATED) as zout:
        for root, dirs, files in os.walk(temp_dir):
            for file in files:
                full_path = os.path.join(root, file)
                rel_path = os.path.relpath(full_path, temp_dir)
                zout.write(full_path, rel_path)

    shutil.rmtree(temp_dir)
    print("[OK] Replaced media and repacked base PPTX.")

    prs = Presentation(out_pptx)

    # Slide 1: Title
    s1 = prs.slides[0]
    for shape in s1.shapes:
        if shape.has_text_frame:
            for p in shape.text_frame.paragraphs:
                txt = p.text
                if "Hotel Management System" in txt:
                    p.text = txt.replace("Hotel Management System", "Restaurant Management System")
                elif "Anushka" in txt:
                    p.text = txt.replace("Anushka", "Bhumi")

    # Slide 3: Intro
    s3 = prs.slides[2]
    for shape in s3.shapes:
        if shape.has_text_frame and "Introduction" not in shape.text_frame.text:
            tf = shape.text_frame
            new_text = (
                "Definition: A Restaurant Management System (RMS) is a database application that records orders, "
                "tables, customers, employees, vendors, raw materials, services, feedback and finances, and enforces dining operational rules.\n"
                "Overview: Point-of-Sale (POS) order dispatch, dynamic bill calculation, stock inventory tracking, and financial ledgers "
                "are handled as database transactions, ensuring concurrency and ACID integrity.\n"
                "Domain context: Food & Beverage (F&B) Hospitality & Retail – a fast-paced business where one wrong entry means billing leakage, "
                "kitchen delay, or ingredient stockout.\n"
                "Evolution: Paper KOTs & physical registers  →  standalone spreadsheets  →  proprietary POS terminals  →  "
                "integrated relational database systems with active triggers and analytics.\n"
                "Motivation: Apply Chen ER modelling, 3NF normalization, MySQL schema design, active billing triggers, and analytical views "
                "to a real-world dining problem, enforcing core rules directly inside the database engine."
            )
            lines = [l for l in new_text.split('\n') if l.strip()]
            for idx, line in enumerate(lines):
                if idx < len(tf.paragraphs):
                    tf.paragraphs[idx].text = line
                else:
                    p = tf.add_paragraph()
                    p.text = line

    # Slide 4: Problem & Objectives
    s4 = prs.slides[3]
    for shape in s4.shapes:
        if shape.has_text_frame and ("Manual registers" in shape.text_frame.text or "Objectives" in shape.text_frame.text):
            tf = shape.text_frame
            new_lines = [
                "Problem Definition",
                "Manual paper slips (KOTs) and spreadsheets cause billing errors, delayed table service, untracked ingredient consumption, and lack of financial auditing.",
                "Build a database-driven RMS that centralizes dining data, computes order bills automatically via active database triggers, enforces inventory thresholds, and provides real-time analytics.",
                "Objectives",
                "•  ER model → relational schema in 3NF with primary, foreign, and CHECK constraints",
                "•  MySQL DDL/DML with complete schema and realistic seed data across 15 tables",
                "•  Business logic in DB: 2 views (v_low_stock, v_monthly_profit), 3 billing triggers",
                "•  10 analytical SQL queries (JOIN, GROUP BY, HAVING, subqueries, NOT EXISTS)",
                "•  Streamlit web front end (10 interactive modules) with built-in SQL Lab for viva demo"
            ]
            for idx, line in enumerate(new_lines):
                if idx < len(tf.paragraphs):
                    p = tf.paragraphs[idx]
                    p.text = line
                    if line in ["Problem Definition", "Objectives"]:
                        p.font.bold = True
                else:
                    p = tf.add_paragraph()
                    p.text = line
                    if line in ["Problem Definition", "Objectives"]:
                        p.font.bold = True

    # Slide 5: Literature Survey
    s5 = prs.slides[4]
    for shape in s5.shapes:
        if shape.has_table:
            t = shape.table
            rows_data = [
                ['Approach', 'Strengths', 'Limitations / Gap'],
                ['Paper registers & KOTs', 'Cheap, no training required', 'No search, arithmetic mistakes, easy to lose slips'],
                ['Spreadsheets (Excel)', 'Sorting and totals', 'No constraints, weak multi-user safety, manual formulas'],
                ['Commercial POS (Toast, Petpooja, eZee)', 'Full feature set', 'Costly, closed proprietary design, not suited for learning'],
                ['Student RMS projects', 'Easy to build', 'Rules kept in app code; weak triggers, unnormalized schema'],
                ['Proposed: MySQL 8.0 + Streamlit RMS', 'Rules inside DB (triggers & views); 3NF schema', 'Single restaurant prototype, expandable to multi-branch']
            ]
            for r_idx, r in enumerate(rows_data):
                for c_idx, val in enumerate(r):
                    t.cell(r_idx, c_idx).text = val
        elif shape.has_text_frame and "Theory base" in shape.text_frame.text:
            tf = shape.text_frame
            tf.paragraphs[0].text = "Theory base: Codd's relational model (1970), Chen's ER model (1976), normalization (Elmasri & Navathe; Silberschatz et al.)."
            if len(tf.paragraphs) > 1:
                tf.paragraphs[1].text = "Gap addressed: enforce restaurant business rules and automated billing inside the database itself."

    # Slide 6: Feasibility Study
    s6 = prs.slides[5]
    for shape in s6.shapes:
        if shape.has_text_frame and "Technical Feasibility" in shape.text_frame.text:
            tf = shape.text_frame
            lines = [
                "Technical Feasibility",
                "All tools are free and industry-standard: MySQL 8.0 (InnoDB), Python 3.13, Streamlit, Pandas; runs locally on Windows/Linux with one click (run_app.bat).",
                "Financial / Business",
                "Zero licence cost; eliminates paper KOT costs and cashier arithmetic leakage; schema easily scales to multi-branch restaurants via restaurant_id.",
                "Operational Feasibility",
                "Simple 10-screen web interface for managers, waitstaff, and cashiers; database blocks invalid actions with clear SQL constraint messages, requiring minimal training."
            ]
            for idx, line in enumerate(lines):
                if idx < len(tf.paragraphs):
                    p = tf.paragraphs[idx]
                    p.text = line
                    if line in ["Technical Feasibility", "Financial / Business", "Operational Feasibility"]:
                        p.font.bold = True

    # Slide 7: System Architecture
    s7 = prs.slides[6]
    for shape in s7.shapes:
        if shape.has_text_frame and ("Presentation tier" in shape.text_frame.text or "Application tier" in shape.text_frame.text):
            lines = [
                "Presentation tier: Streamlit Web UI, 10 interactive screens (Dashboard, Orders, Customers, Employees, Menu, Inventory & Vendors, Services, Finance, Feedback, SQL Lab)",
                "Application tier: Python 3.13 Engine (app.py + mysql-connector-python + pandas), transaction helper tx(), dynamic query builder",
                "Data tier: MySQL 8.0 (restaurant_db) = 15 tables in 3NF, 2 analytical views, 3 active billing triggers, ACID transactions"
            ]
            for idx, line in enumerate(lines):
                if idx < len(tf.paragraphs):
                    tf.paragraphs[idx].text = line

    # Slide 8: ER Diagram
    s8 = prs.slides[7]
    for shape in s8.shapes:
        if shape.has_text_frame and "Entities:" in shape.text_frame.text:
            lines = [
                "Entities (10): RESTAURANT, EMPLOYEE, VENDOR, RAW_MATERIAL, MENU_ITEM, CUSTOMER, ORDERS, SERVICE, FINANCE, FEEDBACK",
                "Bridge tables: Order_Item (M:N Contains), Employee_Vendor (M:N Talks to), Employee_Service (M:N Performs), Finance_Service (M:N For)",
                "Multivalued: email → Customer_Email table (customer_id, email)",
                "Derived attribute: total_amount in Orders → calculated automatically by active trigger on Order_Item",
                "Relationships: all 1 : N (employs, supplies, serves, places, receives, provides, records, manages, gives) and M : N bridge tables",
                "Normal form: 3NF; 15 tables with cascade/restrict integrity rules"
            ]
            for idx, line in enumerate(lines):
                if idx < len(shape.text_frame.paragraphs):
                    shape.text_frame.paragraphs[idx].text = line

    # Slide 9: SQL Implementation
    s9 = prs.slides[8]
    for shape in s9.shapes:
        if shape.has_text_frame:
            txt = shape.text_frame.text
            if "Tables" in txt or "Views" in txt:
                lines = [
                    "Tables (15): Restaurant, Employee, Vendor, Employee_Vendor, Raw_Material, Menu_Item, Customer, Customer_Email, Orders, Order_Item, Service, Employee_Service, Finance, Finance_Service, Feedback",
                    "Views (2): v_low_stock (stock <= 15), v_monthly_profit (turnover - operating expenses)",
                    "Triggers (3): trg_after_order_item_insert, trg_after_order_item_update, trg_after_order_item_delete",
                    "Front End: Streamlit 10-screen responsive dashboard + interactive SQL Lab",
                    "Integrity: FOREIGN KEY ON DELETE RESTRICT (Customer), CASCADE (Order_Item), CHECK rating 1-5"
                ]
                for idx, line in enumerate(lines):
                    if idx < len(shape.text_frame.paragraphs):
                        shape.text_frame.paragraphs[idx].text = line
            elif "sp_check_out" in txt or "TRIGGER" in txt or "START TRANSACTION" in txt:
                code_lines = [
                    "-- trg_after_order_item_insert (core automated billing logic)",
                    "CREATE TRIGGER trg_after_order_item_insert",
                    "AFTER INSERT ON Order_Item FOR EACH ROW",
                    "BEGIN",
                    "  UPDATE Orders",
                    "     SET total_amount = (",
                    "       SELECT COALESCE(SUM(oi.quantity * m.price), 0.00)",
                    "         FROM Order_Item oi",
                    "         JOIN Menu_Item m ON m.item_id = oi.item_id",
                    "        WHERE oi.order_id = NEW.order_id",
                    "     )",
                    "   WHERE order_id = NEW.order_id;",
                    "END;"
                ]
                for idx, line in enumerate(code_lines):
                    if idx < len(shape.text_frame.paragraphs):
                        shape.text_frame.paragraphs[idx].text = line
                    else:
                        p = shape.text_frame.add_paragraph()
                        p.text = line

    # Slide 10: SQL Results
    s10 = prs.slides[9]
    tables_found = [shape.table for shape in s10.shapes if shape.has_table]
    if len(tables_found) >= 3:
        t1 = tables_found[0]
        t1_data = [
            ['Menu Item', 'Category', 'Price'],
            ['Butter Chicken', 'Main Course', 'Rs 340'],
            ['Chicken Dum Biryani', 'Main Course', 'Rs 320'],
            ['Paneer Butter Masala', 'Main Course', 'Rs 290'],
            ['Paneer Tikka', 'Starter', 'Rs 240'],
            ['Garlic Naan', 'Bread', 'Rs 55']
        ]
        for r_idx, r in enumerate(t1_data):
            for c_idx, val in enumerate(r):
                t1.cell(r_idx, c_idx).text = val

        t2 = tables_found[1]
        t2_data = [
            ['Month', 'Turnover', 'Profit'],
            ['2026-09', '345,000', '59,100'],
            ['2026-08', '320,000', '29,200']
        ]
        for r_idx, r in enumerate(t2_data):
            for c_idx, val in enumerate(r):
                t2.cell(r_idx, c_idx).text = val

        t3 = tables_found[2]
        t3_data = [
            ['Material', 'Stock', 'Unit', 'Vendor Phone'],
            ['Fresh Milk', '6.00', 'litre', '9876501234'],
            ['Paneer', '8.50', 'kg', '9876501234'],
            ['Chicken', '12.00', 'kg', '9811223344'],
            ['Tomatoes', '25.00', 'kg', '9876543210']
        ]
        for r_idx, r in enumerate(t3_data):
            for c_idx, val in enumerate(r):
                t3.cell(r_idx, c_idx).text = val

    for shape in s10.shapes:
        if shape.has_text_frame:
            txt = shape.text_frame.text
            if "Top customers" in txt or "Best-selling" in txt:
                shape.text_frame.paragraphs[0].text = "Best-selling items & Pricing (Menu_Item JOIN Order_Item)"
            elif "Monthly revenue" in txt or "Monthly Profit" in txt:
                shape.text_frame.paragraphs[0].text = "Monthly Profit Analysis (view v_monthly_profit)"
            elif "Unpaid balances" in txt or "Low stock" in txt:
                shape.text_frame.paragraphs[0].text = "Low Stock Alerts (view v_low_stock with Vendor Contact)"
            elif "Rules enforced" in txt:
                rule_lines = [
                    "Rules enforced by the database",
                    "Delete customer with active orders  ->  ERROR 1451: Foreign key constraint fails (RESTRICT).",
                    "Rating outside 1 to 5               ->  ERROR 3819: Check constraint 'feedback_chk_1' violated.",
                    "Adding item to Order_Item           ->  Trigger dynamically updates Orders.total_amount.",
                    "Results from seed data: 1 restaurant, 6 employees, 4 vendors, 8 raw materials, 11 menu items, 5 customers, 5 orders; 10 SQL demo queries run."
                ]
                for idx, line in enumerate(rule_lines):
                    if idx < len(shape.text_frame.paragraphs):
                        shape.text_frame.paragraphs[idx].text = line

    # Slide 11: Conclusion
    s11 = prs.slides[10]
    for shape in s11.shapes:
        if shape.has_text_frame and "Built:" in shape.text_frame.text:
            lines = [
                "Built: a complete Restaurant Management System – Chen ER diagram → 3NF MySQL schema → Streamlit Web UI.",
                "Rules live in the database: Constraints, 2 views, 3 active billing triggers, and cascade/restrict foreign keys.",
                "3-Tier Design: Streamlit (Presentation) ↔ Python Engine (Logic) ↔ MySQL 8.0 InnoDB (Data).",
                "Outcome: Zero billing discrepancies; live stock alerts; centralized staff, menu, vendor, and financial accounting.",
                "Future scope: Table-side QR-code ordering, online payment gateway (Razorpay/Stripe), machine learning demand forecasting."
            ]
            for idx, line in enumerate(lines):
                if idx < len(shape.text_frame.paragraphs):
                    shape.text_frame.paragraphs[idx].text = line

    # Slide 12: References
    s12 = prs.slides[11]
    for shape in s12.shapes:
        if shape.has_text_frame and "E. F. Codd" in shape.text_frame.text:
            lines = [
                "E. F. Codd, “A Relational Model of Data for Large Shared Data Banks,” CACM, 13(6), 1970.",
                "P. P. Chen, “The Entity-Relationship Model,” ACM TODS, 1(1), 1976.",
                "R. Elmasri & S. B. Navathe, Fundamentals of Database Systems, 7th ed., Pearson, 2016.",
                "A. Silberschatz, H. F. Korth & S. Sudarshan, Database System Concepts, 7th ed., McGraw-Hill, 2019.",
                "MySQL 8.0 Reference Manual – dev.mysql.com/doc/refman/8.0/en/",
                "Streamlit Documentation – docs.streamlit.io",
                "Pandas Library Documentation – pandas.pydata.org"
            ]
            for idx, line in enumerate(lines):
                if idx < len(shape.text_frame.paragraphs):
                    shape.text_frame.paragraphs[idx].text = line

    prs.save(out_pptx)
    print(f"[OK] Generated presentation saved successfully: {out_pptx}")

if __name__ == "__main__":
    build_presentation()
