"""
Vehicle Exit & Payment Screen for Smart Parking Management System.
Calculates duration and fee using MySQL Stored Procedure, processes payments,
and frees slot via Database Trigger.
"""

import tkinter as tk
from tkinter import ttk, messagebox, filedialog
import datetime
import config
import db


class VehicleExitScreen(ttk.Frame):
    """Exit processing, fee calculation via stored procedure, and payment recording."""

    def __init__(self, parent, on_exit_completed=None):
        super().__init__(parent)
        self.on_exit_completed = on_exit_completed
        self.current_record = None
        self.current_fee_data = None
        self.create_widgets()
        self.refresh_active_list()

    def create_widgets(self):
        title_bar = tk.Frame(self, bg=config.THEME_BG)
        title_bar.pack(fill="x", padx=20, pady=(15, 10))

        title_lbl = tk.Label(
            title_bar,
            text="Vehicle Exit, Fee Calculation & Payment",
            font=(config.FONT_FAMILY, 16, "bold"),
            fg=config.THEME_TEXT,
            bg=config.THEME_BG
        )
        title_lbl.pack(side="left")

        # Main layout container
        content_frame = tk.Frame(self, bg=config.THEME_BG)
        content_frame.pack(fill="both", expand=True, padx=20, pady=(0, 15))

        # -------------------------------------------------------------
        # Left Panel: Search & Active Vehicles Selector
        # -------------------------------------------------------------
        left_panel = tk.LabelFrame(
            content_frame,
            text=" 🔍 Select Parked Vehicle ",
            font=(config.FONT_FAMILY, 11, "bold"),
            fg=config.THEME_TEXT,
            bg=config.THEME_CARD_BG,
            padx=12,
            pady=12
        )
        left_panel.pack(side="left", fill="both", expand=True, padx=(0, 10))

        # Search Bar
        search_box = tk.Frame(left_panel, bg=config.THEME_CARD_BG)
        search_box.pack(fill="x", pady=(0, 10))

        tk.Label(
            search_box,
            text="Enter Plate Number:",
            font=(config.FONT_FAMILY, 9, "bold"),
            fg=config.THEME_TEXT,
            bg=config.THEME_CARD_BG
        ).pack(side="left", padx=(0, 6))

        self.search_plate_var = tk.StringVar()
        self.search_entry = ttk.Entry(search_box, textvariable=self.search_plate_var, font=(config.FONT_FAMILY, 10))
        self.search_entry.pack(side="left", fill="x", expand=True, ipady=2)
        self.search_entry.bind("<Return>", lambda e: self.search_vehicle())

        search_btn = tk.Button(
            search_box,
            text="Search",
            font=(config.FONT_FAMILY, 9, "bold"),
            bg=config.THEME_ACCENT,
            fg="#ffffff",
            bd=0,
            cursor="hand2",
            padx=10,
            command=self.search_vehicle
        )
        search_btn.pack(side="left", padx=(6, 0))

        # Active Vehicles Treeview
        tree_label_row = tk.Frame(left_panel, bg=config.THEME_CARD_BG)
        tree_label_row.pack(fill="x", pady=(4, 4))
        tk.Label(
            tree_label_row,
            text="Or pick from currently parked vehicles:",
            font=(config.FONT_FAMILY, 8, "bold"),
            fg=config.THEME_SUBTEXT,
            bg=config.THEME_CARD_BG
        ).pack(side="left")

        refresh_list_btn = tk.Button(
            tree_label_row,
            text="🔄 Refresh List",
            font=(config.FONT_FAMILY, 8),
            bg="#f1f5f9",
            relief="solid",
            bd=1,
            cursor="hand2",
            command=self.refresh_active_list
        )
        refresh_list_btn.pack(side="right")

        cols = ("record_id", "plate", "type", "lot", "slot", "entry_time")
        self.active_tree = ttk.Treeview(left_panel, columns=cols, show="headings", height=10)

        self.active_tree.heading("record_id", text="Rec #")
        self.active_tree.heading("plate", text="Plate Number")
        self.active_tree.heading("type", text="Type")
        self.active_tree.heading("lot", text="Lot")
        self.active_tree.heading("slot", text="Slot")
        self.active_tree.heading("entry_time", text="Entry Time")

        self.active_tree.column("record_id", width=45, anchor="center")
        self.active_tree.column("plate", width=100, anchor="center")
        self.active_tree.column("type", width=60, anchor="center")
        self.active_tree.column("lot", width=120, anchor="w")
        self.active_tree.column("slot", width=55, anchor="center")
        self.active_tree.column("entry_time", width=120, anchor="center")

        tree_scroll = ttk.Scrollbar(left_panel, orient="vertical", command=self.active_tree.yview)
        self.active_tree.configure(yscrollcommand=tree_scroll.set)

        self.active_tree.pack(side="left", fill="both", expand=True)
        tree_scroll.pack(side="right", fill="y")

        self.active_tree.bind("<<TreeviewSelect>>", self.on_tree_select)

        # -------------------------------------------------------------
        # Right Panel: Fee Breakdown & Payment Checkout
        # -------------------------------------------------------------
        self.right_panel = tk.LabelFrame(
            content_frame,
            text=" 💳 Fee Calculation & Checkout (Stored Procedure: sp_calculate_parking_fee) ",
            font=(config.FONT_FAMILY, 11, "bold"),
            fg=config.THEME_TEXT,
            bg=config.THEME_CARD_BG,
            padx=15,
            pady=15
        )
        self.right_panel.pack(side="right", fill="both", expand=True, padx=(10, 0))

        # Vehicle Info Summary
        info_frame = tk.Frame(self.right_panel, bg="#f8fafc", bd=1, relief="solid", padx=12, pady=10)
        info_frame.pack(fill="x", pady=(0, 10))

        self.info_labels = {}
        info_fields = [
            ("plate", "Plate Number:"),
            ("type", "Vehicle Type:"),
            ("owner", "Owner:"),
            ("lot_slot", "Lot & Slot:"),
            ("entry_time", "Entry Time:"),
            ("exit_time", "Exit Time:"),
        ]

        for i, (k, label_text) in enumerate(info_fields):
            row = i // 2
            col = (i % 2) * 2

            lbl = tk.Label(info_frame, text=label_text, font=(config.FONT_FAMILY, 9, "bold"), fg=config.THEME_SUBTEXT, bg="#f8fafc")
            lbl.grid(row=row, column=col, sticky="w", padx=(0, 5), pady=2)

            val = tk.Label(info_frame, text="-", font=(config.FONT_FAMILY, 9, "bold"), fg=config.THEME_TEXT, bg="#f8fafc")
            val.grid(row=row, column=col+1, sticky="w", padx=(0, 15), pady=2)
            self.info_labels[k] = val

        # Billing Breakdown Card
        calc_card = tk.Frame(self.right_panel, bg="#eff6ff", bd=1, relief="solid", padx=12, pady=10)
        calc_card.pack(fill="x", pady=(0, 15))

        tk.Label(
            calc_card,
            text="BILLING BREAKDOWN",
            font=(config.FONT_FAMILY, 9, "bold"),
            fg=config.THEME_ACCENT,
            bg="#eff6ff"
        ).pack(anchor="w")

        breakdown_grid = tk.Frame(calc_card, bg="#eff6ff")
        breakdown_grid.pack(fill="x", pady=6)

        tk.Label(breakdown_grid, text="Duration:", font=(config.FONT_FAMILY, 9), bg="#eff6ff").grid(row=0, column=0, sticky="w")
        self.duration_val = tk.Label(breakdown_grid, text="0 mins", font=(config.FONT_FAMILY, 9, "bold"), bg="#eff6ff")
        self.duration_val.grid(row=0, column=1, sticky="w", padx=10)

        tk.Label(breakdown_grid, text="Billable Hours (Ceiling):", font=(config.FONT_FAMILY, 9), bg="#eff6ff").grid(row=1, column=0, sticky="w")
        self.hours_val = tk.Label(breakdown_grid, text="0 hr", font=(config.FONT_FAMILY, 9, "bold"), bg="#eff6ff")
        self.hours_val.grid(row=1, column=1, sticky="w", padx=10)

        tk.Label(breakdown_grid, text="Hourly Rate:", font=(config.FONT_FAMILY, 9), bg="#eff6ff").grid(row=2, column=0, sticky="w")
        self.rate_val = tk.Label(breakdown_grid, text="₹ 0.00 / hr", font=(config.FONT_FAMILY, 9, "bold"), bg="#eff6ff")
        self.rate_val.grid(row=2, column=1, sticky="w", padx=10)

        div = ttk.Separator(calc_card, orient="horizontal")
        div.pack(fill="x", pady=6)

        fee_row = tk.Frame(calc_card, bg="#eff6ff")
        fee_row.pack(fill="x")

        tk.Label(fee_row, text="Total Parking Fee:", font=(config.FONT_FAMILY, 12, "bold"), fg=config.THEME_TEXT, bg="#eff6ff").pack(side="left")
        self.total_fee_val = tk.Label(fee_row, text="₹ 0.00", font=(config.FONT_FAMILY, 16, "bold"), fg="#16a34a", bg="#eff6ff")
        self.total_fee_val.pack(side="right")

        # Payment Mode Selection
        payment_box = tk.Frame(self.right_panel, bg=config.THEME_CARD_BG)
        payment_box.pack(fill="x", pady=(0, 15))

        tk.Label(
            payment_box,
            text="Select Payment Mode *",
            font=(config.FONT_FAMILY, 10, "bold"),
            fg=config.THEME_TEXT,
            bg=config.THEME_CARD_BG
        ).pack(anchor="w", pady=(0, 4))

        self.payment_mode_var = tk.StringVar(value="UPI")
        modes_frame = tk.Frame(payment_box, bg=config.THEME_CARD_BG)
        modes_frame.pack(fill="x")

        for mode in ("Cash", "UPI", "Card"):
            rb = ttk.Radiobutton(modes_frame, text=mode, value=mode, variable=self.payment_mode_var)
            rb.pack(side="left", padx=(0, 25))

        # Checkout Action Button
        self.checkout_btn = tk.Button(
            self.right_panel,
            text="💳 Process Payment & Free Slot",
            font=(config.FONT_FAMILY, 11, "bold"),
            bg=config.THEME_SUCCESS,
            fg="#ffffff",
            activebackground="#15803d",
            activeforeground="#ffffff",
            bd=0,
            cursor="hand2",
            padx=15,
            pady=10,
            state="disabled",
            command=self.process_payment
        )
        self.checkout_btn.pack(fill="x")

    def refresh_active_list(self):
        """Fetch all currently active parked vehicles into the list."""
        try:
            for item in self.active_tree.get_children():
                self.active_tree.delete(item)

            active_records = db.get_active_parking_monitor()
            for r in active_records:
                entry_str = r["entry_time"].strftime("%Y-%m-%d %H:%M") if r.get("entry_time") else "-"
                self.active_tree.insert("", "end", values=(
                    r["record_id"],
                    r["plate_number"],
                    r["vehicle_type"],
                    r["lot_name"],
                    r["slot_number"],
                    entry_str
                ))
        except Exception as e:
            messagebox.showerror("Error", f"Could not load active parkings: {str(e)}", parent=self)

    def on_tree_select(self, event):
        selected = self.active_tree.selection()
        if not selected:
            return
        vals = self.active_tree.item(selected[0], "values")
        if vals:
            plate = vals[1]
            self.search_plate_var.set(plate)
            self.load_vehicle_for_exit(plate)

    def search_vehicle(self):
        plate = self.search_plate_var.get().strip().upper()
        if not plate:
            messagebox.showwarning("Input Needed", "Please enter a plate number to search.", parent=self)
            return
        self.load_vehicle_for_exit(plate)

    def load_vehicle_for_exit(self, plate: str):
        try:
            rec = db.get_active_parking_by_plate(plate)
            if not rec:
                messagebox.showerror(
                    "Vehicle Not Found",
                    f"No active parking record found for plate '{plate}'.\n"
                    "Ensure the plate number is correct and currently checked in.",
                    parent=self
                )
                self.reset_checkout_view()
                return

            self.current_record = rec
            now = datetime.datetime.now()

            # Execute Stored Procedure sp_calculate_parking_fee
            fee_info = db.calculate_parking_fee_sp(rec["record_id"], exit_time=now)
            self.current_fee_data = fee_info

            # Populate display labels
            self.info_labels["plate"].config(text=rec["plate_number"])
            self.info_labels["type"].config(text=rec["vehicle_type"])
            self.info_labels["owner"].config(text=f"{rec['owner_name']} ({rec['owner_phone']})")
            self.info_labels["lot_slot"].config(text=f"{rec['lot_name']} - Slot {rec['slot_number']}")
            self.info_labels["entry_time"].config(text=rec["entry_time"].strftime("%Y-%m-%d %H:%M:%S"))
            self.info_labels["exit_time"].config(text=now.strftime("%Y-%m-%d %H:%M:%S"))

            mins = fee_info["duration_minutes"]
            if mins < 60:
                dur_str = f"{mins} mins"
            else:
                dur_str = f"{mins // 60} hr {mins % 60} mins"

            self.duration_val.config(text=dur_str)
            self.hours_val.config(text=f"{fee_info['billable_hours']} hr (rounded up)")
            self.rate_val.config(text=f"₹ {fee_info['hourly_rate']:.2f} / hr")
            self.total_fee_val.config(text=f"₹ {fee_info['total_fee']:.2f}")

            self.checkout_btn.config(state="normal")

        except Exception as e:
            messagebox.showerror("Error", f"Failed to calculate fee: {str(e)}", parent=self)
            self.reset_checkout_view()

    def process_payment(self):
        if not self.current_record or not self.current_fee_data:
            return

        mode = self.payment_mode_var.get()
        amount = self.current_fee_data["total_fee"]
        exit_time = self.current_fee_data["exit_time"]

        confirm = messagebox.askyesno(
            "Confirm Payment",
            f"Collect ₹ {amount:.2f} via {mode} for Vehicle {self.current_record['plate_number']}?\n\n"
            "This will mark the record as Completed and free the slot.",
            parent=self
        )
        if not confirm:
            return

        try:
            receipt = db.process_vehicle_exit_and_payment(
                record_id=self.current_record["record_id"],
                exit_time=exit_time,
                amount=amount,
                payment_mode=mode
            )

            self.show_receipt_popup(receipt)
            self.reset_checkout_view()
            self.refresh_active_list()

            if self.on_exit_completed:
                self.on_exit_completed()

        except Exception as e:
            messagebox.showerror("Payment Error", f"Failed to process exit & payment:\n{str(e)}", parent=self)

    def show_receipt_popup(self, r):
        """Displays formatted payment receipt modal dialog."""
        modal = tk.Toplevel(self)
        modal.title(f"Payment Receipt #{r['payment_id']}")
        modal.geometry("450x520")
        modal.resizable(False, False)
        modal.configure(bg=config.THEME_BG)
        modal.transient(self)
        modal.grab_set()

        header = tk.Frame(modal, bg=config.THEME_PRIMARY, pady=12)
        header.pack(fill="x")
        tk.Label(
            header,
            text="✓ PAYMENT SUCCESSFUL",
            font=(config.FONT_FAMILY, 14, "bold"),
            fg="#4ade80",
            bg=config.THEME_PRIMARY
        ).pack()
        tk.Label(
            header,
            text=f"Receipt #{r['payment_id']:06d} • Slot {r['slot_number']} Released",
            font=(config.FONT_FAMILY, 9),
            fg="#94a3b8",
            bg=config.THEME_PRIMARY
        ).pack()

        text_box = tk.Text(modal, font=("Consolas", 10), bg="#ffffff", fg=config.THEME_TEXT, bd=0, padx=15, pady=12)
        text_box.pack(fill="both", expand=True, padx=20, pady=15)

        receipt_text = (
            "====================================================\n"
            "             PARKING INVOICE & RECEIPT              \n"
            "====================================================\n"
            f"  RECEIPT ID    : #{r['payment_id']:06d}\n"
            f"  RECORD ID     : #{r['record_id']:06d}\n"
            f"  PAYMENT DATE  : {r['payment_time']}\n"
            "----------------------------------------------------\n"
            f"  PLATE NUMBER  : {r['plate_number']}\n"
            f"  VEHICLE TYPE  : {r['vehicle_type']}\n"
            f"  OWNER NAME    : {r['owner_name']}\n"
            f"  PARKING LOT   : {r['lot_name']}\n"
            f"  SLOT FREED    : {r['slot_number']} (Status: Available)\n"
            "----------------------------------------------------\n"
            f"  ENTRY TIME    : {r['entry_time']}\n"
            f"  EXIT TIME     : {r['exit_time']}\n"
            f"  BILLABLE HRS  : {r['billable_hours']} hr(s)\n"
            f"  PAYMENT MODE  : {r['payment_mode']}\n"
            f"  TOTAL PAID    : ₹ {r['amount']:.2f}\n"
            "====================================================\n"
            "  MySQL Trigger automatically freed slot on exit!   \n"
            "  Thank you for parking with us! Drive safely.     \n"
            "====================================================\n"
        )
        text_box.insert("end", receipt_text)
        text_box.config(state="disabled")

        btn_box = tk.Frame(modal, bg=config.THEME_BG, pady=10)
        btn_box.pack(fill="x", padx=20)

        def save_receipt():
            filename = f"Receipt_{r['payment_id']}_{r['plate_number']}.txt"
            path = filedialog.asksaveasfilename(
                parent=modal,
                defaultextension=".txt",
                initialfile=filename,
                filetypes=[("Text Files", "*.txt")]
            )
            if path:
                with open(path, "w", encoding="utf-8") as f:
                    f.write(receipt_text)
                messagebox.showinfo("Saved", f"Receipt saved to:\n{path}", parent=modal)

        save_btn = tk.Button(btn_box, text="🖨 Save Receipt (.txt)", font=(config.FONT_FAMILY, 9, "bold"), bg=config.THEME_ACCENT, fg="#fff", bd=0, padx=12, pady=6, command=save_receipt)
        save_btn.pack(side="left", fill="x", expand=True, padx=(0, 5))

        close_btn = tk.Button(btn_box, text="Close", font=(config.FONT_FAMILY, 9), bg="#e2e8f0", fg=config.THEME_TEXT, bd=0, padx=12, pady=6, command=modal.destroy)
        close_btn.pack(side="right", padx=(5, 0))

    def reset_checkout_view(self):
        self.current_record = None
        self.current_fee_data = None
        for k in self.info_labels:
            self.info_labels[k].config(text="-")
        self.duration_val.config(text="0 mins")
        self.hours_val.config(text="0 hr")
        self.rate_val.config(text="₹ 0.00 / hr")
        self.total_fee_val.config(text="₹ 0.00")
        self.checkout_btn.config(state="disabled")
        self.search_plate_var.set("")

