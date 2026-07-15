"""Test d'integration : permissions de lecture des recettes personnelles.

Regle metier :
- Recette publique de A : listee dans explore et lisible par B (200)
- Recette privee de A : ni listee ni lisible par B (403 ou 404)
- Recette privee de A : lisible par A lui-meme (200)
"""
from tests.conftest import create_test_user, create_test_recipe


def test_public_recipe_accessible_by_other_user(client, db_session):
    """B peut lire une recette publique de A. (Ce test echoue avant le fix.)"""
    user_a, headers_a = create_test_user(db_session, "a@test.com", "Alice")
    user_b, headers_b = create_test_user(db_session, "b@test.com", "Bob")

    recipe = create_test_recipe(
        db_session, owner_user_id=user_a.id,
        title="Recette publique d'Alice",
        visibility="public",
    )

    resp = client.get(f"/recipes/{recipe.id}", headers=headers_b)
    assert resp.status_code == 200, (
        f"B doit pouvoir lire la recette publique de A (attendu 200, obtenu {resp.status_code})"
    )
    data = resp.json()
    assert data["title"] == "Recette publique d'Alice"


def test_public_recipe_appears_in_explore(client, db_session):
    """Une recette publique de A apparait dans explore pour B."""
    user_a, _ = create_test_user(db_session, "a2@test.com", "Alice")
    user_b, headers_b = create_test_user(db_session, "b2@test.com", "Bob")

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
    assert public_section is not None, "La section 'Toutes les recettes' doit exister"
    titles = [r["title"] for r in public_section["recipes"]]
    assert "Explore publique" in titles


def test_private_recipe_not_listed_nor_readable_by_other(client, db_session):
    """B ne peut ni voir ni lister une recette privee de A."""
    user_a, _ = create_test_user(db_session, "a3@test.com", "Alice")
    user_b, headers_b = create_test_user(db_session, "b3@test.com", "Bob")

    recipe = create_test_recipe(
        db_session, owner_user_id=user_a.id,
        title="Recette privee d'Alice",
        visibility="private",
    )

    resp = client.get(f"/recipes/{recipe.id}", headers=headers_b)
    assert resp.status_code in (403, 404), (
        f"B ne doit pas acceder a la recette privee de A (attendu 403/404, obtenu {resp.status_code})"
    )

    resp_explore = client.get("/recipes/explore", headers=headers_b)
    sections = resp_explore.json()
    public_section = next(
        (s for s in sections if s["title"] == "Toutes les recettes"), None
    )
    private_in_explore = any(
        r["title"] == "Recette privee d'Alice"
        for s in sections
        for r in s.get("recipes", [])
    )
    assert not private_in_explore, "La recette privee ne doit pas apparaitre dans explore"


def test_private_recipe_readable_by_owner(client, db_session):
    """A peut lire sa propre recette privee."""
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
    """A peut lire sa propre recette publique (regression)."""
    user_a, headers_a = create_test_user(db_session, "a5@test.com", "Alice")

    recipe = create_test_recipe(
        db_session, owner_user_id=user_a.id,
        title="Ma publique",
        visibility="public",
    )

    resp = client.get(f"/recipes/{recipe.id}", headers=headers_a)
    assert resp.status_code == 200