"""
Records and Reports Screen for Smart Parking Management System.
Includes parking history filters, daily revenue reports, and CSV export.
"""

import tkinter as tk
from tkinter import ttk, messagebox, filedialog
import csv
import datetime
import config
import db


class ReportsScreen(ttk.Frame):
    """Reporting, searching, filtering, and CSV export."""

    def __init__(self, parent):
        super().__init__(parent)
        self.create_widgets()
        self.refresh_all()

    def create_widgets(self):
        title_bar = tk.Frame(self, bg=config.THEME_BG)
        title_bar.pack(fill="x", padx=20, pady=(15, 10))

        title_lbl = tk.Label(
            title_bar,
            text="Parking Records, Revenue Analytics & CSV Export",
            font=(config.FONT_FAMILY, 16, "bold"),
            fg=config.THEME_TEXT,
            bg=config.THEME_BG
        )
        title_lbl.pack(side="left")

        # Sub-notebook for Records History vs Revenue Report
        self.sub_notebook = ttk.Notebook(self)
        self.sub_notebook.pack(fill="both", expand=True, padx=20, pady=(0, 15))

        # Tab 1: Parking Records History
        self.tab_records = ttk.Frame(self.sub_notebook)
        self.sub_notebook.add(self.tab_records, text=" 🚗 Parking Records History ")
        self.build_records_tab()

        # Tab 2: Daily Revenue Breakdown
        self.tab_revenue = ttk.Frame(self.sub_notebook)
        self.sub_notebook.add(self.tab_revenue, text=" 💰 Daily Revenue Analytics ")
        self.build_revenue_tab()

    def build_records_tab(self):
        # Filter controls card
        filter_card = tk.Frame(self.tab_records, bg=config.THEME_CARD_BG, bd=1, relief="solid", padx=12, pady=10)
        filter_card.pack(fill="x", padx=10, pady=10)

        # Plate Search
        tk.Label(filter_card, text="Plate #:", font=(config.FONT_FAMILY, 9, "bold"), bg=config.THEME_CARD_BG).pack(side="left", padx=(0, 4))
        self.plate_filter_var = tk.StringVar()
        ttk.Entry(filter_card, textvariable=self.plate_filter_var, width=12).pack(side="left", padx=(0, 12))

        # Status Filter
        tk.Label(filter_card, text="Status:", font=(config.FONT_FAMILY, 9, "bold"), bg=config.THEME_CARD_BG).pack(side="left", padx=(0, 4))
        self.status_filter_var = tk.StringVar(value="All")
        status_cb = ttk.Combobox(filter_card, textvariable=self.status_filter_var, state="readonly", width=10, values=("All", "Active", "Completed"))
        status_cb.pack(side="left", padx=(0, 12))

        # Date Range
        tk.Label(filter_card, text="From (YYYY-MM-DD):", font=(config.FONT_FAMILY, 9, "bold"), bg=config.THEME_CARD_BG).pack(side="left", padx=(0, 4))
        self.date_from_var = tk.StringVar()
        ttk.Entry(filter_card, textvariable=self.date_from_var, width=11).pack(side="left", padx=(0, 12))

        tk.Label(filter_card, text="To:", font=(config.FONT_FAMILY, 9, "bold"), bg=config.THEME_CARD_BG).pack(side="left", padx=(0, 4))
        self.date_to_var = tk.StringVar()
        ttk.Entry(filter_card, textvariable=self.date_to_var, width=11).pack(side="left", padx=(0, 15))

        # Filter Actions
        apply_btn = tk.Button(
            filter_card,
            text="Apply Filters",
            font=(config.FONT_FAMILY, 9, "bold"),
            bg=config.THEME_ACCENT,
            fg="#ffffff",
            bd=0,
            cursor="hand2",
            padx=10,
            pady=4,
            command=self.refresh_records
        )
        apply_btn.pack(side="left", padx=(0, 6))

        reset_btn = tk.Button(
            filter_card,
            text="Reset",
            font=(config.FONT_FAMILY, 9),
            bg="#f1f5f9",
            relief="solid",
            bd=1,
            cursor="hand2",
            padx=10,
            pady=4,
            command=self.reset_records_filter
        )
        reset_btn.pack(side="left")

        # Export CSV Button
        export_btn = tk.Button(
            filter_card,
            text="📥 Export to CSV",
            font=(config.FONT_FAMILY, 9, "bold"),
            bg=config.THEME_SUCCESS,
            fg="#ffffff",
            bd=0,
            cursor="hand2",
            padx=12,
            pady=4,
            command=self.export_records_csv
        )
        export_btn.pack(side="right")

        # Table container
        table_frame = tk.Frame(self.tab_records, bg=config.THEME_BG)
        table_frame.pack(fill="both", expand=True, padx=10, pady=(0, 10))

        cols = ("rec_id", "plate", "type", "owner", "phone", "lot", "slot", "entry", "exit", "status", "mode", "amount")
        self.records_tree = ttk.Treeview(table_frame, columns=cols, show="headings")

        self.records_tree.heading("rec_id", text="Rec #")
        self.records_tree.heading("plate", text="Plate Number")
        self.records_tree.heading("type", text="Type")
        self.records_tree.heading("owner", text="Owner Name")
        self.records_tree.heading("phone", text="Phone")
        self.records_tree.heading("lot", text="Parking Lot")
        self.records_tree.heading("slot", text="Slot")
        self.records_tree.heading("entry", text="Entry Time")
        self.records_tree.heading("exit", text="Exit Time")
        self.records_tree.heading("status", text="Status")
        self.records_tree.heading("mode", text="Payment Mode")
        self.records_tree.heading("amount", text="Fee Paid")

        self.records_tree.column("rec_id", width=50, anchor="center")
        self.records_tree.column("plate", width=105, anchor="center")
        self.records_tree.column("type", width=65, anchor="center")
        self.records_tree.column("owner", width=120, anchor="w")
        self.records_tree.column("phone", width=100, anchor="center")
        self.records_tree.column("lot", width=150, anchor="w")
        self.records_tree.column("slot", width=60, anchor="center")
        self.records_tree.column("entry", width=130, anchor="center")
        self.records_tree.column("exit", width=130, anchor="center")
        self.records_tree.column("status", width=80, anchor="center")
        self.records_tree.column("mode", width=95, anchor="center")
        self.records_tree.column("amount", width=85, anchor="e")

        rec_scroll_y = ttk.Scrollbar(table_frame, orient="vertical", command=self.records_tree.yview)
        rec_scroll_x = ttk.Scrollbar(table_frame, orient="horizontal", command=self.records_tree.xview)
        self.records_tree.configure(yscrollcommand=rec_scroll_y.set, xscrollcommand=rec_scroll_x.set)

        self.records_tree.pack(side="left", fill="both", expand=True)
        rec_scroll_y.pack(side="right", fill="y")
        rec_scroll_x.pack(side="bottom", fill="x")

    def build_revenue_tab(self):
        # Revenue Summary Metrics Card
        summary_card = tk.Frame(self.tab_revenue, bg=config.THEME_CARD_BG, bd=1, relief="solid", padx=15, pady=12)
        summary_card.pack(fill="x", padx=10, pady=10)

        self.rev_kpi_widgets = {}
        items = [
            ("total_rev", "TOTAL ALL-TIME REVENUE", "₹ 0.00", config.THEME_PRIMARY),
            ("cash_rev", "CASH TOTAL", "₹ 0.00", config.THEME_ACCENT),
            ("upi_rev", "UPI TOTAL", "₹ 0.00", config.THEME_SUCCESS),
            ("card_rev", "CARD TOTAL", "₹ 0.00", config.THEME_WARNING),
            ("tx_count", "TOTAL PAYMENTS", "0", config.THEME_MUTED)
        ]

        for k, title, dval, col in items:
            box = tk.Frame(summary_card, bg="#f8fafc", bd=1, relief="solid", padx=10, pady=8)
            box.pack(side="left", expand=True, fill="both", padx=4)

            tk.Label(box, text=title, font=(config.FONT_FAMILY, 8, "bold"), fg=config.THEME_SUBTEXT, bg="#f8fafc").pack(anchor="w")
            lbl = tk.Label(box, text=dval, font=(config.FONT_FAMILY, 13, "bold"), fg=col, bg="#f8fafc")
            lbl.pack(anchor="w", pady=(2, 0))
            self.rev_kpi_widgets[k] = lbl

        # Action bar
        action_bar = tk.Frame(self.tab_revenue, bg=config.THEME_BG)
        action_bar.pack(fill="x", padx=10, pady=(0, 8))

        refresh_rev_btn = tk.Button(
            action_bar,
            text="🔄 Refresh Revenue Data",
            font=(config.FONT_FAMILY, 9),
            bg="#ffffff",
            relief="solid",
            bd=1,
            cursor="hand2",
            padx=10,
            pady=4,
            command=self.refresh_revenue
        )
        refresh_rev_btn.pack(side="left")

        export_rev_btn = tk.Button(
            action_bar,
            text="📥 Export Daily Revenue to CSV",
            font=(config.FONT_FAMILY, 9, "bold"),
            bg=config.THEME_SUCCESS,
            fg="#ffffff",
            bd=0,
            cursor="hand2",
            padx=12,
            pady=4,
            command=self.export_revenue_csv
        )
        export_rev_btn.pack(side="right")

        # Table
        rev_table_frame = tk.Frame(self.tab_revenue, bg=config.THEME_BG)
        rev_table_frame.pack(fill="both", expand=True, padx=10, pady=(0, 10))

        cols = ("date", "tx_count", "cash", "upi", "card", "total")
        self.rev_tree = ttk.Treeview(rev_table_frame, columns=cols, show="headings")

        self.rev_tree.heading("date", text="Date")
        self.rev_tree.heading("tx_count", text="Transactions")
        self.rev_tree.heading("cash", text="Cash Revenue")
        self.rev_tree.heading("upi", text="UPI Revenue")
        self.rev_tree.heading("card", text="Card Revenue")
        self.rev_tree.heading("total", text="Total Daily Revenue")

        self.rev_tree.column("date", width=120, anchor="center")
        self.rev_tree.column("tx_count", width=100, anchor="center")
        self.rev_tree.column("cash", width=120, anchor="e")
        self.rev_tree.column("upi", width=120, anchor="e")
        self.rev_tree.column("card", width=120, anchor="e")
        self.rev_tree.column("total", width=140, anchor="e")

        rev_scroll = ttk.Scrollbar(rev_table_frame, orient="vertical", command=self.rev_tree.yview)
        self.rev_tree.configure(yscrollcommand=rev_scroll.set)

        self.rev_tree.pack(side="left", fill="both", expand=True)
        rev_scroll.pack(side="right", fill="y")

    def refresh_all(self):
        self.refresh_records()
        self.refresh_revenue()

    def reset_records_filter(self):
        self.plate_filter_var.set("")
        self.status_filter_var.set("All")
        self.date_from_var.set("")
        self.date_to_var.set("")
        self.refresh_records()

    def refresh_records(self):
        plate = self.plate_filter_var.get().strip()
        status = self.status_filter_var.get()
        dfrom = self.date_from_var.get().strip()
        dto = self.date_to_var.get().strip()

        try:
            for item in self.records_tree.get_children():
                self.records_tree.delete(item)

            records = db.get_parking_history(
                plate_filter=plate if plate else None,
                status_filter=status if status != "All" else None,
                date_from=dfrom if dfrom else None,
                date_to=dto if dto else None
            )

            for r in records:
                entry_str = r["entry_time"].strftime("%Y-%m-%d %H:%M") if r.get("entry_time") else "-"
                exit_str = r["exit_time"].strftime("%Y-%m-%d %H:%M") if r.get("exit_time") else "-"
                amount_str = f"₹ {float(r['payment_amount']):.2f}" if r.get("payment_amount") else "₹ 0.00"

                self.records_tree.insert("", "end", values=(
                    r["record_id"],
                    r["plate_number"],
                    r["vehicle_type"],
                    r["owner_name"],
                    r["owner_phone"],
                    r["lot_name"],
                    r["slot_number"],
                    entry_str,
                    exit_str,
                    r["record_status"],
                    r["payment_mode"],
                    amount_str
                ))
        except Exception as e:
            messagebox.showerror("Error", f"Failed to load records: {str(e)}", parent=self)

    def refresh_revenue(self):
        try:
            for item in self.rev_tree.get_children():
                self.rev_tree.delete(item)

            breakdown = db.get_daily_revenue_breakdown()

            total_all = 0.0
            cash_all = 0.0
            upi_all = 0.0
            card_all = 0.0
            tx_all = 0

            for row in breakdown:
                cash = float(row.get("cash_revenue", 0.0) or 0.0)
                upi = float(row.get("upi_revenue", 0.0) or 0.0)
                card = float(row.get("card_revenue", 0.0) or 0.0)
                total = float(row.get("total_revenue", 0.0) or 0.0)
                tx = int(row.get("total_transactions", 0) or 0)

                total_all += total
                cash_all += cash
                upi_all += upi
                card_all += card
                tx_all += tx

                date_str = str(row["pay_date"])

                self.rev_tree.insert("", "end", values=(
                    date_str,
                    tx,
                    f"₹ {cash:,.2f}",
                    f"₹ {upi:,.2f}",
                    f"₹ {card:,.2f}",
                    f"₹ {total:,.2f}"
                ))

            self.rev_kpi_widgets["total_rev"].config(text=f"₹ {total_all:,.2f}")
            self.rev_kpi_widgets["cash_rev"].config(text=f"₹ {cash_all:,.2f}")
            self.rev_kpi_widgets["upi_rev"].config(text=f"₹ {upi_all:,.2f}")
            self.rev_kpi_widgets["card_rev"].config(text=f"₹ {card_all:,.2f}")
            self.rev_kpi_widgets["tx_count"].config(text=str(tx_all))

        except Exception as e:
            messagebox.showerror("Error", f"Failed to load revenue data: {str(e)}", parent=self)

    def export_records_csv(self):
        """Export currently filtered parking records to a CSV file."""
        items = self.records_tree.get_children()
        if not items:
            messagebox.showinfo("Export CSV", "No records available to export.", parent=self)
            return

        now_str = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        filepath = filedialog.asksaveasfilename(
            parent=self,
            defaultextension=".csv",
            initialfile=f"parking_records_{now_str}.csv",
            filetypes=[("CSV Files", "*.csv"), ("All Files", "*.*")]
        )
        if not filepath:
            return

        try:
            headers = ["Record ID", "Plate Number", "Vehicle Type", "Owner Name", "Phone", "Parking Lot", "Slot Number", "Entry Time", "Exit Time", "Status", "Payment Mode", "Fee Paid"]
            with open(filepath, "w", newline="", encoding="utf-8") as f:
                writer = csv.writer(f)
                writer.writerow(headers)
                for item in items:
                    writer.writerow(self.records_tree.item(item, "values"))

            messagebox.showinfo("Export Successful", f"Exported {len(items)} records to:\n{filepath}", parent=self)
        except Exception as e:
            messagebox.showerror("Export Failed", f"Could not export CSV file:\n{str(e)}", parent=self)

    def export_revenue_csv(self):
        """Export daily revenue report to a CSV file."""
        items = self.rev_tree.get_children()
        if not items:
            messagebox.showinfo("Export CSV", "No revenue data available to export.", parent=self)
            return

        now_str = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        filepath = filedialog.asksaveasfilename(
            parent=self,
            defaultextension=".csv",
            initialfile=f"daily_revenue_{now_str}.csv",
            filetypes=[("CSV Files", "*.csv"), ("All Files", "*.*")]
        )
        if not filepath:
            return

        try:
            headers = ["Date", "Transactions Count", "Cash Revenue", "UPI Revenue", "Card Revenue", "Total Daily Revenue"]
            with open(filepath, "w", newline="", encoding="utf-8") as f:
                writer = csv.writer(f)
                writer.writerow(headers)
                for item in items:
                    writer.writerow(self.rev_tree.item(item, "values"))

            messagebox.showinfo("Export Successful", f"Exported revenue report to:\n{filepath}", parent=self)
        except Exception as e:
            messagebox.showerror("Export Failed", f"Could not export CSV file:\n{str(e)}", parent=self)

