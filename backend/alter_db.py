from database import engine
from sqlalchemy import text

with engine.begin() as conn:
    try:
        conn.execute(text("ALTER TABLE plants ADD COLUMN user_email VARCHAR NOT NULL DEFAULT 'guest@example.com';"))
        print("Column added successfully.")
    except Exception as e:
        print("Error adding column (maybe it already exists?):", e)
