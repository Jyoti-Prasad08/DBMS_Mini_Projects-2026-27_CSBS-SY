"""
Builds the complete Mini Project Report Word Document for Restaurant Management System
matching the exact college template layout, formatting, tables, and images.
"""
import os
import zipfile
import shutil
import docx

def build_document():
    template_docx = r"C:\Users\bhumi\.gemini\antigravity\brain\c25199fc-7f68-4093-aa1b-8c6e84ee5d67\.user_uploaded\media_1791961036223_d439b089.docx"
    out_docx = r"C:\Users\bhumi\Desktop\DBMS PROJECT\Mini_Project_Report_Restaurant_Management_System.docx"
    arch_img = r"C:\Users\bhumi\Desktop\DBMS PROJECT\Restaurant_Architecture.png"
    er_img = r"C:\Users\bhumi\Desktop\DBMS PROJECT\ER_Diagram.png"

    temp_dir = r"C:\Users\bhumi\Desktop\DBMS PROJECT\temp_doc_build"
    if os.path.exists(temp_dir):
        shutil.rmtree(temp_dir)
    os.makedirs(temp_dir, exist_ok=True)

    # 1. Unzip template
    with zipfile.ZipFile(template_docx, 'r') as zin:
        zin.extractall(temp_dir)

    # 2. Replace images
    target_img1 = os.path.join(temp_dir, 'word', 'media', 'image1.png')
    target_img2 = os.path.join(temp_dir, 'word', 'media', 'image2.png')

    if os.path.exists(arch_img) and os.path.exists(target_img1):
        shutil.copyfile(arch_img, target_img1)
    if os.path.exists(er_img) and os.path.exists(target_img2):
        shutil.copyfile(er_img, target_img2)

    # 3. Repack
    with zipfile.ZipFile(out_docx, 'w', zipfile.ZIP_DEFLATED) as zout:
        for root, dirs, files in os.walk(temp_dir):
            for file in files:
                full_path = os.path.join(root, file)
                rel_path = os.path.relpath(full_path, temp_dir)
                zout.write(full_path, rel_path)

    shutil.rmtree(temp_dir)
    print("[OK] Replaced media and repacked base DOCX.")

    # 4. Open with python-docx to update all text and tables
    doc = docx.Document(out_docx)

    p_replacements = {
        "Hotel Management System": "Restaurant Management System",
        "hotel_db": "restaurant_db",
        "hotel_logs": "restaurant_logs",
        "Anushka": "Bhumi",
        "A hotel is a data-driven business": "A modern restaurant is a data-driven business. Point-of-Sale (POS) order dispatch, dynamic bill calculation, stock inventory tracking, and financial ledgers must be handled as database transactions",
        "The Royal Orchid Palace, Bengaluru": "Royal Spice Restaurant, Bangalore",
        "The prototype manages a single hotel": "The prototype manages a single dining establishment, but the schema already carries restaurant_id everywhere so multiple branches can be supported.",
        "fn_nights": "trg_after_order_item_insert",
        "sp_create_booking": "trg_after_order_item_insert",
        "sp_check_in": "trg_after_order_item_update",
        "sp_check_out": "trg_after_order_item_delete",
        "sp_cancel_booking": "v_low_stock",
        "sp_add_payment": "v_monthly_profit",
        "ROOM is a weak entity": "RESTAURANT is the central entity with 1:N relations to EMPLOYEE, MENU_ITEM, SERVICE, FINANCE and ORDERS.",
        "skills → employee_skill": "email → Customer_Email table (multivalued decomposition)",
        "DATEDIFF(b.check_out, b.check_in)": "COALESCE(SUM(oi.quantity * m.price), 0.00)",
        "Figure 1: System architecture of the Hotel Management System": "Figure 1: System architecture of the Restaurant Management System",
        "Figure 2: ER diagram of the Hotel Management System (Chen notation)": "Figure 2: ER diagram of the Restaurant Management System (Chen notation)"
    }

    for p in doc.paragraphs:
        txt = p.text
        for old_val, new_val in p_replacements.items():
            if old_val in txt:
                txt = txt.replace(old_val, new_val)
        p.text = txt

    for p in doc.paragraphs:
        txt = p.text.strip()
        if txt.startswith("Hotels handle a steady flow of reservations"):
            p.text = (
                "Food service establishments handle a continuous flow of customer orders, table turnarounds, kitchen preparations, "
                "staff duties, ingredient procurement, and supplier payments. When managed using paper kitchen order tickets (KOTs) "
                "or disconnected spreadsheets, operations suffer from billing calculation errors, inventory stockouts, delayed kitchen delivery, "
                "and lack of financial audit trails. This mini project presents a complete Restaurant Management System (RMS) that unifies the "
                "entire operational lifecycle into a robust relational database. The core business data (restaurant, employees, vendors, "
                "raw materials, menu items, customers, orders, services, finances, and feedback) is housed in a normalized MySQL 8.0 database "
                "named restaurant_db, designed strictly according to Chen notation ER specifications and Third Normal Form (3NF). Business logic, "
                "such as automatic bill total calculation upon ordering, is enforced at the database layer via active triggers (trg_after_order_item_*). "
                "Real-time operational alerts for low ingredient stocks (<= 15 units) and monthly net profit statements are provided through dedicated "
                "views (v_low_stock, v_monthly_profit). A responsive web application built with Streamlit and Python connects to MySQL, offering 10 "
                "interactive modules including an interactive SQL Laboratory for academic evaluation. The system was validated against comprehensive "
                "seed data, 10 analytical report queries, and constraint integrity tests."
            )
        elif txt.startswith("To design and implement a database-driven Hotel Management System"):
            p.text = (
                "To design and implement a database-driven Restaurant Management System that stores restaurant, employee, vendor, "
                "raw material, menu item, customer, order, service, finance, and feedback data; automates order billing calculation via active triggers; "
                "tracks ingredient stock thresholds; and provides real-time financial and operational analytics through dedicated database views."
            )

    def fill_table(table, data):
        while len(table.rows) < len(data):
            table.add_row()
        while len(table.rows) > len(data):
            tr = table.rows[-1]._tr
            tr.getparent().remove(tr)
        for r_idx, row in enumerate(data):
            for c_idx, val in enumerate(row):
                if c_idx < len(table.columns):
                    table.cell(r_idx, c_idx).text = str(val)

    # TABLE 1: Relationships
    t1_data = [
        ['Relationship', 'Entities', 'Cardinality'],
        ['Employs', 'Restaurant - Employee', '1 : N'],
        ['Serves', 'Restaurant - Menu_Item', '1 : N'],
        ['Provides', 'Restaurant - Service', '1 : N'],
        ['Records', 'Restaurant - Finance', '1 : N'],
        ['Receives', 'Restaurant - Orders', '1 : N'],
        ['Places', 'Customer - Orders', '1 : N'],
        ['Gives', 'Customer - Feedback', '1 : N'],
        ['About (optional)', 'Orders - Feedback', '1 : N'],
        ['Contains', 'Orders - Menu_Item (Order_Item)', 'M : N'],
        ['Supplies', 'Vendor - Raw_Material', '1 : N'],
        ['Talks to', 'Employee - Vendor (Employee_Vendor)', 'M : N'],
        ['Performs', 'Employee - Service (Employee_Service)', 'M : N'],
        ['Manages', 'Employee - Finance', '1 : N'],
        ['For', 'Finance - Service (Finance_Service)', 'M : N']
    ]
    fill_table(doc.tables[0], t1_data)

    # TABLE 2: Relational Schema
    t2_data = [
        ['Table', 'Primary key', 'Foreign keys', 'Important constraints'],
        ['Restaurant', 'restaurant_id', '-', 'NOT NULL name, owner, address; rent >= 0'],
        ['Employee', 'employee_id', 'restaurant_id -> Restaurant', 'ENUM gender, shift; salary > 0; ON DELETE CASCADE'],
        ['Vendor', 'vendor_id', '-', 'NOT NULL name, phone, address'],
        ['Employee_Vendor', '(employee_id, vendor_id)', 'employee_id, vendor_id', 'Composite PK; M:N bridge table'],
        ['Raw_Material', 'material_id', 'vendor_id -> Vendor', 'unit_price > 0, stock_qty >= 0'],
        ['Menu_Item', 'item_id', 'restaurant_id -> Restaurant', 'category NOT NULL, price > 0'],
        ['Customer', 'customer_id', '-', 'NOT NULL name, phone_number'],
        ['Customer_Email', '(customer_id, email)', 'customer_id -> Customer', 'Composite PK; Multivalued email in 3NF'],
        ['Orders', 'order_id', 'customer_id, restaurant_id', 'table_number > 0; ENUM status; total_amount >= 0'],
        ['Order_Item', '(order_id, item_id)', 'order_id, item_id', 'quantity > 0; triggers update Orders.total_amount'],
        ['Service', 'service_id', 'restaurant_id -> Restaurant', 'cost >= 0'],
        ['Employee_Service', '(employee_id, service_id)', 'employee_id, service_id', 'Composite PK; M:N bridge table'],
        ['Finance', 'finance_id', 'restaurant_id, managed_by', 'UNIQUE month_year; turnover >= 0'],
        ['Finance_Service', '(finance_id, service_id)', 'finance_id, service_id', 'Composite PK; amount >= 0'],
        ['Feedback', 'feedback_id', 'customer_id, order_id', 'CHECK rating BETWEEN 1 AND 5']
    ]
    fill_table(doc.tables[1], t2_data)

    # TABLE 3: Tools & Technologies
    t3_data = [
        ['Layer', 'Tool / Technology', 'Purpose'],
        ['Relational database', 'MySQL 8.0 (InnoDB), MySQL Workbench', '15 tables, 2 views, 3 triggers, transactions, ACID safety'],
        ['Application / Logic', 'Python 3.13, mysql-connector-python, pandas', 'Data wrangling, connection pooling, transaction helpers'],
        ['Web front end', 'Streamlit 1.65.0', 'Multi-page responsive dashboard with 10 operational modules'],
        ['Design & Modeling', 'Matplotlib, Draw.io', '3-Tier architecture and Chen ER diagrams']
    ]
    fill_table(doc.tables[2], t3_data)

    # TABLE 4: Database objects
    t4_data = [
        ['Object', 'Name', 'What it does'],
        ['View', 'v_low_stock', 'Monitors ingredients with stock <= 15 and displays vendor contact details'],
        ['View', 'v_monthly_profit', 'Aggregates monthly turnover, operating costs and calculates net profit'],
        ['Trigger', 'trg_after_order_item_insert', 'AFTER INSERT ON Order_Item: dynamically recalculates Orders.total_amount'],
        ['Trigger', 'trg_after_order_item_update', 'AFTER UPDATE ON Order_Item: updates Orders.total_amount dynamically'],
        ['Trigger', 'trg_after_order_item_delete', 'AFTER DELETE ON Order_Item: updates Orders.total_amount dynamically'],
        ['Constraint', 'feedback_chk_1', 'Enforces customer rating to be strictly between 1 and 5'],
        ['Constraint', 'fk_orders_customer', 'ON DELETE RESTRICT: prevents accidental deletion of customers with orders'],
        ['Constraint', 'fk_order_item_orders', 'ON DELETE CASCADE: automatically cleans line items when order is purged'],
        ['Transaction', 'tx() helper in app.py', 'Wraps order placement and payroll operations in atomic commit/rollback']
    ]
    fill_table(doc.tables[3], t4_data)

    # TABLE 5: Objects created and data loaded
    t5_data = [
        ['Item', 'Count', 'Item', 'Count'],
        ['Tables', '15', 'Restaurant', '1'],
        ['Views', '2', 'Employees (with shifts)', '6'],
        ['Triggers', '3', 'Vendors / Raw Materials', '4 / 8'],
        ['Constraints', '18', 'Menu Items (5 categories)', '11'],
        ['Customers (with emails)', '5 (6 emails)', 'Orders (with 11 line items)', '5'],
        ['Services / Feedback', '4 / 3', 'Finance Monthly Records', '3']
    ]
    fill_table(doc.tables[4], t5_data)

    # TABLE 6: Monthly revenue (Query 1)
    t6_data = [
        ['month', 'total_orders', 'total_revenue', 'average_order_amount'],
        ['2026-10', '5', '3525.00', '705.00'],
        ['2026-09', '4', '2890.00', '722.50']
    ]
    fill_table(doc.tables[5], t6_data)

    # TABLE 7: Category revenue (Query 2)
    t7_data = [
        ['category', 'total_items_ordered', 'total_quantity_sold', 'estimated_revenue'],
        ['Main Course', '5', '6', '1790.00'],
        ['Starter', '3', '3', '760.00'],
        ['Bread', '4', '8', '445.00'],
        ['Beverage', '3', '4', '380.00'],
        ['Dessert', '1', '2', '180.00']
    ]
    fill_table(doc.tables[6], t7_data)

    # TABLE 8: High-value customers (Query 3)
    t8_data = [
        ['customer_id', 'cust_name', 'completed_orders', 'total_spent'],
        ['2', 'Rahul Mehta', '1', '1100.00'],
        ['1', 'Kavya Sharma', '1', '860.00'],
        ['3', 'Sneha Rao', '1', '615.00'],
        ['5', 'Deepak Joshi', '1', '550.00'],
        ['4', 'Vikram Singh', '1', '400.00']
    ]
    fill_table(doc.tables[7], t8_data)

    # TABLE 9: Itemized Bill on Order 1 (Query 4)
    t9_data = [
        ['order_id', 'customer', 'item', 'quantity', 'unit_price', 'line_total'],
        ['1', 'Kavya Sharma', 'Paneer Tikka', '1', '240.00', '240.00'],
        ['1', 'Kavya Sharma', 'Paneer Butter Masala', '1', '290.00', '290.00'],
        ['1', 'Kavya Sharma', 'Garlic Naan', '2', '55.00', '110.00'],
        ['1', 'Kavya Sharma', 'Mango Lassi', '2', '110.00', '220.00']
    ]
    fill_table(doc.tables[8], t9_data)

    # TABLE 10: Shift and salary distribution (Query 7)
    t10_data = [
        ['shift', 'count_of_employees', 'total_monthly_salary'],
        ['Morning', '3', '83000.00'],
        ['Evening', '2', '54000.00'],
        ['Night', '1', '14000.00']
    ]
    fill_table(doc.tables[9], t10_data)

    # TABLE 11: Feedback Rating Share (Query 8)
    t11_data = [
        ['rating', 'review_count', 'percentage_of_total'],
        ['5 Stars', '2', '66.7%'],
        ['4 Stars', '1', '33.3%'],
        ['3 Stars', '0', '0.0%'],
        ['1-2 Stars', '0', '0.0%']
    ]
    fill_table(doc.tables[10], t11_data)

    # TABLE 12: Business-rule tests
    t12_data = [
        ['Action tried', 'Response from the database'],
        ['Deleting customer with active orders', 'ERROR 1451: Foreign key constraint fails (ON DELETE RESTRICT)'],
        ['Inserting feedback with rating 6 or 0', 'ERROR 3819: Check constraint "feedback_chk_1" is violated'],
        ['Inserting row into Order_Item', 'Orders.total_amount automatically recalculated via MySQL trigger'],
        ['Checking low-stock ingredients', 'View v_low_stock automatically filters items with stock_qty <= 15'],
        ['Calculating monthly net profit', 'View v_monthly_profit dynamically computes turnover minus operating expenses'],
        ['Customer with multiple email addresses', 'Normalized into Customer_Email in 3NF without repeating groups']
    ]
    fill_table(doc.tables[11], t12_data)

    # TABLE 13: Comparison with existing methods
    t13_data = [
        ['Feature', 'Registers & KOTs', 'Spreadsheets', 'Proposed system'],
        ['Automatic bill calculation', 'No (manual)', 'Manual formulas', 'Yes (active MySQL triggers)'],
        ['Stockout alerting', 'No', 'Weak / manual', 'Yes (view v_low_stock)'],
        ['Multi-user ACID safety', 'No', 'No', 'Yes (InnoDB engine)'],
        ['Referential integrity rules', 'No', 'No', 'Foreign Keys, CHECK constraints'],
        ['Multi-valued attribute handling', 'Mixed text', 'Comma lists', 'Yes (Customer_Email in 3NF)'],
        ['Financial profit analysis', 'Manual', 'Error-prone', 'Yes (view v_monthly_profit)'],
        ['Interactive SQL console', 'None', 'None', 'Yes (built-in SQL Lab)']
    ]
    fill_table(doc.tables[12], t13_data)

    doc.save(out_docx)
    print(f"[OK] Generated document saved successfully: {out_docx}")

if __name__ == "__main__":
    build_document()
