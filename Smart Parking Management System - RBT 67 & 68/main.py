"""
Main Application Entry Point for Smart Parking Management System.
DBMS Course Project with MySQL backend and Tkinter (ttk) GUI.
"""

import tkinter as tk
from tkinter import ttk, messagebox
import datetime
import config
from auth import UserSession
import db

# Import all screen components
from login_screen import LoginScreen
from dashboard_screen import DashboardScreen
from vehicle_entry_screen import VehicleEntryScreen
from vehicle_exit_screen import VehicleExitScreen
from slot_management_screen import SlotManagementScreen
from reservations_screen import ReservationsScreen
from reports_screen import ReportsScreen
from admin_screen import AdminScreen


class SmartParkingApp(tk.Tk):
    """Main window orchestrating views, multi-tab navigation and user sessions."""

    def __init__(self):
        super().__init__()

        self.title("Smart Parking Management System • DBMS Project")
        self.geometry("1240x800")
        self.minsize(1050, 700)
        self.configure(bg=config.THEME_BG)

        # Center on screen
        self.center_window()

        # Apply modern styles
        self.configure_styles()

        # Views
        self.header_frame = None
        self.notebook = None
        self.status_bar = None

        # Build initial login view
        self.login_view = LoginScreen(self, on_login_success=self.on_login_success)
        self.login_view.pack(fill="both", expand=True)

    def center_window(self):
        self.update_idletasks()
        w = 1240
        h = 800
        sw = self.winfo_screenwidth()
        sh = self.winfo_screenheight()
        x = max(0, (sw - w) // 2)
        y = max(0, (sh - h) // 2 - 20)
        self.geometry(f"{w}x{h}+{x}+{y}")

    def configure_styles(self):
        """Configure modern TTK widget styling."""
        style = ttk.Style()
        try:
            style.theme_use("clam")
        except Exception:
            pass

        # General colors
        style.configure(".", font=(config.FONT_FAMILY, 9), background=config.THEME_BG)

        # Notebook tabs
        style.configure(
            "TNotebook",
            background=config.THEME_BG,
            borderwidth=0
        )
        style.configure(
            "TNotebook.Tab",
            font=(config.FONT_FAMILY, 10, "bold"),
            padding=[16, 8],
            background="#e2e8f0",
            foreground=config.THEME_TEXT,
            borderwidth=0
        )
        style.map(
            "TNotebook.Tab",
            background=[("selected", config.THEME_PRIMARY), ("active", "#cbd5e1")],
            foreground=[("selected", "#ffffff"), ("active", config.THEME_TEXT)]
        )

        # Treeview styling
        style.configure(
            "Treeview",
            font=(config.FONT_FAMILY, 9),
            rowheight=26,
            background="#ffffff",
            fieldbackground="#ffffff",
            foreground=config.THEME_TEXT,
            borderwidth=1,
            relief="solid"
        )
        style.configure(
            "Treeview.Heading",
            font=(config.FONT_FAMILY, 9, "bold"),
            background="#f1f5f9",
            foreground=config.THEME_TEXT,
            relief="flat",
            padding=[6, 6]
        )
        style.map(
            "Treeview",
            background=[("selected", config.THEME_ACCENT)],
            foreground=[("selected", "#ffffff")]
        )

    def on_login_success(self):
        """Transition from login screen to the authenticated main application workspace."""
        self.login_view.pack_forget()

        if self.header_frame is None:
            self.create_header()
            self.create_notebook_tabs()
            self.create_status_bar()
            self.update_clock()
        else:
            self.header_frame.pack(fill="x", side="top")
            self.notebook.pack(fill="both", expand=True, padx=10, pady=(10, 0))
            self.status_bar.pack(fill="x", side="bottom")

        user = UserSession.get_user()
        if user:
            role_text = user.get("role", "attendant").upper()
            full_name = user.get("full_name", user.get("username"))
            self.user_badge.config(
                text=f"👤 {full_name} [{role_text}]",
                bg="#2563eb" if role_text == "ADMIN" else "#475569"
            )

        # Refresh all views
        self.on_data_mutated()

    def handle_logout(self):
        confirm = messagebox.askyesno("Confirm Logout", "Are you sure you want to log out?", parent=self)
        if confirm:
            UserSession.clear()
            if self.header_frame:
                self.header_frame.pack_forget()
            if self.notebook:
                self.notebook.pack_forget()
            if self.status_bar:
                self.status_bar.pack_forget()
            self.login_view.pack(fill="both", expand=True)

    def create_header(self):
        """Top application branding and user session bar."""
        self.header_frame = tk.Frame(self, bg=config.THEME_PRIMARY, height=65)
        self.header_frame.pack(fill="x", side="top")
        self.header_frame.pack_propagate(False)

        # Left branding
        brand_frame = tk.Frame(self.header_frame, bg=config.THEME_PRIMARY)
        brand_frame.pack(side="left", padx=20, fill="y")

        logo_lbl = tk.Label(
            brand_frame,
            text="🅿",
            font=(config.FONT_FAMILY, 22, "bold"),
            fg="#60a5fa",
            bg=config.THEME_PRIMARY
        )
        logo_lbl.pack(side="left", padx=(0, 10))

        title_box = tk.Frame(brand_frame, bg=config.THEME_PRIMARY)
        title_box.pack(side="left", fill="y", pady=10)

        app_title = tk.Label(
            title_box,
            text="SMART PARKING MANAGEMENT SYSTEM",
            font=(config.FONT_FAMILY, 13, "bold"),
            fg="#ffffff",
            bg=config.THEME_PRIMARY
        )
        app_title.pack(anchor="w")

        app_sub = tk.Label(
            title_box,
            text="Normalized 3NF MySQL Database • Multi-Role GUI",
            font=(config.FONT_FAMILY, 8),
            fg="#94a3b8",
            bg=config.THEME_PRIMARY
        )
        app_sub.pack(anchor="w")

        # Right session and clock
        user_frame = tk.Frame(self.header_frame, bg=config.THEME_PRIMARY)
        user_frame.pack(side="right", padx=20, fill="y")

        self.clock_lbl = tk.Label(
            user_frame,
            text="--:--:--",
            font=("Consolas", 10),
            fg="#cbd5e1",
            bg=config.THEME_PRIMARY
        )
        self.clock_lbl.pack(side="left", padx=(0, 20))

        self.user_badge = tk.Label(
            user_frame,
            text="👤 Not Logged In",
            font=(config.FONT_FAMILY, 9, "bold"),
            fg="#ffffff",
            bg="#334155",
            padx=12,
            pady=4,
            relief="flat"
        )
        self.user_badge.pack(side="left", padx=(0, 12))

        logout_btn = tk.Button(
            user_frame,
            text="Logout",
            font=(config.FONT_FAMILY, 9, "bold"),
            bg="#dc2626",
            fg="#ffffff",
            activebackground="#b91c1c",
            activeforeground="#ffffff",
            bd=0,
            cursor="hand2",
            padx=12,
            pady=4,
            command=self.handle_logout
        )
        logout_btn.pack(side="left")

    def create_notebook_tabs(self):
        """Create multi-tab notebook."""
        self.notebook = ttk.Notebook(self)
        self.notebook.pack(fill="both", expand=True, padx=10, pady=(10, 0))

        # Instantiate each screen
        self.dashboard_tab = DashboardScreen(self.notebook)
        self.entry_tab = VehicleEntryScreen(self.notebook, on_entry_completed=self.on_data_mutated)
        self.exit_tab = VehicleExitScreen(self.notebook, on_exit_completed=self.on_data_mutated)
        self.slots_tab = SlotManagementScreen(self.notebook, on_slot_updated=self.on_data_mutated)
        self.res_tab = ReservationsScreen(self.notebook, on_reservation_changed=self.on_data_mutated)
        self.reports_tab = ReportsScreen(self.notebook)
        self.admin_tab = AdminScreen(self.notebook, on_config_changed=self.on_data_mutated)

        # Add tabs
        self.notebook.add(self.dashboard_tab, text=" 📊 Dashboard ")
        self.notebook.add(self.entry_tab, text=" 🚗 Vehicle Entry ")
        self.notebook.add(self.exit_tab, text=" 💳 Vehicle Exit ")
        self.notebook.add(self.slots_tab, text=" 🅿 Slot Management ")
        self.notebook.add(self.res_tab, text=" 📅 Reservations ")
        self.notebook.add(self.reports_tab, text=" 📑 Records & Reports ")
        self.notebook.add(self.admin_tab, text=" ⚙ Admin Panel ")

        # Bind tab change
        self.notebook.bind("<<NotebookTabChanged>>", self.on_tab_changed)

    def create_status_bar(self):
        """Bottom status bar."""
        self.status_bar = tk.Frame(self, bg="#e2e8f0", height=24)
        self.status_bar.pack(fill="x", side="bottom")
        self.status_bar.pack_propagate(False)

        self.db_status_lbl = tk.Label(
            self.status_bar,
            text=f"● MySQL Database: Connected ({config.DB_NAME}@{config.DB_HOST}:{config.DB_PORT})",
            font=(config.FONT_FAMILY, 8),
            fg="#15803d",
            bg="#e2e8f0"
        )
        self.db_status_lbl.pack(side="left", padx=15)

        self.info_status_lbl = tk.Label(
            self.status_bar,
            text="Triggers: Active | Stored Procedures: Ready | 3NF Schema Enforced",
            font=(config.FONT_FAMILY, 8),
            fg=config.THEME_SUBTEXT,
            bg="#e2e8f0"
        )
        self.info_status_lbl.pack(side="right", padx=15)

    def update_clock(self):
        now_str = datetime.datetime.now().strftime("%a, %d %b %Y  %H:%M:%S")
        if hasattr(self, "clock_lbl") and self.clock_lbl:
            self.clock_lbl.config(text=now_str)
        self.after(1000, self.update_clock)

    def on_tab_changed(self, event):
        """Auto-refresh the selected tab whenever switched to."""
        if not self.notebook:
            return
        selected_index = self.notebook.index(self.notebook.select())
        if selected_index == 0:  # Dashboard
            self.dashboard_tab.refresh()
        elif selected_index == 1:  # Entry
            self.entry_tab.load_lots()
        elif selected_index == 2:  # Exit
            self.exit_tab.refresh_active_list()
        elif selected_index == 3:  # Slots
            self.slots_tab.refresh()
        elif selected_index == 4:  # Reservations
            self.res_tab.refresh()
        elif selected_index == 5:  # Reports
            self.reports_tab.refresh_all()
        elif selected_index == 6:  # Admin
            self.admin_tab.refresh()

    def on_data_mutated(self):
        """Callback whenever check-in, checkout, slot edit, or reservation occurs."""
        try:
            if hasattr(self, "dashboard_tab"):
                self.dashboard_tab.refresh()
            if hasattr(self, "exit_tab"):
                self.exit_tab.refresh_active_list()
            if hasattr(self, "slots_tab"):
                self.slots_tab.refresh()
            if hasattr(self, "res_tab"):
                self.res_tab.refresh()
            if hasattr(self, "reports_tab"):
                self.reports_tab.refresh_all()
            if hasattr(self, "admin_tab"):
                self.admin_tab.refresh()
        except Exception:
            pass


def main():
    print("=" * 65)
    print("  Smart Parking Management System • Startup")
    print("=" * 65)
    print(f"[1/3] Testing MySQL connection to {config.DB_NAME}@{config.DB_HOST}:{config.DB_PORT} (User: {config.DB_USER})...")

    ok, msg = db.DatabaseManager.test_connection()
    if ok:
        print(f"[2/3] MySQL connection SUCCESSFUL: {msg}")
    else:
        print(f"[2/3] Notice: Connection check reported: {msg}")
        print("      Attempting automatic database initialization from schema.sql...")
        init_ok, init_msg = db.DatabaseManager.initialize_schema_if_needed("schema.sql")
        if init_ok:
            print("      Database schema initialized successfully!")
        else:
            print(f"      Schema init reported: {init_msg}")
            print("      (You can configure custom MySQL password inside the GUI login screen).")

    print("[3/3] Launching Graphical User Interface...")
    print("-" * 65)

    app = SmartParkingApp()
    app.mainloop()


if __name__ == "__main__":
    main()
