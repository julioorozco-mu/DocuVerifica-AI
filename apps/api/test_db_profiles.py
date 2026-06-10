from app.database import SessionLocal
from app.models import Profile

db = SessionLocal()
try:
    profiles = db.query(Profile).all()
    print("Perfiles encontrados:")
    for p in profiles:
        print(f"ID: {p.id}, Email: {p.email}, Rol: {p.role}")
except Exception as e:
    print("Error al consultar perfiles:", e)
finally:
    db.close()
