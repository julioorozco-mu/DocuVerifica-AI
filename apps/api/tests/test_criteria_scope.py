from uuid import uuid4

import pytest
from fastapi import HTTPException

from app.models import Profile, ReviewCriterion
from app.routers.criteria_router import create_criterion
from app.schemas import ReviewCriterionCreate


class FakeDB:
    def __init__(self):
        self.added = []
        self.committed = False

    def add(self, obj):
        self.added.append(obj)

    def commit(self):
        self.committed = True

    def refresh(self, obj):
        return None


def make_user(role: str) -> Profile:
    return Profile(
        id=uuid4(),
        email=f"{role}@revisiondocs.ai",
        full_name=role,
        role=role,
        status="Activo",
    )


def make_body(scope: str) -> ReviewCriterionCreate:
    return ReviewCriterionCreate(
        name=f"Criterio {scope}",
        description="Debe cumplir una regla institucional.",
        rule_type="ai",
        is_active=True,
        scope=scope,
    )


def first_criterion(db: FakeDB) -> ReviewCriterion:
    return next(item for item in db.added if isinstance(item, ReviewCriterion))


def test_reviewer_creates_individual_criterion_with_audit():
    db = FakeDB()
    reviewer = make_user("revisor")

    created = create_criterion(make_body("individual"), db=db, current_user=reviewer)

    assert created.reviewer_id == reviewer.id
    assert first_criterion(db).reviewer_id == reviewer.id
    assert db.committed is True


def test_admin_can_create_global_criterion():
    db = FakeDB()
    admin = make_user("admin")

    created = create_criterion(make_body("global"), db=db, current_user=admin)

    assert created.reviewer_id is None
    assert first_criterion(db).reviewer_id is None
    assert db.committed is True


def test_reviewer_cannot_create_global_criterion():
    db = FakeDB()
    reviewer = make_user("revisor")

    with pytest.raises(HTTPException) as exc_info:
        create_criterion(make_body("global"), db=db, current_user=reviewer)

    assert exc_info.value.status_code == 403
    assert db.added == []
    assert db.committed is False
