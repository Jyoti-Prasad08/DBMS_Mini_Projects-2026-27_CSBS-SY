"""
Vehicle Entry Screen for Smart Parking Management System.
Handles vehicle check-in, auto-allocation of available slots, and ticket printing.
"""

import tkinter as tk
from tkinter import ttk, messagebox, filedialog
import os
import datetime
import config
import db


class VehicleEntryScreen(ttk.Frame):
    """Entry form for allocating slots and issuing parking tickets."""

    def __init__(self, parent, on_entry_completed=None):
        super().__init__(parent)
        self.on_entry_completed = on_entry_completed
        self.last_ticket_data = None
        self.create_widgets()
        self.load_lots()

    def create_widgets(self):
        title_bar = tk.Frame(self, bg=config.THEME_BG)
        title_bar.pack(fill="x", padx=20, pady=(15, 10))

        title_lbl = tk.Label(
            title_bar,
            text="Vehicle Entry & Slot Auto-Allocation",
            font=(config.FONT_FAMILY, 16, "bold"),
            fg=config.THEME_TEXT,
            bg=config.THEME_BG
        )
        title_lbl.pack(side="left")

        # Main layout container: Left = Entry Form, Right = Ticket Preview / Summary
        content_frame = tk.Frame(self, bg=config.THEME_BG)
        content_frame.pack(fill="both", expand=True, padx=20, pady=(0, 15))

        # -------------------------------------------------------------
        # Left Panel: Form Card
        # -------------------------------------------------------------
        left_card = tk.LabelFrame(
            content_frame,
            text=" 📝 Vehicle & Owner Check-in Details ",
            font=(config.FONT_FAMILY, 11, "bold"),
            fg=config.THEME_TEXT,
            bg=config.THEME_CARD_BG,
            padx=15,
            pady=15
        )
        left_card.pack(side="left", fill="both", expand=True, padx=(0, 10))

        # License Plate Number
        row0 = tk.Frame(left_card, bg=config.THEME_CARD_BG)
        row0.pack(fill="x", pady=6)
        tk.Label(
            row0,
            text="License Plate Number *",
            font=(config.FONT_FAMILY, 10, "bold"),
            fg=config.THEME_TEXT,
            bg=config.THEME_CARD_BG
        ).pack(anchor="w")

        plate_box = tk.Frame(row0, bg=config.THEME_CARD_BG)
        plate_box.pack(fill="x", pady=(2, 0))

        self.plate_var = tk.StringVar()
        self.plate_entry = ttk.Entry(plate_box, textvariable=self.plate_var, font=(config.FONT_FAMILY, 11, "bold"))
        self.plate_entry.pack(side="left", fill="x", expand=True, ipady=3)
        self.plate_entry.bind("<FocusOut>", lambda e: self.check_existing_vehicle())
        self.plate_entry.bind("<Return>", lambda e: self.check_existing_vehicle())

        lookup_btn = tk.Button(
            plate_box,
            text="🔍 Lookup Existing",
            font=(config.FONT_FAMILY, 8, "bold"),
            bg="#f1f5f9",
            relief="solid",
            bd=1,
            cursor="hand2",
            command=self.check_existing_vehicle
        )
        lookup_btn.pack(side="right", padx=(8, 0), ipady=2)

        # Vehicle Type
        row1 = tk.Frame(left_card, bg=config.THEME_CARD_BG)
        row1.pack(fill="x", pady=6)
        tk.Label(
            row1,
            text="Vehicle Type *",
            font=(config.FONT_FAMILY, 10, "bold"),
            fg=config.THEME_TEXT,
            bg=config.THEME_CARD_BG
        ).pack(anchor="w")

        self.type_var = tk.StringVar(value="Car")
        type_box = tk.Frame(row1, bg=config.THEME_CARD_BG)
        type_box.pack(fill="x", pady=(2, 0))

        for vtype in ("Car", "Bike", "Truck"):
            rb = ttk.Radiobutton(type_box, text=vtype, value=vtype, variable=self.type_var)
            rb.pack(side="left", padx=(0, 20))

        # Owner Name
        row2 = tk.Frame(left_card, bg=config.THEME_CARD_BG)
        row2.pack(fill="x", pady=6)
        tk.Label(
            row2,
            text="Owner Full Name *",
            font=(config.FONT_FAMILY, 10, "bold"),
            fg=config.THEME_TEXT,
            bg=config.THEME_CARD_BG
        ).pack(anchor="w")

        self.name_var = tk.StringVar()
        self.name_entry = ttk.Entry(row2, textvariable=self.name_var, font=(config.FONT_FAMILY, 10))
        self.name_entry.pack(fill="x", pady=(2, 0), ipady=3)

        # Owner Phone
        row3 = tk.Frame(left_card, bg=config.THEME_CARD_BG)
        row3.pack(fill="x", pady=6)
        tk.Label(
            row3,
            text="Owner Phone Number *",
            font=(config.FONT_FAMILY, 10, "bold"),
            fg=config.THEME_TEXT,
            bg=config.THEME_CARD_BG
        ).pack(anchor="w")

        self.phone_var = tk.StringVar()
        self.phone_entry = ttk.Entry(row3, textvariable=self.phone_var, font=(config.FONT_FAMILY, 10))
        self.phone_entry.pack(fill="x", pady=(2, 0), ipady=3)

        # Owner Email
        row4 = tk.Frame(left_card, bg=config.THEME_CARD_BG)
        row4.pack(fill="x", pady=6)
        tk.Label(
            row4,
            text="Owner Email Address (Optional)",
            font=(config.FONT_FAMILY, 10, "bold"),
            fg=config.THEME_TEXT,
            bg=config.THEME_CARD_BG
        ).pack(anchor="w")

        self.email_var = tk.StringVar()
        self.email_entry = ttk.Entry(row4, textvariable=self.email_var, font=(config.FONT_FAMILY, 10))
        self.email_entry.pack(fill="x", pady=(2, 0), ipady=3)

        # Parking Lot Preference
        row5 = tk.Frame(left_card, bg=config.THEME_CARD_BG)
        row5.pack(fill="x", pady=6)
        tk.Label(
            row5,
            text="Select Parking Lot",
            font=(config.FONT_FAMILY, 10, "bold"),
            fg=config.THEME_TEXT,
            bg=config.THEME_CARD_BG
        ).pack(anchor="w")

        self.lot_var = tk.StringVar()
        self.lot_combo = ttk.Combobox(row5, textvariable=self.lot_var, state="readonly", font=(config.FONT_FAMILY, 10))
        self.lot_combo.pack(fill="x", pady=(2, 0), ipady=3)

        # Action Buttons
        btn_row = tk.Frame(left_card, bg=config.THEME_CARD_BG)
        btn_row.pack(fill="x", pady=(18, 0))

        self.submit_btn = tk.Button(
            btn_row,
            text="⚡ Auto-Allocate Slot & Generate Ticket",
            font=(config.FONT_FAMILY, 10, "bold"),
            bg=config.THEME_ACCENT,
            fg="#ffffff",
            activebackground=config.THEME_ACCENT_HOVER,
            activeforeground="#ffffff",
            bd=0,
            cursor="hand2",
            padx=12,
            pady=8,
            command=self.handle_check_in
        )
        self.submit_btn.pack(side="left", fill="x", expand=True, padx=(0, 6))

        clear_btn = tk.Button(
            btn_row,
            text="Clear Form",
            font=(config.FONT_FAMILY, 10),
            bg="#f1f5f9",
            fg=config.THEME_TEXT,
            relief="solid",
            bd=1,
            cursor="hand2",
            padx=12,
            pady=8,
            command=self.clear_form
        )
        clear_btn.pack(side="left", padx=(6, 0))

        # -------------------------------------------------------------
        # Right Panel: Ticket Preview & Print Summary
        # -------------------------------------------------------------
        right_card = tk.LabelFrame(
            content_frame,
            text=" 🎫 Entry Ticket & Allocation Summary ",
            font=(config.FONT_FAMILY, 11, "bold"),
            fg=config.THEME_TEXT,
            bg=config.THEME_CARD_BG,
            padx=15,
            pady=15
        )
        right_card.pack(side="right", fill="both", expand=True, padx=(10, 0))

        # Styled Ticket Box
        self.ticket_box = tk.Frame(right_card, bg="#f8fafc", bd=1, relief="solid")
        self.ticket_box.pack(fill="both", expand=True, pady=(0, 10))

        self.ticket_text = tk.Text(
            self.ticket_box,
            wrap="word",
            font=("Consolas", 10),
            bg="#ffffff",
            fg=config.THEME_TEXT,
            bd=0,
            padx=15,
            pady=15
        )
        self.ticket_text.pack(fill="both", expand=True)

        # Ticket action buttons
        ticket_actions = tk.Frame(right_card, bg=config.THEME_CARD_BG)
        ticket_actions.pack(fill="x")

        self.print_btn = tk.Button(
            ticket_actions,
            text="Save / Print Ticket (.txt)",
            font=(config.FONT_FAMILY, 9, "bold"),
            bg=config.THEME_SUCCESS,
            fg="#ffffff",
            bd=0,
            cursor="hand2",
            padx=10,
            pady=6,
            state="disabled",
            command=self.save_ticket_to_file
        )
        self.print_btn.pack(side="left", fill="x", expand=True)

        self.show_ticket_placeholder()

    def load_lots(self):
        """Populate lot combo options."""
        try:
            lots = db.get_all_lots()
            self.lot_map = {"Any Available Lot": None}
            lot_names = ["Any Available Lot"]
            for lot in lots:
                name = f"{lot['lot_name']} ({lot['location']})"
                self.lot_map[name] = lot["lot_id"]
                lot_names.append(name)

            self.lot_combo["values"] = lot_names
            if lot_names:
                self.lot_combo.current(0)
        except Exception as e:
            messagebox.showerror("Error", f"Failed to load parking lots: {str(e)}", parent=self)

    def check_existing_vehicle(self):
        """If plate is known, auto-fill owner details."""
        plate = self.plate_var.get().strip().upper()
        if not plate:
            return

        # Check if already parked
        active = db.check_vehicle_already_parked(plate)
        if active:
            messagebox.showwarning(
                "Already Parked",
                f"Vehicle '{plate}' is currently parked in Slot {active['slot_number']} at {active['lot_name']}!\nEntry Time: {active['entry_time']}",
                parent=self
            )
            return

        veh = db.find_vehicle_by_plate(plate)
        if veh:
            self.type_var.set(veh["vehicle_type"])
            self.name_var.set(veh["owner_name"])
            self.phone_var.set(veh["owner_phone"])
            if veh.get("owner_email"):
                self.email_var.set(veh["owner_email"])

    def show_ticket_placeholder(self):
        self.ticket_text.config(state="normal")
        self.ticket_text.delete("1.0", "end")
        placeholder = (
            "====================================================\n"
            "            SMART PARKING ENTRY TICKET              \n"
            "====================================================\n\n"
            "  No ticket generated yet.\n\n"
            "  Fill out the vehicle and owner information on the\n"
            "  left and click 'Auto-Allocate Slot' to generate\n"
            "  a live parking ticket and reserve an available slot.\n\n"
            "----------------------------------------------------\n"
            "  * Auto-allocates closest matching slot by type.\n"
            "  * Sets slot status to 'Occupied' automatically\n"
            "    via MySQL BEFORE/AFTER INSERT Trigger.\n"
            "====================================================\n"
        )
        self.ticket_text.insert("end", placeholder)
        self.ticket_text.config(state="disabled")
        self.print_btn.config(state="disabled")

    def handle_check_in(self):
        plate = self.plate_var.get().strip().upper()
        vtype = self.type_var.get()
        name = self.name_var.get().strip()
        phone = self.phone_var.get().strip()
        email = self.email_var.get().strip()
        selected_lot = self.lot_var.get()
        lot_id = self.lot_map.get(selected_lot)

        # Input validations
        if not plate:
            messagebox.showwarning("Validation Error", "Please enter the vehicle's license plate number.", parent=self)
            self.plate_entry.focus()
            return

        if len(plate) < 4:
            messagebox.showwarning("Validation Error", "Plate number must be at least 4 characters long.", parent=self)
            return

        if not name:
            messagebox.showwarning("Validation Error", "Please enter the vehicle owner's name.", parent=self)
            self.name_entry.focus()
            return

        if not phone:
            messagebox.showwarning("Validation Error", "Please enter a contact phone number.", parent=self)
            self.phone_entry.focus()
            return

        try:
            ticket = db.register_vehicle_entry(
                plate_number=plate,
                vehicle_type=vtype,
                owner_name=name,
                owner_phone=phone,
                owner_email=email if email else None,
                lot_id=lot_id
            )

            self.last_ticket_data = ticket
            self.render_ticket(ticket)
            self.print_btn.config(state="normal")

            messagebox.showinfo(
                "Entry Successful",
                f"Vehicle {plate} successfully checked in!\n\n"
                f"Allocated Slot: {ticket['slot_number']} ({ticket['lot_name']})\n"
                f"Ticket ID: #{ticket['record_id']}\n"
                f"Rate: ₹ {ticket['rate_per_hour']:.2f}/hr",
                parent=self
            )

            if self.on_entry_completed:
                self.on_entry_completed()

        except ValueError as ve:
            messagebox.showerror("Allocation Failed", str(ve), parent=self)
        except Exception as e:
            messagebox.showerror("Database Error", f"Failed to register vehicle entry:\n{str(e)}", parent=self)

    def render_ticket(self, t):
        self.ticket_text.config(state="normal")
        self.ticket_text.delete("1.0", "end")

        content = (
            "====================================================\n"
            "            SMART PARKING ENTRY TICKET              \n"
            "====================================================\n"
            f"  TICKET NUMBER : #{t['record_id']:06d}\n"
            f"  DATE & TIME   : {t['entry_time']}\n"
            "----------------------------------------------------\n"
            f"  VEHICLE PLATE : {t['plate_number']}\n"
            f"  VEHICLE TYPE  : {t['vehicle_type']}\n"
            f"  OWNER NAME    : {t['owner_name']}\n"
            f"  CONTACT PHONE : {t['owner_phone']}\n"
            "----------------------------------------------------\n"
            f"  PARKING LOT   : {t['lot_name']}\n"
            f"  ALLOCATED SLOT: >>> {t['slot_number']} <<<\n"
            f"  HOURLY RATE   : ₹ {t['rate_per_hour']:.2f} / hour\n"
            "====================================================\n"
            "  ||||| ||| |||||| |||||||| |||||| ||| ||||||| |||  \n"
            f"  BARCODE: *PRK-{t['record_id']:06d}-{t['plate_number']}*\n"
            "====================================================\n"
            "  Please retain this ticket for payment at exit gate.\n"
            "  Slot status set to 'Occupied' via Database Trigger.\n"
            "====================================================\n"
        )
        self.ticket_text.insert("end", content)
        self.ticket_text.config(state="disabled")

    def save_ticket_to_file(self):
        if not self.last_ticket_data:
            return

        default_filename = f"ParkingTicket_{self.last_ticket_data['record_id']}_{self.last_ticket_data['plate_number']}.txt"
        file_path = filedialog.asksaveasfilename(
            parent=self,
            defaultextension=".txt",
            initialfile=default_filename,
            filetypes=[("Text Files", "*.txt"), ("All Files", "*.*")]
        )
        if file_path:
            try:
                ticket_text = self.ticket_text.get("1.0", "end")
                with open(file_path, "w", encoding="utf-8") as f:
                    f.write(ticket_text)
                messagebox.showinfo("Saved", f"Ticket successfully saved to:\n{file_path}", parent=self)
            except Exception as e:
                messagebox.showerror("Save Error", f"Could not save ticket file: {str(e)}", parent=self)

    def clear_form(self):
        self.plate_var.set("")
        self.type_var.set("Car")
        self.name_var.set("")
        self.phone_var.set("")
        self.email_var.set("")
        self.show_ticket_placeholder()
        self.last_ticket_data = None
