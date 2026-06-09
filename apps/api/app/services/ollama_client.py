import httpx
from typing import Type
from pydantic import BaseModel
from app.config import settings
import json

class OllamaError(Exception):
    pass

class OllamaTimeoutError(OllamaError):
    pass

class OllamaConnectionError(OllamaError):
    pass

async def generate_structured_output(prompt: str, schema_class: Type[BaseModel], model_name: str = None) -> BaseModel:
    """
    Llama a Ollama y fuerza la salida estructurada usando el JSON schema de Pydantic.
    """
    url = f"{settings.OLLAMA_BASE_URL}/api/chat"
    schema_json = schema_class.model_json_schema()
    
    target_model = model_name if model_name else settings.OLLAMA_MODEL
    
    payload = {
        "model": target_model,
        "messages": [
            {
                "role": "system",
                "content": "Eres un asistente de revisión documental inteligente. Debes evaluar si el contenido cumple semánticamente con el criterio, aceptando sinónimos o frases equivalentes (ej. 'En conclusión' es válido para una sección de 'Conclusión'). Responde siempre siguiendo el esquema JSON proporcionado y no inventes datos. Si no hay evidencia real, usa 'requiere_revision' o 'no_encontrado'."
            },
            {
                "role": "user",
                "content": prompt
            }
        ],
        "format": schema_json,
        "stream": False,
        "options": {
            "temperature": 0.0  # Para respuestas más deterministas
        }
    }
    
    try:
        # Usamos un timeout alto, asumiendo modelos grandes corriendo localmente
        async with httpx.AsyncClient(timeout=180.0) as client:
            response = await client.post(url, json=payload)
            response.raise_for_status()
            
            data = response.json()
            message_content = data.get("message", {}).get("content", "{}")
            
            return schema_class.model_validate_json(message_content)
            
    except httpx.TimeoutException as e:
        raise OllamaTimeoutError(f"Ollama no respondió a tiempo (Timeout): {str(e)}")
    except httpx.RequestError as e:
        raise OllamaConnectionError(f"Error de conexión con Ollama: {str(e)}")
    except Exception as e:
        raise OllamaError(f"Error inesperado en Ollama: {str(e)}")
