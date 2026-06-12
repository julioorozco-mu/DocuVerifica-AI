import os
import sys
from pathlib import Path

# Configurar el path para poder importar módulos de la app
current_dir = Path(__file__).resolve().parent
sys.path.append(str(current_dir))

from sqlalchemy import create_engine, text
from app.config import settings

def main():
    engine = create_engine(settings.DATABASE_URL)
    
    with engine.begin() as conn:
        try:
            # Intentar crear el enum de estado si no existe
            conn.execute(text("CREATE TYPE user_status AS ENUM ('Activo', 'Inactivo', 'Pendiente');"))
            print("Enum 'user_status' creado exitosamente.")
        except Exception as e:
            print("El enum 'user_status' ya existe o hubo un error:", e)

        try:
            # Agregar la columna status
            conn.execute(text("ALTER TABLE profiles ADD COLUMN status user_status NOT NULL DEFAULT 'Activo';"))
            print("Columna 'status' agregada a 'profiles' exitosamente.")
        except Exception as e:
            print("La columna 'status' ya existe o hubo un error:", e)

if __name__ == "__main__":
    main()
