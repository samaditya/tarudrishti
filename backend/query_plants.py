from database import SessionLocal
from models import Plant

db = SessionLocal()
plants = db.query(Plant).all()
print("Plants in DB:")
for p in plants:
    print(f"- ID: {p.id}, Name: {p.name}, Species: {p.species}")
