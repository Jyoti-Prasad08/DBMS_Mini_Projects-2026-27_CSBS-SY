"""
Login Screen for Smart Parking Management System.
Features a clean embedded login card, demo credential chips,
and an interactive MySQL Connection Settings modal.
"""

import tkinter as tk
from tkinter import ttk, messagebox
import config
from auth import UserSession
import db


class LoginScreen(tk.Frame):
    """Full-frame view for user authentication and connection configuration."""

    def __init__(self, parent, on_login_success):
        super().__init__(parent, bg=config.THEME_BG)
        self.parent = parent
        self.on_login_success = on_login_success

        self.create_widgets()
        self.bind_events()

    def create_widgets(self):
        # Outer center container
        center_container = tk.Frame(self, bg=config.THEME_BG)
        center_container.place(relx=0.5, rely=0.5, anchor="center")

        # Main Card
        card = tk.Frame(center_container, bg=config.THEME_CARD_BG, bd=1, relief="solid")
        card.pack(padx=20, pady=20)

        # Header banner inside card
        header_frame = tk.Frame(card, bg=config.THEME_PRIMARY, width=460, height=130)
        header_frame.pack(fill="x", side="top")
        header_frame.pack_propagate(False)

        icon_label = tk.Label(
            header_frame,
            text="🅿",
            font=(config.FONT_FAMILY, 32, "bold"),
            fg="#60a5fa",
            bg=config.THEME_PRIMARY
        )
        icon_label.pack(pady=(12, 2))

        title_label = tk.Label(
            header_frame,
            text="SMART PARKING SYSTEM",
            font=(config.FONT_FAMILY, 15, "bold"),
            fg="#ffffff",
            bg=config.THEME_PRIMARY
        )
        title_label.pack()

        subtitle_label = tk.Label(
            header_frame,
            text="DBMS Course Project • MySQL & Tkinter",
            font=(config.FONT_FAMILY, 9),
            fg="#94a3b8",
            bg=config.THEME_PRIMARY
        )
        subtitle_label.pack(pady=(0, 10))

        # Form body
        inner = tk.Frame(card, bg=config.THEME_CARD_BG, width=460)
        inner.pack(fill="both", expand=True, padx=30, pady=20)

        prompt_label = tk.Label(
            inner,
            text="Sign in to your account",
            font=(config.FONT_FAMILY, 12, "bold"),
            fg=config.THEME_TEXT,
            bg=config.THEME_CARD_BG
        )
        prompt_label.pack(anchor="w", pady=(0, 15))

        # Username
        tk.Label(
            inner,
            text="Username",
            font=(config.FONT_FAMILY, 10, "bold"),
            fg=config.THEME_TEXT,
            bg=config.THEME_CARD_BG
        ).pack(anchor="w")

        self.username_var = tk.StringVar(value="admin")
        self.username_entry = ttk.Entry(inner, textvariable=self.username_var, font=(config.FONT_FAMILY, 10))
        self.username_entry.pack(fill="x", pady=(4, 12), ipady=3)
        self.username_entry.focus()

        # Password
        tk.Label(
            inner,
            text="Password",
            font=(config.FONT_FAMILY, 10, "bold"),
            fg=config.THEME_TEXT,
            bg=config.THEME_CARD_BG
        ).pack(anchor="w")

        self.password_var = tk.StringVar(value="admin123")
        self.password_entry = ttk.Entry(inner, textvariable=self.password_var, show="•", font=(config.FONT_FAMILY, 10))
        self.password_entry.pack(fill="x", pady=(4, 16), ipady=3)

        # Login button
        self.login_btn = tk.Button(
            inner,
            text="Sign In",
            font=(config.FONT_FAMILY, 11, "bold"),
            fg="#ffffff",
            bg=config.THEME_ACCENT,
            activebackground=config.THEME_ACCENT_HOVER,
            activeforeground="#ffffff",
            bd=0,
            cursor="hand2",
            command=self.handle_login
        )
        self.login_btn.pack(fill="x", ipady=6, pady=(0, 15))

        # Quick demo credentials
        quick_frame = tk.LabelFrame(
            inner,
            text=" Quick Demo Credentials ",
            font=(config.FONT_FAMILY, 8, "bold"),
            fg=config.THEME_SUBTEXT,
            bg=config.THEME_CARD_BG
        )
        quick_frame.pack(fill="x", pady=(0, 12))

        btn_box = tk.Frame(quick_frame, bg=config.THEME_CARD_BG)
        btn_box.pack(fill="x", padx=8, pady=6)

        admin_chip = tk.Button(
            btn_box,
            text="Admin (admin / admin123)",
            font=(config.FONT_FAMILY, 8),
            bg="#f1f5f9",
            fg=config.THEME_TEXT,
            relief="groove",
            cursor="hand2",
            command=lambda: self.fill_credentials("admin", "admin123")
        )
        admin_chip.pack(side="left", expand=True, fill="x", padx=(0, 4))

        staff_chip = tk.Button(
            btn_box,
            text="Attendant (attendant1 / staff123)",
            font=(config.FONT_FAMILY, 8),
            bg="#f1f5f9",
            fg=config.THEME_TEXT,
            relief="groove",
            cursor="hand2",
            command=lambda: self.fill_credentials("attendant1", "staff123")
        )
        staff_chip.pack(side="left", expand=True, fill="x", padx=(4, 0))

        # DB Connection Settings Button
        db_cfg_btn = tk.Button(
            inner,
            text="⚙ Configure MySQL Database Settings",
            font=(config.FONT_FAMILY, 8),
            fg=config.THEME_ACCENT,
            bg=config.THEME_CARD_BG,
            bd=0,
            cursor="hand2",
            command=self.open_db_config_dialog
        )
        db_cfg_btn.pack()

    def bind_events(self):
        self.username_entry.bind("<Return>", lambda e: self.handle_login())
        self.password_entry.bind("<Return>", lambda e: self.handle_login())

    def fill_credentials(self, username, password):
        self.username_var.set(username)
        self.password_var.set(password)
        self.password_entry.focus()

    def handle_login(self):
        username = self.username_var.get().strip()
        password = self.password_var.get().strip()

        if not username or not password:
            messagebox.showwarning("Input Error", "Please enter both username and password.", parent=self)
            return

        try:
            user = db.authenticate_user(username, password)
            if user:
                UserSession.set_user(user)
                self.on_login_success()
            else:
                messagebox.showerror(
                    "Login Failed",
                    "Invalid username or password.\n\n"
                    "Default credentials:\n"
                    "• Admin: admin / admin123\n"
                    "• Attendant: attendant1 / staff123",
                    parent=self
                )
                self.password_var.set("")
                self.password_entry.focus()
        except Exception as e:
            err = str(e)
            action = messagebox.askyesno(
                "Database Connection Error",
                f"Failed to communicate with MySQL:\n{err}\n\n"
                "Would you like to open the MySQL Connection Settings dialog to verify your password or host?",
                parent=self,
                icon="error"
            )
            if action:
                self.open_db_config_dialog()

    def open_db_config_dialog(self):
        """Modal dialog to inspect and update MySQL connection parameters."""
        dlg = tk.Toplevel(self)
        dlg.title("MySQL Database Connection Settings")
        dlg.geometry("420x420")
        dlg.resizable(False, False)
        dlg.configure(bg=config.THEME_BG)
        dlg.transient(self.winfo_toplevel())
        dlg.grab_set()

        content = tk.Frame(dlg, bg=config.THEME_BG, padx=20, pady=15)
        content.pack(fill="both", expand=True)

        tk.Label(content, text="MySQL Connection Settings", font=(config.FONT_FAMILY, 12, "bold"), bg=config.THEME_BG).pack(anchor="w", pady=(0, 10))

        # Host
        tk.Label(content, text="Host:", font=(config.FONT_FAMILY, 9, "bold"), bg=config.THEME_BG).pack(anchor="w")
        host_var = tk.StringVar(value=config.DB_HOST)
        ttk.Entry(content, textvariable=host_var).pack(fill="x", pady=(2, 6))

        # Port
        tk.Label(content, text="Port:", font=(config.FONT_FAMILY, 9, "bold"), bg=config.THEME_BG).pack(anchor="w")
        port_var = tk.StringVar(value=str(config.DB_PORT))
        ttk.Entry(content, textvariable=port_var).pack(fill="x", pady=(2, 6))

        # User
        tk.Label(content, text="User:", font=(config.FONT_FAMILY, 9, "bold"), bg=config.THEME_BG).pack(anchor="w")
        user_var = tk.StringVar(value=config.DB_USER)
        ttk.Entry(content, textvariable=user_var).pack(fill="x", pady=(2, 6))

        # Password
        tk.Label(content, text="Password:", font=(config.FONT_FAMILY, 9, "bold"), bg=config.THEME_BG).pack(anchor="w")
        pwd_var = tk.StringVar(value=config.DB_PASSWORD)
        ttk.Entry(content, textvariable=pwd_var, show="•").pack(fill="x", pady=(2, 6))

        # Database Name
        tk.Label(content, text="Database Name:", font=(config.FONT_FAMILY, 9, "bold"), bg=config.THEME_BG).pack(anchor="w")
        db_var = tk.StringVar(value=config.DB_NAME)
        ttk.Entry(content, textvariable=db_var).pack(fill="x", pady=(2, 12))

        status_lbl = tk.Label(content, text="", font=(config.FONT_FAMILY, 8), bg=config.THEME_BG)
        status_lbl.pack(pady=(0, 8))

        btn_row = tk.Frame(content, bg=config.THEME_BG)
        btn_row.pack(fill="x")

        def test_conn():
            status_lbl.config(text="Testing connection...", fg=config.THEME_TEXT)
            dlg.update_idletasks()
            ok, msg = db.DatabaseManager.test_custom_credentials(
                host=host_var.get(),
                port=port_var.get(),
                user=user_var.get(),
                password=pwd_var.get(),
                database=db_var.get()
            )
            if ok:
                status_lbl.config(text="✓ Connection Successful!", fg=config.THEME_SUCCESS)
            else:
                status_lbl.config(text=f"✗ {msg[:45]}...", fg=config.THEME_DANGER)
                messagebox.showerror("Connection Failed", msg, parent=dlg)

        def save_and_init():
            try:
                config.save_db_config(
                    host=host_var.get(),
                    port=int(port_var.get()),
                    user=user_var.get(),
                    password=pwd_var.get(),
                    database=db_var.get()
                )
                # Try initializing schema
                ok, msg = db.DatabaseManager.initialize_schema_if_needed("schema.sql")
                if ok:
                    messagebox.showinfo("Success", "Settings saved and database initialized successfully!", parent=dlg)
                    dlg.destroy()
                else:
                    messagebox.showwarning("Notice", f"Settings saved, but schema init reported: {msg}", parent=dlg)
                    dlg.destroy()
            except Exception as e:
                messagebox.showerror("Save Error", str(e), parent=dlg)

        test_btn = tk.Button(btn_row, text="Test Connection", font=(config.FONT_FAMILY, 9), bg="#f1f5f9", relief="solid", bd=1, padx=8, pady=5, command=test_conn)
        test_btn.pack(side="left", padx=(0, 6))

        save_btn = tk.Button(btn_row, text="Save & Initialize", font=(config.FONT_FAMILY, 9, "bold"), bg=config.THEME_ACCENT, fg="#ffffff", bd=0, padx=10, pady=5, command=save_and_init)
        save_btn.pack(side="right")
