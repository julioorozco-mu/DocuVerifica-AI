import uuid
from types import SimpleNamespace

from app.services.ai_review import resolve_review_criteria


class FakeQuery:
    def __init__(self, items):
        self.items = items

    def filter(self, *conditions):
        return self

    def all(self):
        return self.items


class FakeDB:
    def __init__(self, items):
        self.items = items

    def query(self, model):
        return FakeQuery(self.items)


def test_resolver_returns_query_results_without_crashing():
    reviewer_id = uuid.uuid4()
    criterion = SimpleNamespace(id=uuid.uuid4(), reviewer_id=None, is_active=True, rule_type="ai")

    results = resolve_review_criteria(FakeDB([criterion]), reviewer_id, [])

    assert results == [criterion]
