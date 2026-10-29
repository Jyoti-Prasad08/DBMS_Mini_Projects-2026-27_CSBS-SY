"""
Restaurant Management System - Streamlit + MySQL Prototype
Run: streamlit run app.py
Needs the database created by restaurant_db.sql
"""
import os
import sys
import shutil
import subprocess
from datetime import date
from decimal import Decimal

# -------------------------------------------------------------------
# Application Control / WDAC Safety Shim for Windows
# Prevents ImportError: DLL load failed while importing bit_generator
# -------------------------------------------------------------------
try:
    import numpy as _np
    if not hasattr(_np, 'random'):
        class _DummyGenerator:
            pass
        class _DummyRandom:
            Generator = _DummyGenerator
        try:
            import numpy.random
        except Exception:
            _np.random = _DummyRandom()
except Exception:
    pass

# Optional pandas import with pure-Python fallback if DLL is blocked
HAS_PANDAS = False
try:
    import pandas as pd
    HAS_PANDAS = True
except Exception:
    HAS_PANDAS = False

# Optional dotenv support to load saved credentials
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

import mysql.connector
import streamlit as st
from mysql.connector import Error

st.set_page_config(page_title="Restaurant Management System", page_icon="🍽️", layout="wide")

# -------------------------------------------------------------------
# Lightweight Fallback DataFrame (Active if Pandas DLL is blocked)
# -------------------------------------------------------------------
class SimpleSeries:
    def __init__(self, data):
        self.data = list(data)

    def tolist(self):
        return list(self.data)

    def sum(self):
        return sum(x for x in self.data if x is not None)

    def fillna(self, val):
        return SimpleSeries([val if x is None or (isinstance(x, float) and x != x) else x for x in self.data])

    def map(self, fn):
        return SimpleSeries([fn(x) for x in self.data])

    def any(self):
        return any(self.data)

    def astype(self, typ):
        return SimpleSeries([typ(x) if x is not None else None for x in self.data])

    def __iter__(self):
        return iter(self.data)

    def __len__(self):
        return len(self.data)


class _ILocIndexer:
    def __init__(self, df):
        self.df = df

    def __getitem__(self, key):
        if isinstance(key, tuple):
            row_idx, col_idx = key
            return self.df.rows[row_idx][col_idx]
        row = self.df.rows[key]
        return dict(zip(self.df.columns, row))


class SimpleDataFrame:
    """Lightweight DataFrame drop-in for environments with C-extension DLL policy blocks."""
    def __init__(self, rows, columns):
        self.rows = list(rows)
        self.columns = list(columns)
        self.col_map = {col: i for i, col in enumerate(self.columns)}

    @property
    def empty(self):
        return len(self.rows) == 0

    @property
    def iloc(self):
        return _ILocIndexer(self)

    def __len__(self):
        return len(self.rows)

    def __getitem__(self, col):
        if isinstance(col, list):
            indices = [self.col_map[c] for c in col]
            sub_rows = [[r[i] for i in indices] for r in self.rows]
            return SimpleDataFrame(sub_rows, col)
        if col not in self.col_map:
            raise KeyError(col)
        idx = self.col_map[col]
        return SimpleSeries([r[idx] for r in self.rows])

    def tolist(self):
        return list(self.rows)

    def iterrows(self):
        for idx, row in enumerate(self.rows):
            yield idx, dict(zip(self.columns, row))

    def groupby(self, col):
        idx = self.col_map[col]
        groups = {}
        for row in self.rows:
            key = row[idx]
            if key not in groups:
                groups[key] = []
            groups[key].append(row)
        for key, rows in groups.items():
            yield key, SimpleDataFrame(rows, self.columns)

    def set_index(self, col):
        return self

    def to_dict_records(self):
        return [dict(zip(self.columns, row)) for row in self.rows]


def render_table(data_obj):
    """Safely renders a table whether data is a Pandas DataFrame or SimpleDataFrame."""
    if HAS_PANDAS and isinstance(data_obj, pd.DataFrame):
        st.dataframe(data_obj, hide_index=True)
    elif hasattr(data_obj, "to_dict_records"):
        st.dataframe(data_obj.to_dict_records(), hide_index=True)
    elif isinstance(data_obj, list):
        st.dataframe(data_obj, hide_index=True)
    else:
        st.write(data_obj)


def render_chart(df, x_col, y_cols):
    """Renders charts reliably across both pandas and non-pandas environments."""
    if df.empty:
        st.info("No data available to display chart.")
        return
    try:
        if HAS_PANDAS and isinstance(df, pd.DataFrame):
            st.bar_chart(df.set_index(x_col)[y_cols])
        else:
            records = df.to_dict_records() if hasattr(df, "to_dict_records") else df
            chart_dict = {}
            for r in records:
                key = str(r.get(x_col, ""))
                if isinstance(y_cols, list):
                    chart_dict[key] = {y: float(r.get(y, 0)) for y in y_cols}
                else:
                    chart_dict[key] = float(r.get(y_cols, 0))
            st.bar_chart(chart_dict)
    except Exception:
        render_table(df)


