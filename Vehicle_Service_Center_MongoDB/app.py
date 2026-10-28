import io
import sys
from contextlib import redirect_stdout
from datetime import date

import pandas as pd
import streamlit as st

# Import the core MongoDB backend
try:
    import service_center_mongo as sc
except ImportError:
    import service_center as sc

st.set_page_config(page_title="Vehicle Service Center (MongoDB)", page_icon="🔧", layout="wide")


@st.cache_resource
def get_db():
    try:
        return sc.connect()
    except Exception as e:
        st.error(f"⚠️ Could not connect to MongoDB: {e}")
        st.info("Please make sure MongoDB is running locally (`brew services start mongodb-community` or `mongod`).")
        st.stop()


db = get_db()


def run_action(action, ok_msg):
    """Executes a DB operation and captures validation errors."""
    try:
        res = action()
        st.success(ok_msg)
        return res
    except Exception as e:
        err = str(e)
        if "Document failed validation" in err:
            err = "Rejected by MongoDB Schema Validator ($jsonSchema)"
        elif "duplicate key error" in err:
            err = "Rejected by Unique Index constraint"
        st.error(f"Database rejected this: {err}")
        return None


st.title("🔧 Vehicle Service Center (MongoDB Edition)")
page = st.sidebar.radio("Navigation", [
    "Dashboard", "Customers", "Vehicles & Bays", "Services", "Bills",
    "DBMS concepts demo", "MongoDB Query Console"
])

# ------------------------------------------------------------------ Dashboard
if page == "Dashboard":
    c1, c2, c3, c4 = st.columns(4)
    total_custs = db.customers.count_documents({})
    booked_svcs = db.services.count_documents({"status": "Booked"})
    free_bays = db.bays.count_documents({"occupied": 0})
    rev_agg = list(db.bills.aggregate([{"$group": {"_id": None, "total": {"$sum": "$amount"}}}]))
    rev = rev_agg[0]["total"] if rev_agg else 0.0

    c1.metric("Customers", total_custs)
    c2.metric("Services Booked", booked_svcs)
    c3.metric("Free Bays", free_bays)
    c4.metric("Revenue (₹)", f"₹{rev:,.2f}")

    st.markdown("---")
    left, right = st.columns([1, 1])

    with left:
        st.subheader("🏢 Bay Occupancy Status")
        bays_data = list(db.v_bay_status.find())
        if bays_data:
            st.dataframe(pd.DataFrame(bays_data), hide_index=True, use_container_width=True)
        else:
            st.info("No bay data found.")

    with right:
        st.subheader("💰 Revenue per Customer")
        spend_pipeline = [
            {"$group": {"_id": "$cust_id", "spent": {"$sum": "$amount"}}},
            {"$lookup": {"from": "customers", "localField": "_id", "foreignField": "cust_id", "as": "c"}},
            {"$project": {"_id": 0, "customer": {"$first": "$c.first_name"}, "spent": 1}}
        ]
        spend_docs = list(db.bills.aggregate(spend_pipeline))
        if spend_docs:
            df_spend = pd.DataFrame(spend_docs)
            st.bar_chart(df_spend, x="customer", y="spent")
        else:
            st.info("No billing data available.")

