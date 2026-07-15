"""Tests d'integration : planning de repas et liste de courses."""
from datetime import date, timedelta
from uuid import uuid4

from tests.conftest import create_test_user, create_test_recipe


def test_shopping_list_aggregates_quantities(client, db_session):
    user, headers = create_test_user(db_session, "plan@test.com", "Chef")
    today = date.today()

    r1 = create_test_recipe(db_session, user.id, "Gateau", "public")
    r2 = create_test_recipe(db_session, user.id, "Crepes", "public")

    from app.models.recipe import RecipeIngredient
    db_session.add(RecipeIngredient(
        id=uuid4(), recipe_id=r1.id, line_order=1,
        name="Farine", quantity=200, unit="g",
    ))
    db_session.add(RecipeIngredient(
        id=uuid4(), recipe_id=r2.id, line_order=1,
        name="Farine", quantity=300, unit="g",
    ))
    db_session.add(RecipeIngredient(
        id=uuid4(), recipe_id=r2.id, line_order=2,
        name="Oeuf", quantity=2, unit=None,
    ))
    db_session.commit()

    client.post("/planning", headers=headers, json={
        "date": today.isoformat(),
        "slot": "midi",
        "recipe_id": str(r1.id),
    })
    client.post("/planning", headers=headers, json={
        "date": today.isoformat(),
        "slot": "soir",
        "recipe_id": str(r2.id),
    })

    resp = client.get(f"/planning/shopping-list?start={today.isoformat()}&end={today.isoformat()}", headers=headers)
    assert resp.status_code == 200
    items = resp.json()
    assert len(items) == 2
    farine = next(i for i in items if i["name"] == "Farine")
    assert farine["quantity"] == 500
    assert farine["unit"] == "g"
    oeuf = next(i for i in items if i["name"] == "Oeuf")
    assert oeuf["quantity"] == 2
    assert oeuf["unit"] is None


def test_different_units_kept_separate(client, db_session):
    user, headers = create_test_user(db_session, "units@test.com", "Chef")
    today = date.today()

    r1 = create_test_recipe(db_session, user.id, "R1", "public")
    r2 = create_test_recipe(db_session, user.id, "R2", "public")

    from app.models.recipe import RecipeIngredient
    db_session.add(RecipeIngredient(
        id=uuid4(), recipe_id=r1.id, line_order=1,
        name="Sucre", quantity=100, unit="g",
    ))
    db_session.add(RecipeIngredient(
        id=uuid4(), recipe_id=r2.id, line_order=1,
        name="Sucre", quantity=1, unit="sachet",
    ))
    db_session.commit()

    client.post("/planning", headers=headers, json={
        "date": today.isoformat(), "slot": "midi", "recipe_id": str(r1.id),
    })
    client.post("/planning", headers=headers, json={
        "date": today.isoformat(), "slot": "soir", "recipe_id": str(r2.id),
    })

    resp = client.get(f"/planning/shopping-list?start={today.isoformat()}&end={today.isoformat()}", headers=headers)
    items = resp.json()
    sucre_items = [i for i in items if i["name"] == "Sucre"]
    assert len(sucre_items) == 2
    units = {(i["quantity"], i["unit"]) for i in sucre_items}
    assert (100, "g") in units
    assert (1, "sachet") in units


def test_user_isolation(client, db_session):
    user_a, headers_a = create_test_user(db_session, "isoa@test.com", "A")
    user_b, headers_b = create_test_user(db_session, "isob@test.com", "B")
    today = date.today()

    r = create_test_recipe(db_session, user_a.id, "Publique", "public")

    client.post("/planning", headers=headers_a, json={
        "date": today.isoformat(), "slot": "midi", "recipe_id": str(r.id),
    })

    resp = client.get(f"/planning?start={today.isoformat()}&end={today.isoformat()}", headers=headers_b)
    assert resp.json() == []


def test_cannot_plan_private_recipe_of_another_user(client, db_session):
    user_a, _ = create_test_user(db_session, "privplana@test.com", "A")
    user_b, headers_b = create_test_user(db_session, "privplanb@test.com", "B")
    today = date.today()

    r = create_test_recipe(db_session, user_a.id, "Privee de A", "private")

    resp = client.post("/planning", headers=headers_b, json={
        "date": today.isoformat(), "slot": "midi", "recipe_id": str(r.id),
    })
    assert resp.status_code in (403, 404)


def test_can_plan_own_private_recipe(client, db_session):
    user, headers = create_test_user(db_session, "ownpriv@test.com", "Chef")
    today = date.today()

    r = create_test_recipe(db_session, user.id, "Ma privee", "private")

    resp = client.post("/planning", headers=headers, json={
        "date": today.isoformat(), "slot": "midi", "recipe_id": str(r.id),
    })
    assert resp.status_code == 201


def test_slot_conflict_rejected(client, db_session):
    user, headers = create_test_user(db_session, "conflict@test.com", "Chef")
    today = date.today()

    r1 = create_test_recipe(db_session, user.id, "R1", "public")
    r2 = create_test_recipe(db_session, user.id, "R2", "public")

    client.post("/planning", headers=headers, json={
        "date": today.isoformat(), "slot": "midi", "recipe_id": str(r1.id),
    })
    resp = client.post("/planning", headers=headers, json={
        "date": today.isoformat(), "slot": "midi", "recipe_id": str(r2.id),
    })
    assert resp.status_code == 409