# -------------------------------------------------------------------
# Database Helpers & Persistence
# -------------------------------------------------------------------
def save_env_credentials(host, user, password, db):
    env_file = os.path.join(os.path.dirname(__file__), ".env")
    with open(env_file, "w", encoding="utf-8") as f:
        f.write(f"DB_HOST={host}\n")
        f.write(f"DB_USER={user}\n")
        f.write(f"DB_PASSWORD={password}\n")
        f.write(f"DB_NAME={db}\n")
    os.environ["DB_HOST"] = host
    os.environ["DB_USER"] = user
    os.environ["DB_PASSWORD"] = password
    os.environ["DB_NAME"] = db


def run_init_sql(host, user, password):
    sql_path = os.path.join(os.path.dirname(__file__), "restaurant_db.sql")
    if not os.path.exists(sql_path):
        return False, f"File not found: {sql_path}"

    mysql_bin = shutil.which("mysql") or r"C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe"
    if os.path.exists(mysql_bin):
        cmd = [mysql_bin, f"-h{host}", f"-u{user}"]
        if password:
            cmd.append(f"-p{password}")
        try:
            with open(sql_path, "r", encoding="utf-8") as sf:
                proc = subprocess.run(cmd, stdin=sf, capture_output=True, text=True)
            if proc.returncode == 0:
                save_env_credentials(host, user, password, "restaurant_db")
                return True, "Database initialized and populated successfully!"
            else:
                return False, f"MySQL CLI error: {proc.stderr.strip()}"
        except Exception as e:
            return False, str(e)
    else:
        return False, "mysql.exe CLI not found in PATH or standard installation directory."


# Initialize session state with environment variables or defaults
default_host = os.getenv("DB_HOST", "localhost")
default_user = os.getenv("DB_USER", "root")
default_password = os.getenv("DB_PASSWORD", "")
default_db = os.getenv("DB_NAME", "restaurant_db")

if "db_host" not in st.session_state:
    st.session_state["db_host"] = default_host
if "db_user" not in st.session_state:
    st.session_state["db_user"] = default_user
if "db_password" not in st.session_state:
    st.session_state["db_password"] = default_password
if "db_name" not in st.session_state:
    st.session_state["db_name"] = default_db


def connect(host=None, user=None, password=None, database=None):
    h = host if host is not None else st.session_state.get("db_host", default_host)
    u = user if user is not None else st.session_state.get("db_user", default_user)
    p = password if password is not None else st.session_state.get("db_password", default_password)
    d = database if database is not None else st.session_state.get("db_name", default_db)
    return mysql.connector.connect(host=h, user=u, password=p, database=d)


def test_connection():
    try:
        conn = connect()
        cur = conn.cursor()
        cur.execute("SELECT restaurant_id FROM Restaurant ORDER BY restaurant_id LIMIT 1")
        row = cur.fetchone()
        conn.close()
        return True, int(row[0]) if row else None
    except Exception as e:
        return False, str(e)


# -------------------------------------------------------------------
# Sidebar Navigation & Settings
# -------------------------------------------------------------------
st.sidebar.title("🍽️ Restaurant DBMS")

# Check current connection state
is_connected, conn_info = test_connection()

with st.sidebar.expander("Database connection", expanded=(not is_connected)):
    sb_host = st.text_input("Host", value=st.session_state["db_host"], key="sb_host")
    sb_user = st.text_input("User", value=st.session_state["db_user"], key="sb_user")
    sb_pwd = st.text_input("Password", value=st.session_state["db_password"], type="password", key="sb_pwd")
    sb_db = st.text_input("Database", value=st.session_state["db_name"], key="sb_db")
    
    col_sb1, col_sb2 = st.columns(2)
    if col_sb1.button("Save & Connect"):
        st.session_state["db_host"] = sb_host
        st.session_state["db_user"] = sb_user
        st.session_state["db_password"] = sb_pwd
        st.session_state["db_name"] = sb_db
        save_env_credentials(sb_host, sb_user, sb_pwd, sb_db)
        st.rerun()

    if col_sb2.button("⚡ Init DB"):
        with st.spinner("Initializing database..."):
            ok, msg = run_init_sql(sb_host, sb_user, sb_pwd)
            if ok:
                st.session_state["db_host"] = sb_host
                st.session_state["db_user"] = sb_user
                st.session_state["db_password"] = sb_pwd
                st.session_state["db_name"] = "restaurant_db"
                st.success("Database created!")
                st.rerun()
            else:
                st.error(msg)

PAGES = ["Dashboard", "Orders", "Customers", "Employees", "Menu",
         "Inventory & Vendors", "Services", "Finance", "Feedback", "SQL Lab"]
page = st.sidebar.radio("Go to", PAGES)


