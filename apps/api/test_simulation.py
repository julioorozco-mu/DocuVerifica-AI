import asyncio
import sys
from app.services.ai_review import simulate_criterion

async def test():
    try:
        print("Iniciando simulación de prueba...")
        res = await simulate_criterion(
            criterion_name="Folio",
            criterion_description="El documento debe contener un folio numérico en la esquina superior derecha.",
            text_fragment="Folio: 12345",
            model_name="qwen2.5:3b"
        )
        print("Resultado exitoso:")
        print(res)
    except Exception as e:
        print("Error capturado:")
        print(type(e), e)

if __name__ == "__main__":
    asyncio.run(test())
