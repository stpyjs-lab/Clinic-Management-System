# database/connection.py
import sqlite3

DB_FILE = "clinic.db"

def get_connection():
    # Increase timeout to reduce "database is locked" errors under concurrent access
    conn = sqlite3.connect(DB_FILE, timeout=30)
    conn.row_factory = sqlite3.Row
    return conn

def _column_exists(conn, table, column):
    cols = conn.execute(f"PRAGMA table_info({table})").fetchall()
    return any(c["name"] == column for c in cols)

def init_database():
    conn = get_connection()



    # Clinic-specific tables
    conn.execute("""
        CREATE TABLE IF NOT EXISTS patients (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            first_name TEXT NOT NULL,
            last_name TEXT NOT NULL,
            dob TEXT,
            phone TEXT,
            email TEXT,
            address TEXT,
            created_at TEXT,
            updated_at TEXT
        )
    """)

    # Ensure new columns exist (age and gender) for newer UI
    if not _column_exists(conn, "patients", "age"):
        conn.execute("ALTER TABLE patients ADD COLUMN age INTEGER")
    if not _column_exists(conn, "patients", "gender"):
        conn.execute("ALTER TABLE patients ADD COLUMN gender TEXT")

    # Ensure doctors table has a schedule column for new UI
    if not _column_exists(conn, "doctors", "schedule"):
        conn.execute("ALTER TABLE doctors ADD COLUMN schedule TEXT")
        # Backfill existing rows with a sensible default so UI shows a schedule for older records
        conn.execute("UPDATE doctors SET schedule = 'MON-SAT' WHERE schedule IS NULL OR schedule = ''")

    conn.execute("""
        CREATE TABLE IF NOT EXISTS doctors (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            specialty TEXT,
            phone TEXT,
            email TEXT,
            created_at TEXT,
            updated_at TEXT
        )
    """)

    conn.execute("""
        CREATE TABLE IF NOT EXISTS appointments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            patient_id INTEGER NOT NULL,
            doctor_id INTEGER NOT NULL,
            scheduled_at TEXT NOT NULL,
            reason TEXT,
            status TEXT DEFAULT 'scheduled',
            created_at TEXT,
            updated_at TEXT,
            FOREIGN KEY(patient_id) REFERENCES patients(id),
            FOREIGN KEY(doctor_id) REFERENCES doctors(id)
        )
    """)

    conn.execute("""
        CREATE TABLE IF NOT EXISTS invoices (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            patient_id INTEGER NOT NULL,
            doctor_id INTEGER,
            amount REAL NOT NULL,
            issued_on TEXT,
            description TEXT,
            created_at TEXT,
            updated_at TEXT,
            FOREIGN KEY(patient_id) REFERENCES patients(id),
            FOREIGN KEY(doctor_id) REFERENCES doctors(id)
        )
    """)

    conn.commit()

    # /––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––\
    # Remove any demo/sample rows that may exist in the DB from earlier runs.
    # This ensures the app does NOT show sample "Test" patients or demo doctors
    # automatically — records should only be added when a user creates them.
    # (Conservative filters: remove obvious test/demo names only.)
    # \––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––/
    try:
        conn.execute("DELETE FROM patients WHERE first_name LIKE '%Test%'")
        conn.execute("DELETE FROM patients WHERE last_name LIKE '%Test%'")
        conn.execute("DELETE FROM doctors WHERE name = 'Dr. Who'")
        conn.execute("DELETE FROM doctors WHERE name LIKE '%Dr. Who%'")
        conn.commit()
    except Exception:
        # If deletion fails for any reason, continue without blocking startup
        pass

    conn.close()
    print("✓ Database initialized")