def q(sql, params=None):
    """Run a SELECT query and return a DataFrame or SimpleDataFrame."""
    conn = connect()
    try:
        cur = conn.cursor()
        if params:
            cur.execute(sql, params)
        else:
            cur.execute(sql)
        cols = [d[0] for d in cur.description] if cur.description else []
        raw_rows = cur.fetchall() if cur.description else []
    finally:
        conn.close()

    clean_rows = []
    for r in raw_rows:
        row_vals = []
        for v in r:
            if isinstance(v, Decimal):
                row_vals.append(float(v))
            else:
                row_vals.append(v)
        clean_rows.append(tuple(row_vals))

    if HAS_PANDAS:
        df = pd.DataFrame(clean_rows, columns=cols)
        for c in df.columns:
            if df[c].map(lambda v: isinstance(v, Decimal)).any():
                df[c] = df[c].astype(float)
        return df
    else:
        return SimpleDataFrame(clean_rows, cols)


def tx(fn):
    """Run fn(cursor) inside a transaction. Shows DB errors nicely."""
    conn = connect()
    try:
        cur = conn.cursor()
        result = fn(cur)
        conn.commit()
        return result
    except Error as e:
        conn.rollback()
        st.error(f"Database error: {e.msg}")
        return None
    finally:
        conn.close()


def run(sql, params=()):
    def _do(cur):
        cur.execute(sql, params)
        return True
    return tx(_do)


def flash(msg):
    st.session_state["flash"] = msg
    st.rerun()


def show_flash():
    if "flash" in st.session_state:
        st.success(st.session_state.pop("flash"))


def pick(label, df, id_col, name_col, key=None):
    id_list = df[id_col].tolist()
    name_list = df[name_col].tolist()
    names = dict(zip(id_list, name_list))
    return st.selectbox(label, id_list, format_func=lambda i: f"{names[i]} (#{i})", key=key)


# -------------------------------------------------------------------
# Connection & Setup Screen (Shown when database is not yet reached)
# -------------------------------------------------------------------
if not is_connected:
    st.error("⚠️ Cannot reach the database or the tables are missing.")
    
    st.markdown("""
    ### 🔑 Database Setup & Authentication
    Enter your MySQL root password below and click **Connect**. If you haven't created the `restaurant_db` database yet, click **⚡ Initialize Database & Connect** to automatically create all tables, triggers, views, and seed data.
    """)
    
    with st.container():
        c1, c2 = st.columns(2)
        in_host = c1.text_input("MySQL Host", value=st.session_state.get("db_host", "localhost"), key="main_host")
        in_user = c2.text_input("MySQL User", value=st.session_state.get("db_user", "root"), key="main_user")
        in_pwd = c1.text_input("MySQL Password", value=st.session_state.get("db_password", ""), type="password", key="main_pwd",
                              help="Enter your MySQL password here and press Connect below.")
        in_db = c2.text_input("Database Name", value=st.session_state.get("db_name", "restaurant_db"), key="main_db")

        b_col1, b_col2 = st.columns(2)
        if b_col1.button("🔑 Save Password & Connect", use_container_width=True, type="secondary"):
            st.session_state["db_host"] = in_host
            st.session_state["db_user"] = in_user
            st.session_state["db_password"] = in_pwd
            st.session_state["db_name"] = in_db
            save_env_credentials(in_host, in_user, in_pwd, in_db)
            st.rerun()

        if b_col2.button("⚡ 1-Click Initialize Database & Connect", use_container_width=True, type="primary"):
            with st.spinner("Executing restaurant_db.sql into MySQL..."):
                ok, msg = run_init_sql(in_host, in_user, in_pwd)
                if ok:
                    st.session_state["db_host"] = in_host
                    st.session_state["db_user"] = in_user
                    st.session_state["db_password"] = in_pwd
                    st.session_state["db_name"] = "restaurant_db"
                    st.success("🎉 Database 'restaurant_db' successfully created and seeded!")
                    st.rerun()
                else:
                    st.error(f"Setup failed: {msg}")

    st.divider()
    st.caption(f"Error diagnostics: {conn_info}")
    if "using password: NO" in str(conn_info):
        st.info("💡 **Notice:** MySQL reported `(using password: NO)`. Type your password into the **MySQL Password** box above and click **Save Password & Connect** (or click the blue **1-Click Initialize** button).")
    elif "Unknown database" in str(conn_info):
        st.warning("💡 **Notice:** The database `restaurant_db` doesn't exist yet in MySQL. Click the blue **1-Click Initialize Database & Connect** button above to create it!")
    
    st.stop()

RID = conn_info
show_flash()

