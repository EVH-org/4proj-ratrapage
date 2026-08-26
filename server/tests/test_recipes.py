from tests.conftest import create_test_user, create_test_recipe


def test_public_recipe_accessible_by_other_user(client, db_session):
    user_a, _ = create_test_user(db_session, "a@test.com", "Alice")
    _, headers_b = create_test_user(db_session, "b@test.com", "Bob")

    recipe = create_test_recipe(
        db_session, owner_user_id=user_a.id,
        title="Recette publique d'Alice",
        visibility="public",
    )

    resp = client.get(f"/recipes/{recipe.id}", headers=headers_b)
    assert resp.status_code == 200
    assert resp.json()["title"] == "Recette publique d'Alice"


def test_public_recipe_appears_in_explore(client, db_session):
    user_a, _ = create_test_user(db_session, "a2@test.com", "Alice")
    _, headers_b = create_test_user(db_session, "b2@test.com", "Bob")

    create_test_recipe(
        db_session, owner_user_id=user_a.id,
        title="Explore publique",
        visibility="public",
    )

    resp = client.get("/recipes/explore", headers=headers_b)
    assert resp.status_code == 200
    sections = resp.json()
    public_section = next(
        (s for s in sections if s["title"] == "Toutes les recettes"), None
    )
    assert public_section is not None
    titles = [r["title"] for r in public_section["recipes"]]
    assert "Explore publique" in titles


def test_private_recipe_not_listed_nor_readable_by_other(client, db_session):
    user_a, _ = create_test_user(db_session, "a3@test.com", "Alice")
    _, headers_b = create_test_user(db_session, "b3@test.com", "Bob")

    recipe = create_test_recipe(
        db_session, owner_user_id=user_a.id,
        title="Recette privee d'Alice",
        visibility="private",
    )

    resp = client.get(f"/recipes/{recipe.id}", headers=headers_b)
    assert resp.status_code in (403, 404)

    resp_explore = client.get("/recipes/explore", headers=headers_b)
    sections = resp_explore.json()
    private_in_explore = any(
        r["title"] == "Recette privee d'Alice"
        for s in sections
        for r in s.get("recipes", [])
    )
    assert not private_in_explore


def test_private_recipe_readable_by_owner(client, db_session):
    user_a, headers_a = create_test_user(db_session, "a4@test.com", "Alice")

    recipe = create_test_recipe(
        db_session, owner_user_id=user_a.id,
        title="Ma recette privee",
        visibility="private",
    )

    resp = client.get(f"/recipes/{recipe.id}", headers=headers_a)
    assert resp.status_code == 200
    assert resp.json()["title"] == "Ma recette privee"


def test_owner_reads_public_recipe(client, db_session):
    user_a, headers_a = create_test_user(db_session, "a5@test.com", "Alice")

    recipe = create_test_recipe(
        db_session, owner_user_id=user_a.id,
        title="Ma publique",
        visibility="public",
    )

    resp = client.get(f"/recipes/{recipe.id}", headers=headers_a)
    assert resp.status_code == 200