# ------------------------------------------------------------------ Customers
elif page == "Customers":
    st.subheader("👥 Registered Customers")
    cust_pipeline = [
        {
            "$project": {
                "_id": 0,
                "cust_id": 1,
                "first_name": 1,
                "last_name": 1,
                "dob": 1,
                "phones": {
                    "$reduce": {
                        "input": "$phones",
                        "initialValue": "",
                        "in": {
                            "$cond": [
                                {"$eq": ["$$value", ""]},
                                "$$this",
                                {"$concat": ["$$value", ", ", "$$this"]}
                            ]
                        }
                    }
                },
                "total_vehicles": {"$size": {"$ifNull": ["$vehicles", []]}}
            }
        },
        {"$sort": {"cust_id": 1}}
    ]
    cust_list = list(db.customers.aggregate(cust_pipeline))
    if cust_list:
        st.dataframe(pd.DataFrame(cust_list), hide_index=True, use_container_width=True)

    st.markdown("---")
    st.subheader("➕ Add New Customer")
    with st.form("add_customer", clear_on_submit=True):
        col1, col2 = st.columns(2)
        fn = col1.text_input("First Name")
        ln = col2.text_input("Last Name")
        dob = col1.date_input("Date of Birth", value=date(2000, 1, 1), min_value=date(1940, 1, 1))
        phones = col2.text_input("Phone Numbers (comma separated, 10 digits each)")

        submitted = st.form_submit_button("Add Customer")
        if submitted:
            if not fn or not ln:
                st.warning("Please provide both first and last name.")
            else:
                p_list = [p.strip() for p in phones.split(",") if p.strip()]
                run_action(
                    lambda: sc.add_customer(db, fn, ln, str(dob), p_list),
                    "Customer registered successfully!"
                )
    st.caption("ℹ️ Age Rule ($jsonSchema / Trigger): Customers younger than 18 years will be rejected automatically.")

# ------------------------------------------------------------ Vehicles & Bays
elif page == "Vehicles & Bays":
    st.subheader("🚗 Registered Vehicles")
    veh_pipeline = [
        {"$unwind": "$vehicles"},
        {
            "$project": {
                "_id": 0,
                "cust_id": 1,
                "owner": {"$concat": ["$first_name", " ", "$last_name"]},
                "vehicle_id": "$vehicles.vehicle_id",
                "reg_date": "$vehicles.reg_date",
                "bay_id": "$vehicles.bay_id"
            }
        },
        {"$sort": {"cust_id": 1, "vehicle_id": 1}}
    ]
    veh_list = list(db.customers.aggregate(veh_pipeline))
    if veh_list:
        st.dataframe(pd.DataFrame(veh_list), hide_index=True, use_container_width=True)

    st.markdown("---")
    colA, colB = st.columns(2)

    with colA:
        st.subheader("➕ Register Vehicle (Weak Entity)")
        with st.form("add_veh_form", clear_on_submit=True):
            cid = st.number_input("Customer ID", min_value=1, step=1)
            rd = st.date_input("Registration Date", value=date.today())
            if st.form_submit_button("Register Vehicle"):
                run_action(lambda: sc.add_vehicle(db, int(cid), str(rd)), "Vehicle registered successfully!")

    with colB:
        st.subheader("🔧 Assign / Release Bay")
        with st.form("bay_assign_form"):
            cid2 = st.number_input("Customer ID ", min_value=1, step=1)
            vid = st.number_input("Vehicle ID", min_value=1, step=1)
            bay_val = st.number_input("Bay ID (0 = Release Bay)", min_value=0, max_value=5, step=1)
            if st.form_submit_button("Update Bay"):
                target_bay = None if bay_val == 0 else int(bay_val)
                run_action(
                    lambda: sc.assign_bay(db, int(cid2), int(vid), target_bay),
                    "Bay updated successfully!" if target_bay else "Bay released successfully!"
                )

    st.subheader("Current Bay Status")
    bays = list(db.v_bay_status.find())
    st.dataframe(pd.DataFrame(bays), hide_index=True, use_container_width=True)