# ---------------------------------------------------------------
# 1. DASHBOARD
# ---------------------------------------------------------------
if page == "Dashboard":
    rest = q("SELECT name, owner, address FROM Restaurant WHERE restaurant_id=%s", (RID,)).iloc[0]
    st.title(rest["name"])
    st.caption(f"Owner: {rest['owner']}  |  {rest['address']}")

    m = q("""SELECT (SELECT COUNT(*) FROM Orders) AS orders,
                    (SELECT COALESCE(SUM(total_amount),0) FROM Orders) AS revenue,
                    (SELECT COUNT(*) FROM Customer) AS customers,
                    (SELECT ROUND(AVG(rating),2) FROM Feedback) AS rating,
                    (SELECT COUNT(*) FROM v_low_stock) AS low""").iloc[0]
    c1, c2, c3, c4, c5 = st.columns(5)
    c1.metric("Orders", int(m["orders"]))
    c2.metric("Revenue", f"₹{m['revenue']:,.0f}")
    c3.metric("Customers", int(m["customers"]))
    c4.metric("Avg rating", "-" if m["rating"] is None else f"{m['rating']:.2f} / 5")
    c5.metric("Low-stock items", int(m["low"]))

    left, right = st.columns(2)
    with left:
        st.subheader("Best-selling items")
        top = q("""SELECT m.name, SUM(oi.quantity) AS qty_sold
                   FROM Order_Item oi JOIN Menu_Item m ON m.item_id = oi.item_id
                   GROUP BY m.name ORDER BY qty_sold DESC""")
        render_chart(top, "name", "qty_sold")
    with right:
        st.subheader("Revenue by day")
        daily = q("""SELECT DATE(order_time) AS day, SUM(total_amount) AS revenue
                     FROM Orders GROUP BY DATE(order_time) ORDER BY day""")
        render_chart(daily, "day", "revenue")

    st.subheader("Recent orders")
    recent = q("""SELECT o.order_id, c.name AS customer, o.table_number, o.order_time,
                         o.status, o.total_amount
                  FROM Orders o JOIN Customer c ON c.customer_id = o.customer_id
                  ORDER BY o.order_id DESC LIMIT 10""")
    render_table(recent)

# ---------------------------------------------------------------
# 2. ORDERS (POS & Billing)
# ---------------------------------------------------------------
elif page == "Orders":
    st.title("Orders")
    t_new, t_bill, t_status = st.tabs(["New order", "Orders & bills", "Update status"])

    with t_new:
        customers = q("SELECT customer_id, name FROM Customer ORDER BY name")
        menu = q("SELECT item_id, name, category, price FROM Menu_Item ORDER BY category, name")
        if customers.empty or menu.empty:
            st.info("Add at least one customer and one menu item first.")
        else:
            with st.form("new_order"):
                cust = pick("Customer", customers, "customer_id", "name")
                table_no = st.number_input("Table number", 1, 50, 1)
                qty = {}
                for cat, grp in menu.groupby("category"):
                    st.markdown(f"**{cat}**")
                    cols = st.columns(3)
                    for n, (_, r) in enumerate(grp.iterrows()):
                        qty[int(r["item_id"])] = cols[n % 3].number_input(
                            f"{r['name']} - ₹{r['price']:.0f}", 0, 20, 0, key=f"qty_{r['item_id']}")
                submitted = st.form_submit_button("Place order")
            if submitted:
                chosen = {i: n for i, n in qty.items() if n > 0}
                if not chosen:
                    st.warning("Select at least one item.")
                else:
                    def _place(cur):
                        cur.execute("INSERT INTO Orders (customer_id, restaurant_id, table_number) "
                                    "VALUES (%s,%s,%s)", (cust, RID, int(table_no)))
                        oid = cur.lastrowid
                        for item_id, n in chosen.items():
                            cur.execute("INSERT INTO Order_Item (order_id, item_id, quantity) "
                                        "VALUES (%s,%s,%s)", (oid, item_id, n))
                        return oid
                    oid = tx(_place)
                    if oid:
                        total = q("SELECT total_amount FROM Orders WHERE order_id=%s", (oid,)).iloc[0, 0]
                        flash(f"Order #{oid} placed. Total (calculated by trigger): ₹{total:,.2f}")

    with t_bill:
        orders = q("""SELECT o.order_id, c.name AS customer, o.table_number, o.order_time,
                             o.status, o.total_amount
                      FROM Orders o JOIN Customer c ON c.customer_id = o.customer_id
                      ORDER BY o.order_id DESC""")
        render_table(orders)
        if not orders.empty:
            oid = st.selectbox("Show bill for order", orders["order_id"].tolist())
            bill = q("""SELECT m.name AS item, oi.quantity, m.price,
                               oi.quantity * m.price AS line_total
                        FROM Order_Item oi JOIN Menu_Item m ON m.item_id = oi.item_id
                        WHERE oi.order_id = %s""", (oid,))
            render_table(bill)
            st.metric("Bill total", f"₹{bill['line_total'].sum():,.2f}")

    with t_status:
        orders = q("SELECT order_id, status FROM Orders ORDER BY order_id DESC")
        if orders.empty:
            st.info("No orders yet.")
        else:
            with st.form("status"):
                oid = st.selectbox("Order", orders["order_id"].tolist())
                new_status = st.selectbox("New status", ["Placed", "Served", "Paid"])
                if st.form_submit_button("Update"):
                    if run("UPDATE Orders SET status=%s WHERE order_id=%s", (new_status, oid)):
                        flash(f"Order #{oid} is now {new_status}.")

