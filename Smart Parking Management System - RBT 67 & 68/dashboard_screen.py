"""
Dashboard Screen for Smart Parking Management System.
Displays real-time KPI metrics, lot occupancy views, and active vehicle monitor.
"""

import tkinter as tk
from tkinter import ttk, messagebox
import config
import db


class DashboardScreen(ttk.Frame):
    """Real-time dashboard with metrics and live views."""

    def __init__(self, parent):
        super().__init__(parent)
        self.create_widgets()
        self.refresh()

    def create_widgets(self):
        # Top title & action bar
        title_bar = tk.Frame(self, bg=config.THEME_BG)
        title_bar.pack(fill="x", padx=20, pady=(15, 10))

        title_lbl = tk.Label(
            title_bar,
            text="System Overview & Live Dashboard",
            font=(config.FONT_FAMILY, 16, "bold"),
            fg=config.THEME_TEXT,
            bg=config.THEME_BG
        )
        title_lbl.pack(side="left")

        refresh_btn = tk.Button(
            title_bar,
            text="🔄 Refresh Data",
            font=(config.FONT_FAMILY, 9, "bold"),
            bg="#ffffff",
            fg=config.THEME_TEXT,
            relief="solid",
            bd=1,
            cursor="hand2",
            padx=10,
            pady=4,
            command=self.refresh
        )
        refresh_btn.pack(side="right")

        # -------------------------------------------------------------
        # KPI Cards Frame
        # -------------------------------------------------------------
        kpi_container = tk.Frame(self, bg=config.THEME_BG)
        kpi_container.pack(fill="x", padx=20, pady=(0, 15))

        self.kpi_widgets = {}

        kpi_configs = [
            ("total_slots", "TOTAL SLOTS", "0", config.THEME_PRIMARY, "🅿"),
            ("available_slots", "AVAILABLE", "0", config.THEME_SUCCESS, "✓"),
            ("occupied_slots", "OCCUPIED", "0", config.THEME_DANGER, "🚗"),
            ("reserved_slots", "RESERVED", "0", config.THEME_WARNING, "📅"),
            ("active_vehicles", "ACTIVE VEHICLES", "0", config.THEME_ACCENT, "⚡"),
            ("today_revenue", "TODAY'S REVENUE", "₹ 0.00", "#059669", "₹"),
        ]

        for idx, (key, title, default_val, accent_color, icon) in enumerate(kpi_configs):
            card = tk.Frame(kpi_container, bg=config.THEME_CARD_BG, bd=1, relief="solid")
            card.pack(side="left", expand=True, fill="both", padx=4)

            # Left color bar
            bar = tk.Frame(card, bg=accent_color, width=4)
            bar.pack(side="left", fill="y")

            content = tk.Frame(card, bg=config.THEME_CARD_BG, padx=8, pady=10)
            content.pack(side="left", fill="both", expand=True)

            top_row = tk.Frame(content, bg=config.THEME_CARD_BG)
            top_row.pack(fill="x")

            lbl_title = tk.Label(
                top_row,
                text=title,
                font=(config.FONT_FAMILY, 8, "bold"),
                fg=config.THEME_SUBTEXT,
                bg=config.THEME_CARD_BG
            )
            lbl_title.pack(side="left")

            lbl_icon = tk.Label(
                top_row,
                text=icon,
                font=(config.FONT_FAMILY, 10, "bold"),
                fg=accent_color,
                bg=config.THEME_CARD_BG
            )
            lbl_icon.pack(side="right")

            lbl_val = tk.Label(
                content,
                text=default_val,
                font=(config.FONT_FAMILY, 15, "bold"),
                fg=config.THEME_TEXT,
                bg=config.THEME_CARD_BG
            )
            lbl_val.pack(anchor="w", pady=(4, 0))

            self.kpi_widgets[key] = lbl_val

        # -------------------------------------------------------------
        # Split Panels: Lot Availability (View) & Active Parking Monitor
        # -------------------------------------------------------------
        split_pane = tk.PanedWindow(self, orient="vertical", bg=config.THEME_BG, sashwidth=6)
        split_pane.pack(fill="both", expand=True, padx=20, pady=(0, 15))

        # 1. Lot Capacity & Availability View
        lot_frame = tk.LabelFrame(
            split_pane,
            text=" 📊 Parking Lot Utilization (Database View: v_lot_availability) ",
            font=(config.FONT_FAMILY, 10, "bold"),
            fg=config.THEME_TEXT,
            bg=config.THEME_CARD_BG,
            padx=10,
            pady=8
        )
        split_pane.add(lot_frame, minsize=140)

        lot_cols = ("lot_id", "lot_name", "location", "capacity", "available", "occupied", "reserved", "maint", "occ_pct")
        self.lot_tree = ttk.Treeview(lot_frame, columns=lot_cols, show="headings", height=4)

        self.lot_tree.heading("lot_id", text="ID")
        self.lot_tree.heading("lot_name", text="Parking Lot")
        self.lot_tree.heading("location", text="Location")
        self.lot_tree.heading("capacity", text="Capacity")
        self.lot_tree.heading("available", text="Available")
        self.lot_tree.heading("occupied", text="Occupied")
        self.lot_tree.heading("reserved", text="Reserved")
        self.lot_tree.heading("maint", text="Maintenance")
        self.lot_tree.heading("occ_pct", text="Occupancy %")

        self.lot_tree.column("lot_id", width=40, anchor="center")
        self.lot_tree.column("lot_name", width=190, anchor="w")
        self.lot_tree.column("location", width=180, anchor="w")
        self.lot_tree.column("capacity", width=70, anchor="center")
        self.lot_tree.column("available", width=70, anchor="center")
        self.lot_tree.column("occupied", width=70, anchor="center")
        self.lot_tree.column("reserved", width=70, anchor="center")
        self.lot_tree.column("maint", width=80, anchor="center")
        self.lot_tree.column("occ_pct", width=90, anchor="center")

        lot_scroll = ttk.Scrollbar(lot_frame, orient="vertical", command=self.lot_tree.yview)
        self.lot_tree.configure(yscrollcommand=lot_scroll.set)

        self.lot_tree.pack(side="left", fill="both", expand=True)
        lot_scroll.pack(side="right", fill="y")

        # 2. Active Parking Monitor
        active_frame = tk.LabelFrame(
            split_pane,
            text=" 🚗 Currently Parked Vehicles (Active Records) ",
            font=(config.FONT_FAMILY, 10, "bold"),
            fg=config.THEME_TEXT,
            bg=config.THEME_CARD_BG,
            padx=10,
            pady=8
        )
        split_pane.add(active_frame, minsize=180)

        active_cols = ("record_id", "plate", "type", "owner", "phone", "lot", "slot", "entry_time", "duration")
        self.active_tree = ttk.Treeview(active_frame, columns=active_cols, show="headings", height=6)

        self.active_tree.heading("record_id", text="Record ID")
        self.active_tree.heading("plate", text="Plate Number")
        self.active_tree.heading("type", text="Type")
        self.active_tree.heading("owner", text="Owner Name")
        self.active_tree.heading("phone", text="Phone")
        self.active_tree.heading("lot", text="Parking Lot")
        self.active_tree.heading("slot", text="Slot")
        self.active_tree.heading("entry_time", text="Entry Time")
        self.active_tree.heading("duration", text="Parked For")

        self.active_tree.column("record_id", width=70, anchor="center")
        self.active_tree.column("plate", width=110, anchor="center")
        self.active_tree.column("type", width=70, anchor="center")
        self.active_tree.column("owner", width=130, anchor="w")
        self.active_tree.column("phone", width=110, anchor="center")
        self.active_tree.column("lot", width=160, anchor="w")
        self.active_tree.column("slot", width=70, anchor="center")
        self.active_tree.column("entry_time", width=140, anchor="center")
        self.active_tree.column("duration", width=100, anchor="center")

        active_scroll = ttk.Scrollbar(active_frame, orient="vertical", command=self.active_tree.yview)
        self.active_tree.configure(yscrollcommand=active_scroll.set)

        self.active_tree.pack(side="left", fill="both", expand=True)
        active_scroll.pack(side="right", fill="y")

    def refresh(self):
        """Fetch latest data from database and update views."""
        try:
            # 1. Update KPIs
            kpis = db.get_dashboard_kpis()
            self.kpi_widgets["total_slots"].config(text=str(kpis["total_slots"]))
            self.kpi_widgets["available_slots"].config(text=str(kpis["available_slots"]))
            self.kpi_widgets["occupied_slots"].config(text=str(kpis["occupied_slots"]))
            self.kpi_widgets["reserved_slots"].config(text=str(kpis["reserved_slots"]))
            self.kpi_widgets["active_vehicles"].config(text=str(kpis["active_vehicles"]))
            self.kpi_widgets["today_revenue"].config(text=f"₹ {kpis['today_revenue']:,.2f}")

            # 2. Update Lot Availability
            for item in self.lot_tree.get_children():
                self.lot_tree.delete(item)

            lots = db.get_lot_availability_view()
            for lot in lots:
                pct = float(lot["occupancy_rate_pct"]) if lot["occupancy_rate_pct"] is not None else 0.0
                self.lot_tree.insert("", "end", values=(
                    lot["lot_id"],
                    lot["lot_name"],
                    lot["location"],
                    lot["total_capacity"],
                    lot["available_slots"],
                    lot["occupied_slots"],
                    lot["reserved_slots"],
                    lot["maintenance_slots"],
                    f"{pct:.1f} %"
                ))

            # 3. Update Active Parking Monitor
            for item in self.active_tree.get_children():
                self.active_tree.delete(item)

            active_records = db.get_active_parking_monitor()
            for rec in active_records:
                mins = rec.get("parked_duration_mins", 0) or 0
                if mins < 60:
                    dur_str = f"{mins} mins"
                else:
                    dur_str = f"{mins // 60}h {mins % 60}m"

                entry_str = rec["entry_time"].strftime("%Y-%m-%d %H:%M") if rec.get("entry_time") else "-"

                self.active_tree.insert("", "end", values=(
                    rec["record_id"],
                    rec["plate_number"],
                    rec["vehicle_type"],
                    rec["owner_name"],
                    rec["owner_phone"],
                    rec["lot_name"],
                    rec["slot_number"],
                    entry_str,
                    dur_str
                ))

        except Exception as e:
            messagebox.showerror("Error Refreshing Dashboard", f"Failed to refresh dashboard data:\n{str(e)}", parent=self)

