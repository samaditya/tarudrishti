from database import engine
from sqlalchemy import text

with engine.begin() as conn:
    try:
        conn.execute(text("ALTER TABLE plants ADD COLUMN image_url TEXT;"))
        print("Column added successfully.")
    except Exception as e:
        print("Error adding column (maybe it already exists?):", e)