# ---------------------------------------------------------------
# 3. CUSTOMERS
# ---------------------------------------------------------------
elif page == "Customers":
    st.title("Customers")
    t_view, t_add, t_del = st.tabs(["View / search", "Add customer", "Delete"])

    with t_view:
        term = st.text_input("Search by name or phone")
        render_table(q("""SELECT c.customer_id, c.name, c.phone_number,
                                 GROUP_CONCAT(e.email SEPARATOR ', ') AS emails
                          FROM Customer c LEFT JOIN Customer_Email e ON e.customer_id = c.customer_id
                          WHERE c.name LIKE %s OR c.phone_number LIKE %s
                          GROUP BY c.customer_id ORDER BY c.customer_id""",
                       (f"%{term}%", f"%{term}%")))

    with t_add:
        with st.form("add_customer"):
            name = st.text_input("Name")
            phone = st.text_input("Phone number")
            emails = st.text_input("E-mail(s), comma separated")
            if st.form_submit_button("Add"):
                if not name.strip() or not phone.strip():
                    st.warning("Name and phone are required.")
                else:
                    def _add(cur):
                        cur.execute("INSERT INTO Customer (name, phone_number) VALUES (%s,%s)",
                                    (name.strip(), phone.strip()))
                        cid = cur.lastrowid
                        for em in [e.strip() for e in emails.split(",") if e.strip()]:
                            cur.execute("INSERT IGNORE INTO Customer_Email VALUES (%s,%s)", (cid, em))
                        return cid
                    cid = tx(_add)
                    if cid:
                        flash(f"Customer #{cid} added.")

    with t_del:
        st.caption("A customer with existing orders cannot be deleted - protected by ON DELETE RESTRICT foreign key.")
        df = q("SELECT customer_id, name FROM Customer ORDER BY name")
        if not df.empty:
            cid = pick("Customer", df, "customer_id", "name", key="del_cust")
            if st.button("Delete customer"):
                if run("DELETE FROM Customer WHERE customer_id=%s", (cid,)):
                    flash("Customer deleted.")

# ---------------------------------------------------------------
# 4. EMPLOYEES
# ---------------------------------------------------------------
elif page == "Employees":
    st.title("Employees")
    t_view, t_add, t_edit = st.tabs(["View", "Add employee", "Update / delete"])

    with t_view:
        render_table(q("""SELECT employee_id, name, gender, dob, designation, shift, salary, address
                          FROM Employee ORDER BY employee_id"""))
        st.metric("Total monthly payroll", f"₹{q('SELECT COALESCE(SUM(salary),0) FROM Employee').iloc[0, 0]:,.0f}")

    with t_add:
        with st.form("add_emp"):
            c1, c2 = st.columns(2)
            name = c1.text_input("Name")
            gender = c2.selectbox("Gender", ["Male", "Female", "Other"])
            dob = c1.date_input("Date of birth", date(2000, 1, 1), min_value=date(1950, 1, 1), max_value=date.today())
            desig = c2.selectbox("Designation", ["Manager", "Chef", "Waiter", "Cashier", "Accountant", "Cleaner", "Other"])
            shift = c1.selectbox("Shift", ["Morning", "Evening", "Night"])
            salary = c2.number_input("Salary", 1000, 500000, 15000, step=500)
            address = st.text_input("Address")
            if st.form_submit_button("Add"):
                if not name.strip():
                    st.warning("Name is required.")
                elif run("""INSERT INTO Employee (name, gender, dob, designation, shift, salary, address, restaurant_id)
                            VALUES (%s,%s,%s,%s,%s,%s,%s,%s)""",
                         (name.strip(), gender, dob, desig, shift, salary, address, RID)):
                    flash("Employee added.")

    with t_edit:
        df = q("SELECT employee_id, name FROM Employee ORDER BY name")
        if not df.empty:
            eid = pick("Employee", df, "employee_id", "name", key="edit_emp")
            cur_row = q("SELECT salary, shift FROM Employee WHERE employee_id=%s", (eid,)).iloc[0]
            c1, c2 = st.columns(2)
            new_sal = c1.number_input("New salary", 1000.0, 500000.0, float(cur_row["salary"]), step=500.0)
            shifts = ["Morning", "Evening", "Night"]
            new_shift = c2.selectbox("New shift", shifts, index=shifts.index(cur_row["shift"]))
            b1, b2 = st.columns(2)
            if b1.button("Update employee"):
                if run("UPDATE Employee SET salary=%s, shift=%s WHERE employee_id=%s", (new_sal, new_shift, eid)):
                    flash("Employee updated.")
            if b2.button("Delete employee"):
                if run("DELETE FROM Employee WHERE employee_id=%s", (eid,)):
                    flash("Employee deleted.")

