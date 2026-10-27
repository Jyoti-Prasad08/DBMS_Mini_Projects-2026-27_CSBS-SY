"""
Reservations Screen for Smart Parking Management System.
Allows booking and cancelling parking slot reservations with trigger-enforced slot status updates.
"""

import tkinter as tk
from tkinter import ttk, messagebox
import datetime
import config
import db


class ReservationsScreen(ttk.Frame):
    """Slot reservation management and status tracking."""

    def __init__(self, parent, on_reservation_changed=None):
        super().__init__(parent)
        self.on_reservation_changed = on_reservation_changed
        self.create_widgets()
        self.load_lots()
        self.refresh()

    def create_widgets(self):
        title_bar = tk.Frame(self, bg=config.THEME_BG)
        title_bar.pack(fill="x", padx=20, pady=(15, 10))

        title_lbl = tk.Label(
            title_bar,
            text="Slot Reservations & Advance Booking",
            font=(config.FONT_FAMILY, 16, "bold"),
            fg=config.THEME_TEXT,
            bg=config.THEME_BG
        )
        title_lbl.pack(side="left")

        # Layout Container: Left = Booking Form, Right = Reservations Treeview
        content = tk.Frame(self, bg=config.THEME_BG)
        content.pack(fill="both", expand=True, padx=20, pady=(0, 15))

        # -------------------------------------------------------------
        # Left Panel: Booking Form
        # -------------------------------------------------------------
        book_card = tk.LabelFrame(
            content,
            text=" 📅 Book a Slot Reservation ",
            font=(config.FONT_FAMILY, 11, "bold"),
            fg=config.THEME_TEXT,
            bg=config.THEME_CARD_BG,
            padx=15,
            pady=12
        )
        book_card.pack(side="left", fill="both", expand=False, padx=(0, 10))

        # Plate Number
        tk.Label(book_card, text="License Plate Number *", font=(config.FONT_FAMILY, 9, "bold"), bg=config.THEME_CARD_BG).pack(anchor="w", pady=(2, 0))
        self.plate_var = tk.StringVar()
        self.plate_entry = ttk.Entry(book_card, textvariable=self.plate_var, font=(config.FONT_FAMILY, 10))
        self.plate_entry.pack(fill="x", pady=(2, 6), ipady=2)

        # Vehicle Type
        tk.Label(book_card, text="Vehicle Type *", font=(config.FONT_FAMILY, 9, "bold"), bg=config.THEME_CARD_BG).pack(anchor="w", pady=(2, 0))
        self.type_var = tk.StringVar(value="Car")
        type_box = tk.Frame(book_card, bg=config.THEME_CARD_BG)
        type_box.pack(fill="x", pady=(2, 6))
        for vt in ("Car", "Bike", "Truck"):
            ttk.Radiobutton(type_box, text=vt, value=vt, variable=self.type_var, command=self.update_available_slots).pack(side="left", padx=(0, 15))

        # Owner Name & Phone
        tk.Label(book_card, text="Owner Name *", font=(config.FONT_FAMILY, 9, "bold"), bg=config.THEME_CARD_BG).pack(anchor="w", pady=(2, 0))
        self.name_var = tk.StringVar()
        ttk.Entry(book_card, textvariable=self.name_var, font=(config.FONT_FAMILY, 10)).pack(fill="x", pady=(2, 6), ipady=2)

        tk.Label(book_card, text="Phone Number *", font=(config.FONT_FAMILY, 9, "bold"), bg=config.THEME_CARD_BG).pack(anchor="w", pady=(2, 0))
        self.phone_var = tk.StringVar()
        ttk.Entry(book_card, textvariable=self.phone_var, font=(config.FONT_FAMILY, 10)).pack(fill="x", pady=(2, 6), ipady=2)

        tk.Label(book_card, text="Email (Optional)", font=(config.FONT_FAMILY, 9, "bold"), bg=config.THEME_CARD_BG).pack(anchor="w", pady=(2, 0))
        self.email_var = tk.StringVar()
        ttk.Entry(book_card, textvariable=self.email_var, font=(config.FONT_FAMILY, 10)).pack(fill="x", pady=(2, 6), ipady=2)

        # Lot & Slot Selection
        tk.Label(book_card, text="Select Parking Lot *", font=(config.FONT_FAMILY, 9, "bold"), bg=config.THEME_CARD_BG).pack(anchor="w", pady=(2, 0))
        self.lot_var = tk.StringVar()
        self.lot_combo = ttk.Combobox(book_card, textvariable=self.lot_var, state="readonly", font=(config.FONT_FAMILY, 9))
        self.lot_combo.pack(fill="x", pady=(2, 6), ipady=2)
        self.lot_combo.bind("<<ComboboxSelected>>", lambda e: self.update_available_slots())

        tk.Label(book_card, text="Select Available Slot *", font=(config.FONT_FAMILY, 9, "bold"), bg=config.THEME_CARD_BG).pack(anchor="w", pady=(2, 0))
        self.slot_var = tk.StringVar()
        self.slot_combo = ttk.Combobox(book_card, textvariable=self.slot_var, state="readonly", font=(config.FONT_FAMILY, 9))
        self.slot_combo.pack(fill="x", pady=(2, 6), ipady=2)

        # Reservation Period
        now = datetime.datetime.now()
        default_from = (now + datetime.timedelta(hours=1)).strftime("%Y-%m-%d %H:00:00")
        default_to = (now + datetime.timedelta(hours=4)).strftime("%Y-%m-%d %H:00:00")

        tk.Label(book_card, text="Reserve From (YYYY-MM-DD HH:MM:SS) *", font=(config.FONT_FAMILY, 8, "bold"), bg=config.THEME_CARD_BG).pack(anchor="w", pady=(2, 0))
        self.from_var = tk.StringVar(value=default_from)
        ttk.Entry(book_card, textvariable=self.from_var, font=(config.FONT_FAMILY, 9)).pack(fill="x", pady=(2, 6), ipady=2)

        tk.Label(book_card, text="Reserve To (YYYY-MM-DD HH:MM:SS) *", font=(config.FONT_FAMILY, 8, "bold"), bg=config.THEME_CARD_BG).pack(anchor="w", pady=(2, 0))
        self.to_var = tk.StringVar(value=default_to)
        ttk.Entry(book_card, textvariable=self.to_var, font=(config.FONT_FAMILY, 9)).pack(fill="x", pady=(2, 12), ipady=2)

        # Confirm Button
        book_btn = tk.Button(
            book_card,
            text="✓ Confirm Slot Reservation",
            font=(config.FONT_FAMILY, 10, "bold"),
            bg=config.THEME_WARNING,
            fg="#ffffff",
            bd=0,
            cursor="hand2",
            padx=10,
            pady=8,
            command=self.handle_booking
        )
        book_btn.pack(fill="x")

        # -------------------------------------------------------------
        # Right Panel: Reservations Treeview
        # -------------------------------------------------------------
        table_card = tk.LabelFrame(
            content,
            text=" 📋 Current & Past Reservations ",
            font=(config.FONT_FAMILY, 11, "bold"),
            fg=config.THEME_TEXT,
            bg=config.THEME_CARD_BG,
            padx=12,
            pady=12
        )
        table_card.pack(side="right", fill="both", expand=True, padx=(10, 0))

        # Filter row
        top_filter = tk.Frame(table_card, bg=config.THEME_CARD_BG)
        top_filter.pack(fill="x", pady=(0, 8))

        tk.Label(top_filter, text="Status Filter:", font=(config.FONT_FAMILY, 9, "bold"), bg=config.THEME_CARD_BG).pack(side="left", padx=(0, 6))
        self.status_filter_var = tk.StringVar(value="All")
        status_cb = ttk.Combobox(top_filter, textvariable=self.status_filter_var, state="readonly", width=12, values=("All", "Active", "Pending", "Cancelled", "Completed"))
        status_cb.pack(side="left")
        status_cb.bind("<<ComboboxSelected>>", lambda e: self.refresh())

        cancel_btn = tk.Button(
            top_filter,
            text="✖ Cancel Selected Reservation",
            font=(config.FONT_FAMILY, 9, "bold"),
            bg="#fef2f2",
            fg=config.THEME_DANGER,
            relief="solid",
            bd=1,
            cursor="hand2",
            padx=10,
            pady=3,
            command=self.handle_cancel
        )
        cancel_btn.pack(side="right")

        refresh_btn = tk.Button(
            top_filter,
            text="🔄 Refresh",
            font=(config.FONT_FAMILY, 9),
            bg="#f1f5f9",
            relief="solid",
            bd=1,
            cursor="hand2",
            padx=10,
            pady=3,
            command=self.refresh
        )
        refresh_btn.pack(side="right", padx=(0, 6))

        # Treeview
        cols = ("id", "plate", "type", "owner", "phone", "lot", "slot", "from_time", "to_time", "status")
        self.tree = ttk.Treeview(table_card, columns=cols, show="headings", height=12)

        self.tree.heading("id", text="Res #")
        self.tree.heading("plate", text="Plate Number")
        self.tree.heading("type", text="Type")
        self.tree.heading("owner", text="Owner")
        self.tree.heading("phone", text="Phone")
        self.tree.heading("lot", text="Parking Lot")
        self.tree.heading("slot", text="Slot")
        self.tree.heading("from_time", text="From")
        self.tree.heading("to_time", text="To")
        self.tree.heading("status", text="Status")

        self.tree.column("id", width=45, anchor="center")
        self.tree.column("plate", width=95, anchor="center")
        self.tree.column("type", width=55, anchor="center")
        self.tree.column("owner", width=110, anchor="w")
        self.tree.column("phone", width=95, anchor="center")
        self.tree.column("lot", width=120, anchor="w")
        self.tree.column("slot", width=55, anchor="center")
        self.tree.column("from_time", width=115, anchor="center")
        self.tree.column("to_time", width=115, anchor="center")
        self.tree.column("status", width=75, anchor="center")

        self.tree.tag_configure("tag_Active", background="#ffedd5")
        self.tree.tag_configure("tag_Pending", background="#fef9c3")
        self.tree.tag_configure("tag_Cancelled", background="#f1f5f9")
        self.tree.tag_configure("tag_Completed", background="#dcfce7")

        tree_scroll = ttk.Scrollbar(table_card, orient="vertical", command=self.tree.yview)
        self.tree.configure(yscrollcommand=tree_scroll.set)

        self.tree.pack(side="left", fill="both", expand=True)
        tree_scroll.pack(side="right", fill="y")

    def load_lots(self):
        try:
            lots = db.get_all_lots()
            self.lot_map = {l["lot_name"]: l["lot_id"] for l in lots}
            names = list(self.lot_map.keys())
            self.lot_combo["values"] = names
            if names:
                self.lot_combo.current(0)
                self.update_available_slots()
        except Exception:
            pass

    def update_available_slots(self):
        """Fetch available slots matching the chosen lot and vehicle type."""
        selected_lot = self.lot_var.get()
        lot_id = self.lot_map.get(selected_lot)
        vtype = self.type_var.get()

        if not lot_id:
            return

        try:
            avail_slots = db.get_slots_filtered(lot_id=lot_id, status="Available", slot_type=vtype)
            self.slot_map = {f"{s['slot_number']} ({s['slot_type']})": s["slot_id"] for s in avail_slots}
            slot_names = list(self.slot_map.keys())
            self.slot_combo["values"] = slot_names
            if slot_names:
                self.slot_combo.current(0)
            else:
                self.slot_combo.set("No Available Slots")
        except Exception:
            pass

    def handle_booking(self):
        plate = self.plate_var.get().strip().upper()
        vtype = self.type_var.get()
        name = self.name_var.get().strip()
        phone = self.phone_var.get().strip()
        email = self.email_var.get().strip()
        slot_label = self.slot_var.get()
        slot_id = self.slot_map.get(slot_label)
        from_str = self.from_var.get().strip()
        to_str = self.to_var.get().strip()

        # Validation
        if not plate:
            messagebox.showwarning("Input Needed", "Please enter license plate number.", parent=self)
            self.plate_entry.focus()
            return
        if not name or not phone:
            messagebox.showwarning("Input Needed", "Owner name and phone number are required.", parent=self)
            return
        if not slot_id:
            messagebox.showerror("No Slot", "Please select a valid available slot.", parent=self)
            return

        try:
            from_dt = datetime.datetime.strptime(from_str, "%Y-%m-%d %H:%M:%S")
            to_dt = datetime.datetime.strptime(to_str, "%Y-%m-%d %H:%M:%S")
            if to_dt <= from_dt:
                messagebox.showerror("Invalid Date", "'Reserve To' time must be after 'Reserve From' time.", parent=self)
                return
        except ValueError:
            messagebox.showerror("Invalid Format", "Date format must be: YYYY-MM-DD HH:MM:SS", parent=self)
            return

        try:
            res_id = db.create_reservation(
                plate_number=plate,
                vehicle_type=vtype,
                owner_name=name,
                owner_phone=phone,
                owner_email=email if email else None,
                slot_id=slot_id,
                reserve_from=from_dt,
                reserve_to=to_dt
            )

            messagebox.showinfo(
                "Reservation Confirmed",
                f"Reservation #{res_id:05d} confirmed for {plate}!\n"
                f"Slot status automatically updated to 'Reserved' via Database Trigger.",
                parent=self
            )

            self.plate_var.set("")
            self.name_var.set("")
            self.phone_var.set("")
            self.email_var.set("")
            self.update_available_slots()
            self.refresh()

            if self.on_reservation_changed:
                self.on_reservation_changed()

        except Exception as e:
            messagebox.showerror("Booking Failed", str(e), parent=self)

    def handle_cancel(self):
        selected = self.tree.selection()
        if not selected:
            messagebox.showwarning("Select Row", "Please select a reservation to cancel.", parent=self)
            return

        vals = self.tree.item(selected[0], "values")
        res_id = int(vals[0])
        plate = vals[1]
        status = vals[9]

        if status in ("Cancelled", "Completed"):
            messagebox.showinfo("Notice", f"This reservation is already {status}.", parent=self)
            return

        confirm = messagebox.askyesno(
            "Cancel Reservation",
            f"Are you sure you want to cancel reservation #{res_id} for {plate}?\n"
            "The slot will be freed back to 'Available' via Database Trigger.",
            parent=self
        )
        if not confirm:
            return

        try:
            db.cancel_reservation(res_id)
            messagebox.showinfo("Cancelled", f"Reservation #{res_id} has been cancelled.", parent=self)
            self.refresh()
            self.update_available_slots()
            if self.on_reservation_changed:
                self.on_reservation_changed()
        except Exception as e:
            messagebox.showerror("Cancel Error", str(e), parent=self)

    def refresh(self):
        filter_val = self.status_filter_var.get()
        try:
            for item in self.tree.get_children():
                self.tree.delete(item)

            res_list = db.get_reservations(status_filter=filter_val)
            for r in res_list:
                tag = f"tag_{r['status']}"
                from_str = r["reserve_from"].strftime("%Y-%m-%d %H:%M") if r.get("reserve_from") else "-"
                to_str = r["reserve_to"].strftime("%Y-%m-%d %H:%M") if r.get("reserve_to") else "-"
                self.tree.insert("", "end", values=(
                    r["reservation_id"],
                    r["plate_number"],
                    r["vehicle_type"],
                    r["owner_name"],
                    r["owner_phone"],
                    r["lot_name"],
                    r["slot_number"],
                    from_str,
                    to_str,
                    r["status"]
                ), tags=(tag,))
        except Exception as e:
            messagebox.showerror("Error", f"Could not load reservations: {str(e)}", parent=self)

