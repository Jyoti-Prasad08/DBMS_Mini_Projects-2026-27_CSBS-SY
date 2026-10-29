"""
Database Setup Utility for Restaurant Management System
Executes restaurant_db.sql into MySQL and configures .env
"""
import os
import sys
import getpass
import subprocess
import shutil

def run_via_mysql_cli(host, user, password, sql_path):
    mysql_bin = shutil.which("mysql") or r"C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe"
    if not os.path.exists(mysql_bin) and not shutil.which("mysql"):
        return False, "mysql CLI executable not found"

    cmd = [mysql_bin, f"-h{host}", f"-u{user}"]
    if password:
        cmd.append(f"-p{password}")

    try:
        with open(sql_path, "r", encoding="utf-8") as f:
            proc = subprocess.run(
                cmd,
                stdin=f,
                capture_output=True,
                text=True,
                check=False
            )
        if proc.returncode == 0:
            return True, "Executed successfully via MySQL CLI"
        else:
            return False, proc.stderr.strip()
    except Exception as e:
        return False, str(e)


def save_env(host, user, password, db="restaurant_db"):
    env_path = os.path.join(os.path.dirname(__file__), ".env")
    with open(env_path, "w", encoding="utf-8") as f:
        f.write(f"DB_HOST={host}\n")
        f.write(f"DB_USER={user}\n")
        f.write(f"DB_PASSWORD={password}\n")
        f.write(f"DB_NAME={db}\n")
    print(f"[OK] Saved credentials to: {env_path}")


def main():
    print("=" * 60)
    print(" Restaurant Management System - MySQL Setup ")
    print("=" * 60)

    script_dir = os.path.dirname(os.path.abspath(__file__))
    sql_file = os.path.join(script_dir, "restaurant_db.sql")

    if not os.path.exists(sql_file):
        print(f"[-] Error: '{sql_file}' not found.")
        sys.exit(1)

    host = input("Enter MySQL Host [default: localhost]: ").strip() or "localhost"
    user = input("Enter MySQL User [default: root]: ").strip() or "root"
    password = getpass.getpass("Enter MySQL Password: ")

    print(f"\n[+] Running database import from {sql_file}...")
    success, msg = run_via_mysql_cli(host, user, password, sql_file)

    if success:
        print("[OK] Database 'restaurant_db' imported and populated successfully!")
        save_env(host, user, password)
        print("\n[OK] Setup completed successfully! You can now launch the app with:")
        print("    streamlit run app.py")
    else:
        print(f"[-] Database setup failed: {msg}")
        print("Please check your MySQL password and ensure the MySQL service is running.")


if __name__ == "__main__":
    main()