# ---------------------------------------------------------------
# 5. MENU
# ---------------------------------------------------------------
elif page == "Menu":
    st.title("Menu")
    t_view, t_add, t_edit = st.tabs(["View", "Add item", "Update price / delete"])

    with t_view:
        render_table(q("SELECT item_id, name, category, price FROM Menu_Item ORDER BY category, name"))

    with t_add:
        with st.form("add_item"):
            name = st.text_input("Item name")
            cat = st.selectbox("Category", ["Starter", "Main Course", "Bread", "Dessert", "Beverage", "Other"])
            price = st.number_input("Price (₹)", 1.0, 5000.0, 100.0, step=5.0)
            if st.form_submit_button("Add"):
                if not name.strip():
                    st.warning("Name is required.")
                elif run("INSERT INTO Menu_Item (name, category, price, restaurant_id) VALUES (%s,%s,%s,%s)",
                         (name.strip(), cat, price, RID)):
                    flash("Menu item added.")

    with t_edit:
        df = q("SELECT item_id, name FROM Menu_Item ORDER BY name")
        if not df.empty:
            iid = pick("Item", df, "item_id", "name", key="edit_item")
            cur_price = float(q("SELECT price FROM Menu_Item WHERE item_id=%s", (iid,)).iloc[0, 0])
            new_price = st.number_input("New price (₹)", 1.0, 5000.0, cur_price, step=5.0)
            b1, b2 = st.columns(2)
            if b1.button("Update price"):
                if run("UPDATE Menu_Item SET price=%s WHERE item_id=%s", (new_price, iid)):
                    flash("Price updated.")
            if b2.button("Delete item"):
                if run("DELETE FROM Menu_Item WHERE item_id=%s", (iid,)):
                    flash("Item deleted.")

# ---------------------------------------------------------------
# 6. INVENTORY & VENDORS
# ---------------------------------------------------------------
elif page == "Inventory & Vendors":
    st.title("Inventory & Vendors")
    t_stock, t_add, t_restock, t_vendor = st.tabs(["Stock", "Add raw material", "Restock", "Vendors"])

    with t_stock:
        low = q("SELECT * FROM v_low_stock")
        if not low.empty:
            st.warning(f"{len(low)} item(s) are running low - contact vendor.")
            render_table(low)
        st.subheader("All raw materials")
        render_table(q("""SELECT m.material_id, m.name, m.unit, m.unit_price, m.stock_qty, v.name AS vendor
                          FROM Raw_Material m JOIN Vendor v ON v.vendor_id = m.vendor_id
                          ORDER BY m.name"""))

    vendors = q("SELECT vendor_id, name FROM Vendor ORDER BY name")

    with t_add:
        if vendors.empty:
            st.info("Add a vendor first.")
        else:
            with st.form("add_mat"):
                name = st.text_input("Material name")
                c1, c2, c3 = st.columns(3)
                unit = c1.selectbox("Unit", ["kg", "litre", "packet", "piece"])
                price = c2.number_input("Unit price (₹)", 0.0, 100000.0, 50.0)
                stock = c3.number_input("Opening stock", 0.0, 100000.0, 10.0)
                vid = pick("Vendor", vendors, "vendor_id", "name")
                if st.form_submit_button("Add"):
                    if not name.strip():
                        st.warning("Name is required.")
                    elif run("""INSERT INTO Raw_Material (name, unit, unit_price, stock_qty, vendor_id)
                                VALUES (%s,%s,%s,%s,%s)""", (name.strip(), unit, price, stock, vid)):
                        flash("Raw material added.")

    with t_restock:
        mats = q("SELECT material_id, name FROM Raw_Material ORDER BY name")
        if not mats.empty:
            with st.form("restock"):
                mid = pick("Material", mats, "material_id", "name")
                add_qty = st.number_input("Quantity received", 0.1, 100000.0, 10.0)
                if st.form_submit_button("Add to stock"):
                    if run("UPDATE Raw_Material SET stock_qty = stock_qty + %s WHERE material_id=%s", (add_qty, mid)):
                        flash("Stock updated.")

    with t_vendor:
        render_table(q("SELECT vendor_id, name, phone, address FROM Vendor ORDER BY name"))
        c1, c2 = st.columns(2)
        with c1:
            st.subheader("Add vendor")
            with st.form("add_vendor"):
                vn = st.text_input("Vendor name")
                vp = st.text_input("Phone")
                va = st.text_input("Address")
                if st.form_submit_button("Add vendor"):
                    if not vn.strip():
                        st.warning("Name is required.")
                    elif run("INSERT INTO Vendor (name, phone, address) VALUES (%s,%s,%s)", (vn.strip(), vp, va)):
                        flash("Vendor added.")
        with c2:
            st.subheader("Who talks to which vendor")
            emps = q("SELECT employee_id, name FROM Employee ORDER BY name")
            if not emps.empty and not vendors.empty:
                with st.form("talks_to"):
                    eid = pick("Employee", emps, "employee_id", "name")
                    vid = pick("Vendor", vendors, "vendor_id", "name", key="talk_vendor")
                    if st.form_submit_button("Link"):
                        if run("INSERT IGNORE INTO Employee_Vendor VALUES (%s,%s)", (eid, vid)):
                            flash("Linked.")
        render_table(q("""SELECT e.name AS employee, v.name AS vendor
                          FROM Employee_Vendor ev
                          JOIN Employee e ON e.employee_id = ev.employee_id
                          JOIN Vendor v ON v.vendor_id = ev.vendor_id
                          ORDER BY e.name"""))

