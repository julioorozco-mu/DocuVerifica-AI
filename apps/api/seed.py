import uuid
from sqlalchemy import text
from app.database import engine, Base, SessionLocal
from app.models import ReviewCriterion

def seed():
    print("Creando tipos ENUM si no existen...")
    with engine.connect() as conn:
        conn.execute(text("DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'criterion_rule_type') THEN CREATE TYPE criterion_rule_type AS ENUM ('rule', 'semantic', 'ai', 'rule_then_ai'); END IF; END $$;"))
        conn.execute(text("DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ai_review_status') THEN CREATE TYPE ai_review_status AS ENUM ('cumple', 'no_cumple', 'no_encontrado', 'requiere_revision'); END IF; END $$;"))
        conn.commit()

    print("Creando tablas si no existen...")
    Base.metadata.create_all(bind=engine)
    
    print("Iniciando sesión...")
    db = SessionLocal()
    
    # Verificar si ya existen criterios
    existing_criteria = db.query(ReviewCriterion).count()
    if existing_criteria > 0:
        print(f"Ya existen {existing_criteria} criterios. No se añadirán más.")
    else:
        print("Añadiendo criterio de prueba...")
        criterio_prueba = ReviewCriterion(
            id=uuid.uuid4(),
            name="Validación de Firma",
            description="El documento debe contener una firma legible al final. Si no se menciona o no se observa explícitamente una firma, indicar requiere revisión.",
            rule_type="ai",
            is_active=True
        )
        db.add(criterio_prueba)
        
        criterio_prueba_2 = ReviewCriterion(
            id=uuid.uuid4(),
            name="Fecha de Expedición",
            description="El documento debe mencionar claramente la fecha de expedición o fecha de firma. Si no está presente, indicar que no se cumple el criterio.",
            rule_type="ai",
            is_active=True
        )
        db.add(criterio_prueba_2)
        
        db.commit()
        print("Criterios de prueba añadidos con éxito.")
        
    db.close()

if __name__ == "__main__":
    seed()
