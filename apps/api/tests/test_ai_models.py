from fastapi.testclient import TestClient

from app.main import app


def test_ai_models_endpoint_groups_models_and_marks_qwen25_3b_default():
    client = TestClient(app)

    response = client.get("/ai/models")

    assert response.status_code == 200
    payload = response.json()
    assert payload["default_model"] == "qwen2.5:3b"

    categories = {category["id"]: category for category in payload["categories"]}
    assert {"recommended", "fast", "reasoning", "embeddings"}.issubset(categories)

    models = [
        model
        for category in payload["categories"]
        for model in category["models"]
    ]
    assert any(model["id"] == "qwen2.5:3b" and model["default"] is True for model in models)
    assert any(model["id"] == "qwen3.5:9b" for model in models)
    assert any(model["id"] == "nomic-embed-text" for model in models)
