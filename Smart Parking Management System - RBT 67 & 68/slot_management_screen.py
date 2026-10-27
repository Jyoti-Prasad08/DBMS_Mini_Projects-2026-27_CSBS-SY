"""
Slot Management Screen for Smart Parking Management System.
Features interactive color-coded visual slot grid and management controls.
Admin-only permissions for Add, Edit, and Delete actions.
"""

import tkinter as tk
from tkinter import ttk, messagebox
import config
from auth import UserSession
import db


class SlotManagementScreen(ttk.Frame):
    """Slot viewing grid, status filtering, and CRUD operations."""

    def __init__(self, parent, on_slot_updated=None):
        super().__init__(parent)
        self.on_slot_updated = on_slot_updated
        self.selected_slot_data = None
        self.create_widgets()
        self.load_lots_filter()
        self.refresh()

    def create_widgets(self):
        title_bar = tk.Frame(self, bg=config.THEME_BG)
        title_bar.pack(fill="x", padx=20, pady=(15, 10))

        title_lbl = tk.Label(
            title_bar,
            text="Parking Slot Management & Visual Grid",
            font=(config.FONT_FAMILY, 16, "bold"),
            fg=config.THEME_TEXT,
            bg=config.THEME_BG
        )
        title_lbl.pack(side="left")

        # Role indicator tag
        self.role_badge = tk.Label(
            title_bar,
            text="Admin Mode",
            font=(config.FONT_FAMILY, 9, "bold"),
            fg="#ffffff",
            bg=config.THEME_ACCENT,
            padx=10,
            pady=3
        )
        self.role_badge.pack(side="right")

        # -------------------------------------------------------------
        # Filter & Legend Bar
        # -------------------------------------------------------------
        filter_card = tk.Frame(self, bg=config.THEME_CARD_BG, bd=1, relief="solid", padx=12, pady=10)
        filter_card.pack(fill="x", padx=20, pady=(0, 10))

        # Filters
        tk.Label(filter_card, text="Lot:", font=(config.FONT_FAMILY, 9, "bold"), bg=config.THEME_CARD_BG).pack(side="left", padx=(0, 4))
        self.lot_filter_var = tk.StringVar(value="All Lots")
        self.lot_combo = ttk.Combobox(filter_card, textvariable=self.lot_filter_var, state="readonly", width=18)
        self.lot_combo.pack(side="left", padx=(0, 15))
        self.lot_combo.bind("<<ComboboxSelected>>", lambda e: self.refresh())

        tk.Label(filter_card, text="Status:", font=(config.FONT_FAMILY, 9, "bold"), bg=config.THEME_CARD_BG).pack(side="left", padx=(0, 4))
        self.status_filter_var = tk.StringVar(value="All")
        self.status_combo = ttk.Combobox(filter_card, textvariable=self.status_filter_var, state="readonly", width=12)
        self.status_combo["values"] = ("All", "Available", "Occupied", "Reserved", "Maintenance")
        self.status_combo.pack(side="left", padx=(0, 15))
        self.status_combo.bind("<<ComboboxSelected>>", lambda e: self.refresh())

        tk.Label(filter_card, text="Type:", font=(config.FONT_FAMILY, 9, "bold"), bg=config.THEME_CARD_BG).pack(side="left", padx=(0, 4))
        self.type_filter_var = tk.StringVar(value="All")
        self.type_combo = ttk.Combobox(filter_card, textvariable=self.type_filter_var, state="readonly", width=10)
        self.type_combo["values"] = ("All", "Bike", "Car", "Truck")
        self.type_combo.pack(side="left", padx=(0, 15))
        self.type_combo.bind("<<ComboboxSelected>>", lambda e: self.refresh())

        # Legend
        legend_frame = tk.Frame(filter_card, bg=config.THEME_CARD_BG)
        legend_frame.pack(side="right")

        legends = [
            ("Available", config.THEME_SUCCESS),
            ("Occupied", config.THEME_DANGER),
            ("Reserved", config.THEME_WARNING),
            ("Maintenance", config.THEME_MUTED)
        ]
        for name, col in legends:
            dot = tk.Label(legend_frame, text="●", fg=col, bg=config.THEME_CARD_BG, font=(config.FONT_FAMILY, 12))
            dot.pack(side="left", padx=(6, 1))
            txt = tk.Label(legend_frame, text=name, fg=config.THEME_TEXT, bg=config.THEME_CARD_BG, font=(config.FONT_FAMILY, 8, "bold"))
            txt.pack(side="left", padx=(0, 6))

        # -------------------------------------------------------------
        # Main Split Content: Visual Grid (Top) + Detailed Table & Admin Actions (Bottom)
        # -------------------------------------------------------------
        paned = tk.PanedWindow(self, orient="vertical", bg=config.THEME_BG, sashwidth=6)
        paned.pack(fill="both", expand=True, padx=20, pady=(0, 15))

        # 1. Visual Grid Frame
        grid_container = tk.LabelFrame(
            paned,
            text=" 🟢 Visual Slot Map (Click slot tile to select) ",
            font=(config.FONT_FAMILY, 10, "bold"),
            fg=config.THEME_TEXT,
            bg=config.THEME_CARD_BG,
            padx=10,
            pady=8
        )
        paned.add(grid_container, minsize=160)

        # Scrollable Canvas for Grid
        self.grid_canvas = tk.Canvas(grid_container, bg=config.THEME_CARD_BG, highlightthickness=0)
        grid_vscroll = ttk.Scrollbar(grid_container, orient="vertical", command=self.grid_canvas.yview)
        self.grid_inner = tk.Frame(self.grid_canvas, bg=config.THEME_CARD_BG)

        self.grid_inner.bind("<Configure>", lambda e: self.grid_canvas.configure(scrollregion=self.grid_canvas.bbox("all")))
        self.canvas_window = self.grid_canvas.create_window((0, 0), window=self.grid_inner, anchor="nw")
        self.grid_canvas.configure(yscrollcommand=grid_vscroll.set)

        self.grid_canvas.pack(side="left", fill="both", expand=True)
        grid_vscroll.pack(side="right", fill="y")

        # 2. Table & Admin Action Controls
        table_container = tk.LabelFrame(
            paned,
            text=" 📋 Slot Details & Admin Controls ",
            font=(config.FONT_FAMILY, 10, "bold"),
            fg=config.THEME_TEXT,
            bg=config.THEME_CARD_BG,
            padx=10,
            pady=8
        )
        paned.add(table_container, minsize=180)

        # Action Buttons Row
        action_bar = tk.Frame(table_container, bg=config.THEME_CARD_BG)
        action_bar.pack(fill="x", pady=(0, 8))

        self.add_btn = tk.Button(
            action_bar,
            text="➕ Add New Slot",
            font=(config.FONT_FAMILY, 9, "bold"),
            bg=config.THEME_ACCENT,
            fg="#ffffff",
            bd=0,
            cursor="hand2",
            padx=12,
            pady=5,
            command=self.open_add_slot_dialog
        )
        self.add_btn.pack(side="left", padx=(0, 6))

        self.edit_btn = tk.Button(
            action_bar,
            text="✏ Edit Slot",
            font=(config.FONT_FAMILY, 9, "bold"),
            bg="#f1f5f9",
            fg=config.THEME_TEXT,
            relief="solid",
            bd=1,
            cursor="hand2",
            padx=12,
            pady=5,
            state="disabled",
            command=self.open_edit_slot_dialog
        )
        self.edit_btn.pack(side="left", padx=(0, 6))

        self.delete_btn = tk.Button(
            action_bar,
            text="🗑 Delete Slot",
            font=(config.FONT_FAMILY, 9, "bold"),
            bg="#fef2f2",
            fg=config.THEME_DANGER,
            relief="solid",
            bd=1,
            cursor="hand2",
            padx=12,
            pady=5,
            state="disabled",
            command=self.handle_delete_slot
        )
        self.delete_btn.pack(side="left", padx=(0, 6))

        self.maint_btn = tk.Button(
            action_bar,
            text="🔧 Toggle Maintenance",
            font=(config.FONT_FAMILY, 9),
            bg="#f8fafc",
            fg=config.THEME_MUTED,
            relief="solid",
            bd=1,
            cursor="hand2",
            padx=10,
            pady=5,
            state="disabled",
            command=self.handle_toggle_maintenance
        )
        self.maint_btn.pack(side="left", padx=(0, 6))

        self.admin_notice_lbl = tk.Label(
            action_bar,
            text="",
            font=(config.FONT_FAMILY, 8, "italic"),
            fg=config.THEME_SUBTEXT,
            bg=config.THEME_CARD_BG
        )
        self.admin_notice_lbl.pack(side="right")

        # Treeview
        cols = ("slot_id", "slot_num", "lot", "type", "status", "location")
        self.slot_tree = ttk.Treeview(table_container, columns=cols, show="headings", height=6)

        self.slot_tree.heading("slot_id", text="ID")
        self.slot_tree.heading("slot_num", text="Slot Number")
        self.slot_tree.heading("lot", text="Parking Lot")
        self.slot_tree.heading("type", text="Type")
        self.slot_tree.heading("status", text="Status")
        self.slot_tree.heading("location", text="Location")

        self.slot_tree.column("slot_id", width=50, anchor="center")
        self.slot_tree.column("slot_num", width=110, anchor="center")
        self.slot_tree.column("lot", width=180, anchor="w")
        self.slot_tree.column("type", width=80, anchor="center")
        self.slot_tree.column("status", width=100, anchor="center")
        self.slot_tree.column("location", width=200, anchor="w")

        # Treeview tag colors
        self.slot_tree.tag_configure("tag_Available", background="#dcfce7")
        self.slot_tree.tag_configure("tag_Occupied", background="#fee2e2")
        self.slot_tree.tag_configure("tag_Reserved", background="#ffedd5")
        self.slot_tree.tag_configure("tag_Maintenance", background="#f1f5f9")

        table_scroll = ttk.Scrollbar(table_container, orient="vertical", command=self.slot_tree.yview)
        self.slot_tree.configure(yscrollcommand=table_scroll.set)

        self.slot_tree.pack(side="left", fill="both", expand=True)
        table_scroll.pack(side="right", fill="y")

        self.slot_tree.bind("<<TreeviewSelect>>", self.on_slot_selected)

    def load_lots_filter(self):
        try:
            lots = db.get_all_lots()
            self.lots_list = lots
            self.lot_filter_map = {"All Lots": None}
            names = ["All Lots"]
            for l in lots:
                self.lot_filter_map[l["lot_name"]] = l["lot_id"]
                names.append(l["lot_name"])
            self.lot_combo["values"] = names
        except Exception:
            pass

    def refresh(self):
        """Fetch slots from DB and render both the visual grid and the treeview."""
        # Check permissions
        is_admin = UserSession.is_admin()
        if is_admin:
            self.role_badge.config(text="Admin Mode", bg=config.THEME_ACCENT)
            self.add_btn.config(state="normal")
            self.admin_notice_lbl.config(text="Full CRUD rights enabled.")
        else:
            self.role_badge.config(text="Attendant (View Only)", bg=config.THEME_MUTED)
            self.add_btn.config(state="disabled")
            self.edit_btn.config(state="disabled")
            self.delete_btn.config(state="disabled")
            self.maint_btn.config(state="disabled")
            self.admin_notice_lbl.config(text="🔒 Attendants have view-only access to slots.")

        selected_lot_name = self.lot_filter_var.get()
        lot_id = self.lot_filter_map.get(selected_lot_name)
        status = self.status_filter_var.get()
        stype = self.type_filter_var.get()

        try:
            slots = db.get_slots_filtered(lot_id=lot_id, status=status, slot_type=stype)
            self.render_visual_grid(slots)
            self.render_treeview(slots)
            self.selected_slot_data = None
            if not is_admin:
                self.edit_btn.config(state="disabled")
                self.delete_btn.config(state="disabled")
                self.maint_btn.config(state="disabled")
        except Exception as e:
            messagebox.showerror("Error", f"Failed to load slots: {str(e)}", parent=self)

    def render_visual_grid(self, slots):
        """Renders color-coded card tiles in rows for each slot."""
        for child in self.grid_inner.winfo_children():
            child.destroy()

        if not slots:
            tk.Label(
                self.grid_inner,
                text="No slots match the current filter criteria.",
                font=(config.FONT_FAMILY, 10, "italic"),
                fg=config.THEME_SUBTEXT,
                bg=config.THEME_CARD_BG,
                pady=20
            ).pack()
            return

        status_colors = {
            "Available": (config.THEME_SUCCESS, "#f0fdf4"),
            "Occupied": (config.THEME_DANGER, "#fef2f2"),
            "Reserved": (config.THEME_WARNING, "#fff7ed"),
            "Maintenance": (config.THEME_MUTED, "#f8fafc")
        }

        # Render slots in a grid (max 8 columns per row)
        cols_per_row = 8
        for i, slot in enumerate(slots):
            r = i // cols_per_row
            c = i % cols_per_row

            border_col, bg_col = status_colors.get(slot["status"], (config.THEME_MUTED, "#ffffff"))

            tile = tk.Frame(
                self.grid_inner,
                bg=bg_col,
                highlightbackground=border_col,
                highlightthickness=2,
                padx=8,
                pady=6,
                cursor="hand2"
            )
            tile.grid(row=r, column=c, padx=5, pady=5, sticky="nsew")

            num_lbl = tk.Label(
                tile,
                text=slot["slot_number"],
                font=(config.FONT_FAMILY, 10, "bold"),
                fg=border_col,
                bg=bg_col
            )
            num_lbl.pack()

            type_lbl = tk.Label(
                tile,
                text=f"{slot['slot_type']}",
                font=(config.FONT_FAMILY, 7),
                fg=config.THEME_SUBTEXT,
                bg=bg_col
            )
            type_lbl.pack()

            stat_lbl = tk.Label(
                tile,
                text=slot["status"],
                font=(config.FONT_FAMILY, 7, "bold"),
                fg=border_col,
                bg=bg_col
            )
            stat_lbl.pack(pady=(2, 0))

            # Bind click
            for w in (tile, num_lbl, type_lbl, stat_lbl):
                w.bind("<Button-1>", lambda e, s=slot: self.select_slot_from_tile(s))

    def render_treeview(self, slots):
        for item in self.slot_tree.get_children():
            self.slot_tree.delete(item)

        for s in slots:
            tag = f"tag_{s['status']}"
            self.slot_tree.insert("", "end", iid=str(s["slot_id"]), values=(
                s["slot_id"],
                s["slot_number"],
                s["lot_name"],
                s["slot_type"],
                s["status"],
                s["location"]
            ), tags=(tag,))

    def select_slot_from_tile(self, slot):
        slot_id = str(slot["slot_id"])
        if self.slot_tree.exists(slot_id):
            self.slot_tree.selection_set(slot_id)
            self.slot_tree.see(slot_id)
        self.selected_slot_data = slot
        self.update_action_button_states()

    def on_slot_selected(self, event):
        selected = self.slot_tree.selection()
        if not selected:
            self.selected_slot_data = None
            self.update_action_button_states()
            return

        slot_id = int(selected[0])
        matching = [s for s in db.get_slots_filtered() if s["slot_id"] == slot_id]
        if matching:
            self.selected_slot_data = matching[0]
        self.update_action_button_states()

    def update_action_button_states(self):
        if not UserSession.is_admin():
            self.edit_btn.config(state="disabled")
            self.delete_btn.config(state="disabled")
            self.maint_btn.config(state="disabled")
            return

        if self.selected_slot_data:
            self.edit_btn.config(state="normal")
            self.delete_btn.config(state="normal")
            self.maint_btn.config(state="normal")
        else:
            self.edit_btn.config(state="disabled")
            self.delete_btn.config(state="disabled")
            self.maint_btn.config(state="disabled")

    def open_add_slot_dialog(self):
        """Modal dialog to add a new slot (Admin only)."""
        dlg = tk.Toplevel(self)
        dlg.title("Add New Parking Slot")
        dlg.geometry("380x380")
        dlg.resizable(False, False)
        dlg.configure(bg=config.THEME_BG)
        dlg.transient(self)
        dlg.grab_set()

        content = tk.Frame(dlg, bg=config.THEME_BG, padx=25, pady=20)
        content.pack(fill="both", expand=True)

        tk.Label(content, text="Add New Parking Slot", font=(config.FONT_FAMILY, 12, "bold"), bg=config.THEME_BG).pack(anchor="w", pady=(0, 15))

        # Lot
        tk.Label(content, text="Parking Lot *", font=(config.FONT_FAMILY, 9, "bold"), bg=config.THEME_BG).pack(anchor="w")
        lot_var = tk.StringVar()
        lot_cb = ttk.Combobox(content, textvariable=lot_var, state="readonly")
        lots = db.get_all_lots()
        lot_map = {l["lot_name"]: l["lot_id"] for l in lots}
        lot_cb["values"] = list(lot_map.keys())
        if lots:
            lot_cb.current(0)
        lot_cb.pack(fill="x", pady=(2, 10))

        # Slot Number
        tk.Label(content, text="Slot Number * (e.g. A-C06)", font=(config.FONT_FAMILY, 9, "bold"), bg=config.THEME_BG).pack(anchor="w")
        slot_num_var = tk.StringVar()
        slot_entry = ttk.Entry(content, textvariable=slot_num_var)
        slot_entry.pack(fill="x", pady=(2, 10))
        slot_entry.focus()

        # Slot Type
        tk.Label(content, text="Vehicle Type *", font=(config.FONT_FAMILY, 9, "bold"), bg=config.THEME_BG).pack(anchor="w")
        type_var = tk.StringVar(value="Car")
        type_cb = ttk.Combobox(content, textvariable=type_var, state="readonly", values=("Car", "Bike", "Truck"))
        type_cb.pack(fill="x", pady=(2, 10))

        # Initial Status
        tk.Label(content, text="Initial Status *", font=(config.FONT_FAMILY, 9, "bold"), bg=config.THEME_BG).pack(anchor="w")
        status_var = tk.StringVar(value="Available")
        status_cb = ttk.Combobox(content, textvariable=status_var, state="readonly", values=("Available", "Maintenance"))
        status_cb.pack(fill="x", pady=(2, 18))

        def save():
            selected_lot = lot_var.get()
            lot_id = lot_map.get(selected_lot)
            slot_num = slot_num_var.get().strip().upper()
            stype = type_var.get()
            stat = status_var.get()

            if not slot_num:
                messagebox.showwarning("Input Error", "Please provide a slot number.", parent=dlg)
                return

            try:
                db.add_parking_slot(lot_id=lot_id, slot_number=slot_num, slot_type=stype, status=stat)
                messagebox.showinfo("Success", f"Slot {slot_num} added successfully!", parent=dlg)
                dlg.destroy()
                self.refresh()
                if self.on_slot_updated:
                    self.on_slot_updated()
            except Exception as e:
                messagebox.showerror("Error", str(e), parent=dlg)

        save_btn = tk.Button(content, text="Save Slot", font=(config.FONT_FAMILY, 10, "bold"), bg=config.THEME_ACCENT, fg="#fff", bd=0, pady=6, command=save)
        save_btn.pack(fill="x")

    def open_edit_slot_dialog(self):
        """Modal dialog to edit existing slot (Admin only)."""
        if not self.selected_slot_data:
            return

        s = self.selected_slot_data
        dlg = tk.Toplevel(self)
        dlg.title(f"Edit Slot {s['slot_number']}")
        dlg.geometry("380x340")
        dlg.resizable(False, False)
        dlg.configure(bg=config.THEME_BG)
        dlg.transient(self)
        dlg.grab_set()

        content = tk.Frame(dlg, bg=config.THEME_BG, padx=25, pady=20)
        content.pack(fill="both", expand=True)

        tk.Label(content, text=f"Edit Slot: {s['slot_number']}", font=(config.FONT_FAMILY, 12, "bold"), bg=config.THEME_BG).pack(anchor="w", pady=(0, 15))

        tk.Label(content, text="Slot Number *", font=(config.FONT_FAMILY, 9, "bold"), bg=config.THEME_BG).pack(anchor="w")
        slot_num_var = tk.StringVar(value=s["slot_number"])
        slot_entry = ttk.Entry(content, textvariable=slot_num_var)
        slot_entry.pack(fill="x", pady=(2, 10))

        tk.Label(content, text="Slot Type *", font=(config.FONT_FAMILY, 9, "bold"), bg=config.THEME_BG).pack(anchor="w")
        type_var = tk.StringVar(value=s["slot_type"])
        type_cb = ttk.Combobox(content, textvariable=type_var, state="readonly", values=("Car", "Bike", "Truck"))
        type_cb.pack(fill="x", pady=(2, 10))

        tk.Label(content, text="Status *", font=(config.FONT_FAMILY, 9, "bold"), bg=config.THEME_BG).pack(anchor="w")
        status_var = tk.StringVar(value=s["status"])
        status_cb = ttk.Combobox(content, textvariable=status_var, state="readonly", values=("Available", "Occupied", "Reserved", "Maintenance"))
        status_cb.pack(fill="x", pady=(2, 18))

        def save():
            new_num = slot_num_var.get().strip().upper()
            new_type = type_var.get()
            new_stat = status_var.get()

            if not new_num:
                messagebox.showwarning("Input Error", "Slot number cannot be empty.", parent=dlg)
                return

            try:
                db.update_parking_slot(slot_id=s["slot_id"], slot_number=new_num, slot_type=new_type, status=new_stat)
                messagebox.showinfo("Success", "Slot updated successfully!", parent=dlg)
                dlg.destroy()
                self.refresh()
                if self.on_slot_updated:
                    self.on_slot_updated()
            except Exception as e:
                messagebox.showerror("Update Error", str(e), parent=dlg)

        save_btn = tk.Button(content, text="Update Slot", font=(config.FONT_FAMILY, 10, "bold"), bg=config.THEME_ACCENT, fg="#fff", bd=0, pady=6, command=save)
        save_btn.pack(fill="x")

    def handle_delete_slot(self):
        if not self.selected_slot_data:
            return

        s = self.selected_slot_data
        confirm = messagebox.askyesno(
            "Confirm Slot Deletion",
            f"Are you sure you want to permanently delete slot '{s['slot_number']}' from {s['lot_name']}?\n\n"
            "This will also reduce the lot's capacity by 1.",
            parent=self
        )
        if not confirm:
            return

        try:
            db.delete_parking_slot(s["slot_id"])
            messagebox.showinfo("Deleted", f"Slot '{s['slot_number']}' was deleted successfully.", parent=self)
            self.refresh()
            if self.on_slot_updated:
                self.on_slot_updated()
        except Exception as e:
            messagebox.showerror("Delete Failed", str(e), parent=self)

    def handle_toggle_maintenance(self):
        if not self.selected_slot_data:
            return

        s = self.selected_slot_data
        if s["status"] == "Occupied":
            messagebox.showwarning("Action Denied", "Cannot toggle maintenance on an Occupied slot!", parent=self)
            return

        new_status = "Available" if s["status"] == "Maintenance" else "Maintenance"
        try:
            db.update_parking_slot(s["slot_id"], s["slot_number"], s["slot_type"], new_status)
            self.refresh()
            if self.on_slot_updated:
                self.on_slot_updated()
        except Exception as e:
            messagebox.showerror("Error", str(e), parent=self)