# ---------------------------------------------------------------
# 7. SERVICES
# ---------------------------------------------------------------
elif page == "Services":
    st.title("Services")
    render_table(q("""SELECT s.service_id, s.service_name, s.cost,
                             GROUP_CONCAT(e.name SEPARATOR ', ') AS handled_by
                      FROM Service s
                      LEFT JOIN Employee_Service es ON es.service_id = s.service_id
                      LEFT JOIN Employee e ON e.employee_id = es.employee_id
                      GROUP BY s.service_id ORDER BY s.service_id"""))
    c1, c2 = st.columns(2)
    with c1:
        st.subheader("Add service")
        with st.form("add_service"):
            sn = st.selectbox("Service", ["Kitchen Deep Cleaning", "Chimney & Exhaust Maintenance", "Pest Control & Sanitization", "Food Quality & Safety Audit", "Other"])
            cost = st.number_input("Cost (₹)", 0.0, 1000000.0, 0.0)
            if st.form_submit_button("Add"):
                if run("INSERT INTO Service (service_name, cost, restaurant_id) VALUES (%s,%s,%s)", (sn, cost, RID)):
                    flash("Service added.")
    with c2:
        st.subheader("Assign employee to service")
        services = q("SELECT service_id, service_name FROM Service")
        emps = q("SELECT employee_id, name FROM Employee ORDER BY name")
        if not services.empty and not emps.empty:
            with st.form("assign"):
                sid = pick("Service", services, "service_id", "service_name")
                eid = pick("Employee", emps, "employee_id", "name")
                if st.form_submit_button("Assign"):
                    if run("INSERT IGNORE INTO Employee_Service VALUES (%s,%s)", (eid, sid)):
                        flash("Assigned.")

# ---------------------------------------------------------------
# 8. FINANCE
# ---------------------------------------------------------------
elif page == "Finance":
    st.title("Finance")
    profit = q("SELECT * FROM v_monthly_profit ORDER BY month_year")
    if profit.empty:
        st.info("No finance records yet.")
    else:
        render_table(profit)
        render_chart(profit, "month_year", ["turnover", "total_expense", "profit"])

    st.subheader("Add / update a month")
    month = st.date_input("Month", date.today().replace(day=1)).replace(day=1)
    rent_default = float(q("SELECT rent FROM Restaurant WHERE restaurant_id=%s", (RID,)).iloc[0, 0])
    sal_default = float(q("SELECT COALESCE(SUM(salary),0) FROM Employee").iloc[0, 0])
    turn_default = float(q("""SELECT COALESCE(SUM(total_amount),0) FROM Orders
                              WHERE YEAR(order_time)=%s AND MONTH(order_time)=%s""",
                           (month.year, month.month)).iloc[0, 0])
    st.caption("Defaults are calculated from the database: rent from Restaurant, salaries from Employee, "
               "turnover from that month's orders.")
    emps = q("SELECT employee_id, name FROM Employee ORDER BY name")
    with st.form("finance"):
        c1, c2, c3 = st.columns(3)
        turnover = c1.number_input("Turnover", 0.0, 1e9, turn_default, key=f"t_{month}")
        rent = c2.number_input("Rent", 0.0, 1e9, rent_default, key=f"r_{month}")
        bills = c3.number_input("Bills", 0.0, 1e9, 0.0, key=f"b_{month}")
        sal = c1.number_input("Employee salary", 0.0, 1e9, sal_default, key=f"s_{month}")
        raw = c2.number_input("Raw material cost", 0.0, 1e9, 0.0, key=f"m_{month}")
        mgr = pick("Managed by", emps, "employee_id", "name", key="fin_mgr") if not emps.empty else None
        if st.form_submit_button("Save"):
            if run("""INSERT INTO Finance (restaurant_id, month_year, turnover, rent, bills,
                                           employee_salary, raw_material_cost, managed_by)
                      VALUES (%s,%s,%s,%s,%s,%s,%s,%s)
                      ON DUPLICATE KEY UPDATE turnover=VALUES(turnover), rent=VALUES(rent), bills=VALUES(bills),
                          employee_salary=VALUES(employee_salary), raw_material_cost=VALUES(raw_material_cost),
                          managed_by=VALUES(managed_by)""",
                   (RID, month, turnover, rent, bills, sal, raw, mgr)):
                flash(f"Finance record for {month:%B %Y} saved.")

    st.subheader("Service expenses ('For' relationship)")
    fin = q("SELECT finance_id, month_year FROM Finance ORDER BY month_year DESC")
    services = q("SELECT service_id, service_name FROM Service")
    if not fin.empty and not services.empty:
        with st.form("fin_service"):
            fid = st.selectbox("Finance record", fin["finance_id"].tolist())
            sid = pick("Service", services, "service_id", "service_name", key="fs_service")
            amt = st.number_input("Amount (₹)", 0.0, 1e9, 0.0)
            if st.form_submit_button("Save expense"):
                if run("""INSERT INTO Finance_Service VALUES (%s,%s,%s)
                          ON DUPLICATE KEY UPDATE amount=VALUES(amount)""", (fid, sid, amt)):
                    flash("Service expense saved.")
        render_table(q("""SELECT f.month_year, s.service_name, fs.amount
                          FROM Finance_Service fs
                          JOIN Finance f ON f.finance_id = fs.finance_id
                          JOIN Service s ON s.service_id = fs.service_id
                          ORDER BY f.month_year DESC"""))

