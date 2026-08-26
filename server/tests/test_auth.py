import uuid

from app.models.user import User
from app.models.user_preference import UserPreference

PASSWORD = "MotDePasse2026"


def _register(client, email=None, password=PASSWORD):
    email = email or f"user-{uuid.uuid4().hex[:8]}@cuisine.fr"
    response = client.post(
        "/auth/register",
        json={"email": email, "password": password, "display_name": "Testeur"},
    )
    assert response.status_code == 201, response.text
    return email, response.json()


def _stored_hash(db_session, email):
    db_session.expire_all()
    user = db_session.query(User).filter(User.email == email).first()
    assert user is not None
    return user.password_hash


def test_register_ne_stocke_pas_le_mot_de_passe_en_clair(client, db_session):
    email, _ = _register(client)

    stored = _stored_hash(db_session, email)
    assert stored != PASSWORD
    assert PASSWORD not in stored
    assert stored.startswith("$2b$12$")
    assert len(stored) == 60


def test_deux_comptes_avec_le_meme_mot_de_passe_ont_des_hash_differents(
    client, db_session
):
    email_a, _ = _register(client, email="a@cuisine.fr")
    email_b, _ = _register(client, email="b@cuisine.fr")

    assert _stored_hash(db_session, email_a) != _stored_hash(db_session, email_b)


def test_le_hash_stocke_ne_permet_pas_de_se_connecter(client, db_session):
    email, _ = _register(client)
    stored = _stored_hash(db_session, email)

    response = client.post("/auth/login", json={"email": email, "password": stored})
    assert response.status_code == 401


def test_login_avec_le_bon_mot_de_passe_delivre_un_token_utilisable(client):
    email, _ = _register(client)

    response = client.post("/auth/login", json={"email": email, "password": PASSWORD})
    assert response.status_code == 200
    token = response.json()["access_token"]

    me = client.get("/users/me", headers={"Authorization": f"Bearer {token}"})
    assert me.status_code == 200
    assert me.json()["email"] == email


def test_login_avec_un_mauvais_mot_de_passe_est_refuse(client):
    email, _ = _register(client)

    response = client.post(
        "/auth/login", json={"email": email, "password": PASSWORD + "x"}
    )
    assert response.status_code == 401


def test_login_avec_un_email_inconnu_est_refuse(client):
    response = client.post(
        "/auth/login", json={"email": "personne@cuisine.fr", "password": PASSWORD}
    )
    assert response.status_code == 401


def test_un_mot_de_passe_stocke_en_clair_ne_permet_pas_de_se_connecter(
    client, db_session
):
    user_id = uuid.uuid4()
    db_session.add(
        User(
            id=user_id,
            email="legacy@cuisine.fr",
            password_hash="motdepasseenclair",
            display_name="Compte historique",
        )
    )
    db_session.add(UserPreference(user_id=user_id))
    db_session.commit()

    response = client.post(
        "/auth/login",
        json={"email": "legacy@cuisine.fr", "password": "motdepasseenclair"},
    )
    assert response.status_code == 401


def test_changer_de_mot_de_passe_invalide_l_ancien(client, db_session):
    email, payload = _register(client)
    headers = {"Authorization": f"Bearer {payload['access_token']}"}
    nouveau = "NouveauSecret2026"

    patch = client.patch("/users/me", json={"password": nouveau}, headers=headers)
    assert patch.status_code == 200

    stored = _stored_hash(db_session, email)
    assert stored.startswith("$2b$")
    assert nouveau not in stored

    ancien = client.post("/auth/login", json={"email": email, "password": PASSWORD})
    assert ancien.status_code == 401

    actuel = client.post("/auth/login", json={"email": email, "password": nouveau})
    assert actuel.status_code == 200


def test_l_api_ne_permet_pas_d_ecrire_directement_le_hash(client, db_session):
    email, payload = _register(client)
    headers = {"Authorization": f"Bearer {payload['access_token']}"}
    hash_initial = _stored_hash(db_session, email)

    response = client.patch(
        "/users/me", json={"password_hash": "valeur-choisie"}, headers=headers
    )

    assert response.status_code in (200, 422)
    assert _stored_hash(db_session, email) == hash_initial
    assert (
        client.post(
            "/auth/login", json={"email": email, "password": "valeur-choisie"}
        ).status_code
        == 401
    )


def test_mot_de_passe_trop_court_refuse(client):
    response = client.post(
        "/auth/register",
        json={"email": "court@cuisine.fr", "password": "abc1234", "display_name": None},
    )
    assert response.status_code == 422


def test_mot_de_passe_trop_long_en_octets_refuse(client):
    mot_de_passe = "é" * 40

    response = client.post(
        "/auth/register",
        json={
            "email": "long@cuisine.fr",
            "password": mot_de_passe,
            "display_name": None,
        },
    )
    assert response.status_code == 422
