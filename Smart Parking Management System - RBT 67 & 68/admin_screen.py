"""
Admin Management Screen for Smart Parking Management System.
Allows administrators to manage pricing rates, manage system users, and perform DB utilities.
Strictly role-protected for 'admin' users only.
"""

import tkinter as tk
from tkinter import ttk, messagebox
import config
from auth import UserSession
import db


class AdminScreen(ttk.Frame):
    """Admin configuration: Pricing, User Accounts, and Maintenance."""

    def __init__(self, parent, on_config_changed=None):
        super().__init__(parent)
        self.on_config_changed = on_config_changed
        self.create_widgets()
        self.refresh()

    def create_widgets(self):
        title_bar = tk.Frame(self, bg=config.THEME_BG)
        title_bar.pack(fill="x", padx=20, pady=(15, 10))

        title_lbl = tk.Label(
            title_bar,
            text="Administrator Control Panel",
            font=(config.FONT_FAMILY, 16, "bold"),
            fg=config.THEME_TEXT,
            bg=config.THEME_BG
        )
        title_lbl.pack(side="left")

        # Container for content
        self.main_container = tk.Frame(self, bg=config.THEME_BG)
        self.main_container.pack(fill="both", expand=True, padx=20, pady=(0, 15))

        # Access restriction warning (shown when attendant tries to access)
        self.restricted_banner = tk.Frame(self.main_container, bg="#fee2e2", bd=1, relief="solid", padx=20, pady=25)
        tk.Label(
            self.restricted_banner,
            text="🔒 Access Restricted",
            font=(config.FONT_FAMILY, 14, "bold"),
            fg=config.THEME_DANGER,
            bg="#fee2e2"
        ).pack(pady=(0, 6))

        tk.Label(
            self.restricted_banner,
            text="You are currently logged in as an Attendant.\n"
                 "Managing pricing, user accounts, and system database settings requires an Administrator account.\n\n"
                 "Please log in with an Admin account (e.g. admin / admin123) to access these settings.",
            font=(config.FONT_FAMILY, 10),
            fg="#991b1b",
            bg="#fee2e2",
            justify="center"
        ).pack()

        # Admin content frame (holds actual admin controls)
        self.admin_content = tk.Frame(self.main_container, bg=config.THEME_BG)

        # Split: Left = Pricing Management, Right = User Accounts
        split_frame = tk.Frame(self.admin_content, bg=config.THEME_BG)
        split_frame.pack(fill="both", expand=True)

        # -------------------------------------------------------------
        # 1. Pricing Management Card
        # -------------------------------------------------------------
        pricing_card = tk.LabelFrame(
            split_frame,
            text=" 🏷 Parking Hourly Rates (pricing table) ",
            font=(config.FONT_FAMILY, 11, "bold"),
            fg=config.THEME_TEXT,
            bg=config.THEME_CARD_BG,
            padx=15,
            pady=12
        )
        pricing_card.pack(side="left", fill="both", expand=True, padx=(0, 10))

        # Pricing Table
        cols_p = ("vtype", "rate", "updated")
        self.pricing_tree = ttk.Treeview(pricing_card, columns=cols_p, show="headings", height=4)
        self.pricing_tree.heading("vtype", text="Vehicle Type")
        self.pricing_tree.heading("rate", text="Rate per Hour")
        self.pricing_tree.heading("updated", text="Last Updated")

        self.pricing_tree.column("vtype", width=90, anchor="center")
        self.pricing_tree.column("rate", width=100, anchor="e")
        self.pricing_tree.column("updated", width=130, anchor="center")
        self.pricing_tree.pack(fill="x", pady=(0, 12))
        self.pricing_tree.bind("<<TreeviewSelect>>", self.on_pricing_selected)

        # Pricing Update Form
        pform = tk.Frame(pricing_card, bg="#f8fafc", bd=1, relief="solid", padx=12, pady=10)
        pform.pack(fill="x")

        tk.Label(pform, text="Update Hourly Rate", font=(config.FONT_FAMILY, 9, "bold"), bg="#f8fafc").pack(anchor="w", pady=(0, 6))

        prow = tk.Frame(pform, bg="#f8fafc")
        prow.pack(fill="x", pady=4)

        tk.Label(prow, text="Type:", font=(config.FONT_FAMILY, 9), bg="#f8fafc").pack(side="left")
        self.rate_vtype_var = tk.StringVar(value="Car")
        self.rate_vtype_cb = ttk.Combobox(prow, textvariable=self.rate_vtype_var, state="readonly", width=8, values=("Bike", "Car", "Truck"))
        self.rate_vtype_cb.pack(side="left", padx=(4, 15))

        tk.Label(prow, text="New Rate (₹):", font=(config.FONT_FAMILY, 9), bg="#f8fafc").pack(side="left")
        self.new_rate_var = tk.StringVar()
        self.new_rate_entry = ttk.Entry(prow, textvariable=self.new_rate_var, width=10)
        self.new_rate_entry.pack(side="left", padx=(4, 0))

        update_rate_btn = tk.Button(
            pform,
            text="✓ Save Rate Changes",
            font=(config.FONT_FAMILY, 9, "bold"),
            bg=config.THEME_ACCENT,
            fg="#ffffff",
            bd=0,
            cursor="hand2",
            padx=10,
            pady=5,
            command=self.handle_update_rate
        )
        update_rate_btn.pack(fill="x", pady=(8, 0))

        # DB Utilities box at bottom of pricing card
        util_box = tk.LabelFrame(
            pricing_card,
            text=" 🛠 Database Maintenance ",
            font=(config.FONT_FAMILY, 9, "bold"),
            fg=config.THEME_TEXT,
            bg=config.THEME_CARD_BG,
            padx=10,
            pady=10
        )
        util_box.pack(fill="x", pady=(15, 0))

        reseed_btn = tk.Button(
            util_box,
            text="⚠ Reset & Re-Seed Database (schema.sql)",
            font=(config.FONT_FAMILY, 9, "bold"),
            bg="#fef2f2",
            fg=config.THEME_DANGER,
            relief="solid",
            bd=1,
            cursor="hand2",
            padx=10,
            pady=6,
            command=self.handle_reseed_db
        )
        reseed_btn.pack(fill="x")

        # -------------------------------------------------------------
        # 2. User Accounts Management Card
        # -------------------------------------------------------------
        user_card = tk.LabelFrame(
            split_frame,
            text=" 👤 User Accounts & Role Permissions ",
            font=(config.FONT_FAMILY, 11, "bold"),
            fg=config.THEME_TEXT,
            bg=config.THEME_CARD_BG,
            padx=15,
            pady=12
        )
        user_card.pack(side="right", fill="both", expand=True, padx=(10, 0))

        # Users Table
        cols_u = ("uid", "username", "fullname", "role", "created")
        self.user_tree = ttk.Treeview(user_card, columns=cols_u, show="headings", height=5)
        self.user_tree.heading("uid", text="ID")
        self.user_tree.heading("username", text="Username")
        self.user_tree.heading("fullname", text="Full Name")
        self.user_tree.heading("role", text="Role")
        self.user_tree.heading("created", text="Created")

        self.user_tree.column("uid", width=40, anchor="center")
        self.user_tree.column("username", width=100, anchor="w")
        self.user_tree.column("fullname", width=140, anchor="w")
        self.user_tree.column("role", width=80, anchor="center")
        self.user_tree.column("created", width=120, anchor="center")

        self.user_tree.pack(fill="x", pady=(0, 8))

        # Action bar for selected user
        uaction_bar = tk.Frame(user_card, bg=config.THEME_CARD_BG)
        uaction_bar.pack(fill="x", pady=(0, 10))

        del_user_btn = tk.Button(
            uaction_bar,
            text="🗑 Delete User",
            font=(config.FONT_FAMILY, 8, "bold"),
            bg="#fef2f2",
            fg=config.THEME_DANGER,
            relief="solid",
            bd=1,
            cursor="hand2",
            padx=8,
            pady=3,
            command=self.handle_delete_user
        )
        del_user_btn.pack(side="left", padx=(0, 6))

        reset_pwd_btn = tk.Button(
            uaction_bar,
            text="🔑 Reset Password",
            font=(config.FONT_FAMILY, 8),
            bg="#f1f5f9",
            relief="solid",
            bd=1,
            cursor="hand2",
            padx=8,
            pady=3,
            command=self.handle_reset_password
        )
        reset_pwd_btn.pack(side="left")

        # Create New User Form
        create_user_box = tk.LabelFrame(
            user_card,
            text=" ➕ Create New System User ",
            font=(config.FONT_FAMILY, 9, "bold"),
            fg=config.THEME_TEXT,
            bg="#f8fafc",
            padx=12,
            pady=10
        )
        create_user_box.pack(fill="x")

        # Username & Role row
        r1 = tk.Frame(create_user_box, bg="#f8fafc")
        r1.pack(fill="x", pady=2)
        tk.Label(r1, text="Username *", font=(config.FONT_FAMILY, 8, "bold"), bg="#f8fafc").pack(side="left")
        self.new_username_var = tk.StringVar()
        ttk.Entry(r1, textvariable=self.new_username_var, width=14).pack(side="left", padx=(4, 15))

        tk.Label(r1, text="Role *", font=(config.FONT_FAMILY, 8, "bold"), bg="#f8fafc").pack(side="left")
        self.new_role_var = tk.StringVar(value="attendant")
        ttk.Combobox(r1, textvariable=self.new_role_var, state="readonly", width=10, values=("admin", "attendant")).pack(side="left", padx=(4, 0))

        # Full Name row
        r2 = tk.Frame(create_user_box, bg="#f8fafc")
        r2.pack(fill="x", pady=4)
        tk.Label(r2, text="Full Name *", font=(config.FONT_FAMILY, 8, "bold"), bg="#f8fafc").pack(side="left")
        self.new_fullname_var = tk.StringVar()
        ttk.Entry(r2, textvariable=self.new_fullname_var, width=28).pack(side="left", padx=(6, 0))

        # Password row
        r3 = tk.Frame(create_user_box, bg="#f8fafc")
        r3.pack(fill="x", pady=4)
        tk.Label(r3, text="Password *", font=(config.FONT_FAMILY, 8, "bold"), bg="#f8fafc").pack(side="left")
        self.new_password_var = tk.StringVar()
        ttk.Entry(r3, textvariable=self.new_password_var, show="•", width=20).pack(side="left", padx=(7, 0))

        add_user_btn = tk.Button(
            create_user_box,
            text="✓ Add User (Hashed with SHA-256)",
            font=(config.FONT_FAMILY, 9, "bold"),
            bg=config.THEME_ACCENT,
            fg="#ffffff",
            bd=0,
            cursor="hand2",
            padx=10,
            pady=6,
            command=self.handle_create_user
        )
        add_user_btn.pack(fill="x", pady=(8, 0))

    def refresh(self):
        """Toggle restricted view vs full admin panel depending on user role."""
        if not UserSession.is_admin():
            self.admin_content.pack_forget()
            self.restricted_banner.pack(fill="both", expand=True, pady=40)
            return

        self.restricted_banner.pack_forget()
        self.admin_content.pack(fill="both", expand=True)

        self.refresh_pricing()
        self.refresh_users()

    def refresh_pricing(self):
        try:
            for item in self.pricing_tree.get_children():
                self.pricing_tree.delete(item)

            rates = db.get_pricing_rates()
            for r in rates:
                up_str = r["updated_at"].strftime("%Y-%m-%d %H:%M") if r.get("updated_at") else "-"
                self.pricing_tree.insert("", "end", values=(
                    r["vehicle_type"],
                    f"₹ {float(r['rate_per_hour']):.2f}",
                    up_str
                ))
        except Exception as e:
            messagebox.showerror("Error", f"Could not load pricing rates: {str(e)}", parent=self)

    def on_pricing_selected(self, event):
        sel = self.pricing_tree.selection()
        if not sel:
            return
        vals = self.pricing_tree.item(sel[0], "values")
        if vals:
            self.rate_vtype_var.set(vals[0])
            cleaned_rate = vals[1].replace("₹", "").strip()
            self.new_rate_var.set(cleaned_rate)

    def handle_update_rate(self):
        vtype = self.rate_vtype_var.get()
        rate_str = self.new_rate_var.get().strip()

        try:
            rate = float(rate_str)
            if rate < 0:
                messagebox.showerror("Validation", "Hourly rate must be non-negative.", parent=self)
                return
        except ValueError:
            messagebox.showerror("Validation", "Please enter a valid numeric rate.", parent=self)
            return

        try:
            db.update_pricing_rate(vtype, rate)
            messagebox.showinfo("Success", f"Hourly rate for {vtype} updated to ₹ {rate:.2f}!", parent=self)
            self.refresh_pricing()
            if self.on_config_changed:
                self.on_config_changed()
        except Exception as e:
            messagebox.showerror("Update Error", str(e), parent=self)

    def refresh_users(self):
        try:
            for item in self.user_tree.get_children():
                self.user_tree.delete(item)

            users = db.get_all_users()
            for u in users:
                created_str = u["created_at"].strftime("%Y-%m-%d") if u.get("created_at") else "-"
                self.user_tree.insert("", "end", values=(
                    u["user_id"],
                    u["username"],
                    u["full_name"],
                    u["role"],
                    created_str
                ))
        except Exception as e:
            messagebox.showerror("Error", f"Could not load users: {str(e)}", parent=self)

    def handle_create_user(self):
        username = self.new_username_var.get().strip()
        role = self.new_role_var.get()
        fullname = self.new_fullname_var.get().strip()
        password = self.new_password_var.get().strip()

        if not username or not fullname or not password:
            messagebox.showwarning("Validation Error", "All user fields are required.", parent=self)
            return

        if len(password) < 4:
            messagebox.showwarning("Weak Password", "Password must be at least 4 characters long.", parent=self)
            return

        try:
            db.create_user(username=username, password_plain=password, role=role, full_name=fullname)
            messagebox.showinfo("User Created", f"User '{username}' with role '{role}' successfully created!", parent=self)
            self.new_username_var.set("")
            self.new_fullname_var.set("")
            self.new_password_var.set("")
            self.refresh_users()
        except Exception as e:
            messagebox.showerror("Error", f"Failed to create user (username may already exist):\n{str(e)}", parent=self)

    def handle_delete_user(self):
        sel = self.user_tree.selection()
        if not sel:
            messagebox.showwarning("Select User", "Please select a user to delete.", parent=self)
            return

        vals = self.user_tree.item(sel[0], "values")
        user_id = int(vals[0])
        uname = vals[1]

        # Prevent deleting current logged-in user
        curr_user = UserSession.get_user()
        if curr_user and curr_user.get("user_id") == user_id:
            messagebox.showerror("Action Denied", "You cannot delete your own currently logged-in account!", parent=self)
            return

        confirm = messagebox.askyesno(
            "Confirm Delete User",
            f"Are you sure you want to permanently delete user account '{uname}'?",
            parent=self
        )
        if not confirm:
            return

        try:
            db.delete_user(user_id)
            messagebox.showinfo("Deleted", f"User '{uname}' deleted successfully.", parent=self)
            self.refresh_users()
        except Exception as e:
            messagebox.showerror("Delete Error", str(e), parent=self)

    def handle_reset_password(self):
        sel = self.user_tree.selection()
        if not sel:
            messagebox.showwarning("Select User", "Please select a user to reset password.", parent=self)
            return

        vals = self.user_tree.item(sel[0], "values")
        user_id = int(vals[0])
        uname = vals[1]

        dlg = tk.Toplevel(self)
        dlg.title(f"Reset Password for {uname}")
        dlg.geometry("340x220")
        dlg.resizable(False, False)
        dlg.configure(bg=config.THEME_BG)
        dlg.transient(self)
        dlg.grab_set()

        content = tk.Frame(dlg, bg=config.THEME_BG, padx=20, pady=20)
        content.pack(fill="both", expand=True)

        tk.Label(content, text=f"Reset Password for '{uname}'", font=(config.FONT_FAMILY, 10, "bold"), bg=config.THEME_BG).pack(anchor="w", pady=(0, 10))

        tk.Label(content, text="New Password *", font=(config.FONT_FAMILY, 9), bg=config.THEME_BG).pack(anchor="w")
        new_pwd_var = tk.StringVar()
        pwd_entry = ttk.Entry(content, textvariable=new_pwd_var, show="•")
        pwd_entry.pack(fill="x", pady=(2, 15))
        pwd_entry.focus()

        def do_reset():
            new_p = new_pwd_var.get().strip()
            if len(new_p) < 4:
                messagebox.showwarning("Weak Password", "Password must be at least 4 characters long.", parent=dlg)
                return
            try:
                db.update_user_password(user_id, new_p)
                messagebox.showinfo("Success", f"Password for '{uname}' was reset successfully!", parent=dlg)
                dlg.destroy()
            except Exception as e:
                messagebox.showerror("Error", str(e), parent=dlg)

        save_btn = tk.Button(content, text="Save New Password", font=(config.FONT_FAMILY, 9, "bold"), bg=config.THEME_ACCENT, fg="#fff", bd=0, pady=6, command=do_reset)
        save_btn.pack(fill="x")

    def handle_reseed_db(self):
        confirm = messagebox.askyesno(
            "Confirm Database Reset",
            "⚠ WARNING: Resetting the database will re-execute schema.sql.\n\n"
            "This will DROP and RE-CREATE all tables, views, procedures, and sample data!\n\n"
            "Are you sure you want to proceed?",
            parent=self,
            icon="warning"
        )
        if not confirm:
            return

        try:
            ok, msg = db.DatabaseManager.initialize_schema_if_needed("schema.sql")
            if ok:
                messagebox.showinfo("Database Reset Complete", "Database successfully reset and re-seeded with sample records!", parent=self)
                self.refresh()
                if self.on_config_changed:
                    self.on_config_changed()
            else:
                messagebox.showerror("Reset Error", msg, parent=self)
        except Exception as e:
            messagebox.showerror("Error", f"Failed to reset database: {str(e)}", parent=self)