# ---------------------------------------------------------------
# 9. FEEDBACK
# ---------------------------------------------------------------
elif page == "Feedback":
    st.title("Customer feedback")
    customers = q("SELECT customer_id, name FROM Customer ORDER BY name")
    if customers.empty:
        st.info("Add customers first.")
    else:
        with st.form("feedback"):
            cid = pick("Customer", customers, "customer_id", "name")
            orders = q("SELECT order_id FROM Orders WHERE customer_id=%s ORDER BY order_id DESC", (cid,))
            oid = st.selectbox("Order (optional)", [None] + orders["order_id"].tolist(),
                               format_func=lambda v: "-" if v is None else f"Order #{v}")
            rating = st.slider("Rating", 1, 5, 5)
            comments = st.text_area("Comments")
            if st.form_submit_button("Submit"):
                if run("INSERT INTO Feedback (customer_id, order_id, rating, comments) VALUES (%s,%s,%s,%s)",
                       (cid, oid, rating, comments)):
                    flash("Thank you for the feedback!")

    avg = q("SELECT ROUND(AVG(rating),2) AS a, COUNT(*) AS n FROM Feedback").iloc[0]
    c1, c2 = st.columns(2)
    c1.metric("Average rating", "-" if avg["a"] is None else f"{avg['a']:.2f} / 5")
    c2.metric("Total feedback", int(avg["n"]))
    dist = q("SELECT rating, COUNT(*) AS count FROM Feedback GROUP BY rating ORDER BY rating")
    render_chart(dist, "rating", "count")
    render_table(q("""SELECT f.feedback_id, c.name AS customer, f.order_id, f.rating, f.comments, f.given_on
                      FROM Feedback f JOIN Customer c ON c.customer_id = f.customer_id
                      ORDER BY f.feedback_id DESC"""))

# ---------------------------------------------------------------
# 10. SQL LAB (For Viva & Evaluation)
# ---------------------------------------------------------------
elif page == "SQL Lab":
    st.title("SQL Lab")
    st.caption("Run the demo queries live, or write your own SELECT.")
    DEMOS = {
        "Bill of order 1 (JOIN)": """SELECT o.order_id, c.name AS customer, m.name AS item, oi.quantity,
       m.price, oi.quantity * m.price AS line_total
FROM Orders o
JOIN Customer c ON c.customer_id = o.customer_id
JOIN Order_Item oi ON oi.order_id = o.order_id
JOIN Menu_Item m ON m.item_id = oi.item_id
WHERE o.order_id = 1""",
        "Best-selling items (GROUP BY)": """SELECT m.name, SUM(oi.quantity) AS qty_sold
FROM Order_Item oi JOIN Menu_Item m ON m.item_id = oi.item_id
GROUP BY m.name ORDER BY qty_sold DESC""",
        "Average rating (aggregate)": "SELECT ROUND(AVG(rating),2) AS avg_rating FROM Feedback",
        "Employees above average salary (subquery)": """SELECT name, designation, salary FROM Employee
WHERE salary > (SELECT AVG(salary) FROM Employee)""",
        "Employee-vendor links (M:N join)": """SELECT e.name AS employee, v.name AS vendor
FROM Employee_Vendor ev
JOIN Employee e ON e.employee_id = ev.employee_id
JOIN Vendor v ON v.vendor_id = ev.vendor_id""",
        "Monthly profit (view)": "SELECT * FROM v_monthly_profit",
        "Low stock (view)": "SELECT * FROM v_low_stock",
        "Customers without feedback (NOT EXISTS)": """SELECT name FROM Customer c
WHERE NOT EXISTS (SELECT 1 FROM Feedback f WHERE f.customer_id = c.customer_id)""",
    }
    choice = st.selectbox("Demo query", ["(write my own)"] + list(DEMOS))
    sql = st.text_area("SQL", DEMOS.get(choice, "SELECT * FROM Customer"), height=180)
    if st.button("Run"):
        if not sql.strip().lower().startswith(("select", "show", "describe")):
            st.error("Only SELECT / SHOW / DESCRIBE statements are allowed here.")
        else:
            try:
                res = q(sql)
                render_table(res)
                st.caption(f"{len(res)} row(s)")
            except Exception as e:
                st.error(f"SQL error: {e}")
