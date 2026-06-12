from typing import Any

DEFAULT_AI_MODEL = "qwen2.5:3b"

AI_MODEL_CATEGORIES: list[dict[str, Any]] = [
    {
        "id": "recommended",
        "label": "Recomendados",
        "description": "Equilibrio entre calidad y consumo local.",
        "models": [
            {
                "id": "qwen3.5:9b",
                "label": "Qwen 3.5 9B",
                "description": "Mayor calidad cuando la PC local tenga recursos disponibles.",
                "default": False,
            },
            {
                "id": "llama3.1:8b",
                "label": "Llama 3.1 8B",
                "description": "Alternativo estable para revisión documental general.",
                "default": False,
            },
            {
                "id": "phi4",
                "label": "Phi-4",
                "description": "Alternativo compacto con buena comprensión de instrucciones.",
                "default": False,
            },
        ],
    },
    {
        "id": "fast",
        "label": "Rápidos",
        "description": "Menor VRAM y mejor respuesta para pruebas o documentos simples.",
        "models": [
            {
                "id": "qwen2.5:3b",
                "label": "Qwen 2.5 3B",
                "description": "Modelo rápido recomendado por defecto.",
                "default": True,
            },
            {
                "id": "llama3.2:1b",
                "label": "Llama 3.2 1B",
                "description": "Muy ligero para pruebas rápidas.",
                "default": False,
            },
            {
                "id": "deepseek-r1:1.5b",
                "label": "DeepSeek R1 1.5B",
                "description": "Razonamiento ligero para simulaciones simples.",
                "default": False,
            },
        ],
    },
    {
        "id": "reasoning",
        "label": "Razonamiento",
        "description": "Más lentos, útiles cuando el criterio requiere análisis complejo.",
        "models": [
            {
                "id": "deepseek-r1:8b",
                "label": "DeepSeek R1 8B",
                "description": "Razonamiento avanzado con consumo moderado.",
                "default": False,
            },
            {
                "id": "deepseek-r1:32b",
                "label": "DeepSeek R1 32B",
                "description": "Razonamiento máximo, usar solo si el hardware local lo soporta.",
                "default": False,
            },
        ],
    },
    {
        "id": "embeddings",
        "label": "Embeddings",
        "description": "Modelos para búsqueda semántica; no se usan para dictamen.",
        "models": [
            {
                "id": "nomic-embed-text",
                "label": "Nomic Embed Text",
                "description": "Modelo local de embeddings recomendado.",
                "default": False,
                "disabled": True,
            },
            {
                "id": "nomic-embed-text-v2-moe",
                "label": "Nomic Embed Text v2 MoE",
                "description": "Variante para embeddings si está instalada localmente.",
                "default": False,
                "disabled": True,
            },
        ],
    },
]


def get_ai_models_payload() -> dict[str, Any]:
    return {
        "default_model": DEFAULT_AI_MODEL,
        "categories": AI_MODEL_CATEGORIES,
    }