# ------------------------------------------------------------------- Services
elif page == "Services":
    st.subheader("🛠️ Services Overview (View: v_service_summary)")
    svcs = list(db.v_service_summary.find())
    if svcs:
        st.dataframe(pd.DataFrame(svcs), hide_index=True, use_container_width=True)

    st.markdown("---")
    col1, col2 = st.columns(2)

    with col1:
        st.subheader("📅 Book New Service")
        mechs = list(db.mechanics.find({}, {"_id": 0, "mech_id": 1, "name": 1}))
        mech_map = {m["mech_id"]: m["name"] for m in mechs}

        with st.form("book_form"):
            cid = st.number_input("Customer ID", min_value=1, step=1)
            sd = st.date_input("Service Date", value=date.today())
            charge = st.number_input("Estimated Charge (₹)", min_value=0.0, step=100.0)
            selected_mechs = st.multiselect(
                "Assign Mechanics",
                options=list(mech_map.keys()),
                format_func=lambda mid: f"{mid}: {mech_map[mid]}"
            )
            if st.form_submit_button("Book Service"):
                if not selected_mechs:
                    st.warning("Please assign at least one mechanic.")
                else:
                    run_action(
                        lambda: sc.book_service(db, int(cid), str(sd), float(charge), selected_mechs),
                        "Service booked successfully!"
                    )

    with col2:
        st.subheader("✅ Mark Service Completed")
        st.info("Trigger Rule: Marking a service as 'Completed' will automatically compute 18% GST and generate a Bill record.")
        with st.form("complete_form"):
            sid = st.number_input("Service ID", min_value=1, step=1)
            if st.form_submit_button("Complete Service"):
                run_action(
                    lambda: sc.complete_service(db, int(sid)),
                    f"Service {sid} marked Completed. Bill auto-generated with 18% GST!"
                )

# ---------------------------------------------------------------------- Bills
elif page == "Bills":
    st.subheader("🧾 Generated Invoices & Bills")
    bill_pipeline = [
        {
            "$lookup": {
                "from": "customers",
                "localField": "cust_id",
                "foreignField": "cust_id",
                "as": "c"
            }
        },
        {
            "$project": {
                "_id": 0,
                "bill_id": 1,
                "customer": {"$concat": [{"$first": "$c.first_name"}, " ", {"$first": "$c.last_name"}]},
                "service_id": 1,
                "amount": 1
            }
        },
        {"$sort": {"bill_id": 1}}
    ]
    bills = list(db.bills.aggregate(bill_pipeline))
    if bills:
        st.dataframe(pd.DataFrame(bills), hide_index=True, use_container_width=True)
    else:
        st.info("No bills generated yet.")

# ---------------------------------------------------------------- Concept demo
elif page == "DBMS concepts demo":
    st.subheader("🎓 DBMS Concepts in MongoDB: Execution Demo")
    st.write("Click below to run all 13 Relational-to-NoSQL DBMS concepts live against MongoDB.")

    colA, colB = st.columns([1, 4])
    run_btn = colA.button("🚀 Run Full Demo")
    reset_first = colB.checkbox("Reset to default seed data before running", value=True)

    if run_btn:
        if reset_first:
            sc.seed_database(db)
        buf = io.StringIO()
        with redirect_stdout(buf):
            sc.demo(db)
        st.code(buf.getvalue(), language="text")

# ---------------------------------------------------------------- MongoDB Console
else:
    st.subheader("💻 MongoDB Interactive Query Console")
    st.write("Run queries and aggregations directly on MongoDB collections.")

    col1, col2 = st.columns([1, 2])
    coll_choice = col1.selectbox("Select Collection / View", [
        "v_service_summary", "v_bay_status", "customers", "services", "bills",
        "bays", "mechanics", "departments"
    ])

    query_mode = col2.radio("Query Mode", ["find() with Filter", "aggregate() Pipeline"], horizontal=True)

    default_code = "{}" if query_mode == "find() with Filter" else "[]"
    query_str = st.text_area("JSON Filter / Pipeline", default_code, height=120)

    if st.button("▶ Execute Query"):
        import json
        try:
            parsed = json.loads(query_str)
            if query_mode == "find() with Filter":
                results = list(db[coll_choice].find(parsed, {"_id": 0}))
            else:
                results = list(db[coll_choice].aggregate(parsed))
            st.write(f"Results ({len(results)} documents returned):")
            if results:
                st.dataframe(pd.DataFrame(results), hide_index=True, use_container_width=True)
            else:
                st.info("Query returned 0 documents.")
        except Exception as e:
            st.error(f"Query Execution Error: {e}")
