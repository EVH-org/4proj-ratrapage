# SUPMEAL — Documentation technique

SUPMEAL est une application web de gestion de recettes de cuisine. Elle permet de créer et partager des recettes, de les regrouper dans des carnets collaboratifs (*cookbooks*) avec gestion de rôles, de planifier ses repas sur un calendrier hebdomadaire et d'en générer automatiquement la liste de courses.

- **Dépôt** : [github.com/EVH-org/4proj-ratrapage](https://github.com/EVH-org/4proj-ratrapage)
- **Auteur** : Eliot Varigault-Halope

**Sommaire**

1. [Périmètre fonctionnel](#1-périmètre-fonctionnel)
2. [Stack technique](#2-stack-technique)
3. [Architecture et arborescence](#3-architecture-et-arborescence)
4. [Configuration](#4-configuration)
5. [Installation et lancement](#5-installation-et-lancement)
6. [Modèle de données](#6-modèle-de-données)
7. [Migrations de base de données](#7-migrations-de-base-de-données)
8. [API REST](#8-api-rest)
9. [Authentification et autorisations](#9-authentification-et-autorisations)
10. [Stockage des images](#10-stockage-des-images)
11. [Frontend](#11-frontend)
12. [Tests](#12-tests)
13. [Qualité du code](#13-qualité-du-code)
14. [Limites connues et pistes d'évolution](#14-limites-connues-et-pistes-dévolution)

---

## 1. Périmètre fonctionnel

| Domaine | Fonctionnalités |
|---|---|
| Comptes | Inscription, connexion, consultation et modification du profil, suppression de compte |
| Préférences | Nombre de portions par défaut, régimes, allergies, cuisines favorites |
| Recettes | Création avec ingrédients ordonnés, étapes ordonnées et tags ; visibilité publique ou privée ; photo ; favoris ; import et export JSON |
| Recherche | Recherche plein texte sur le titre et la description, filtrage par tags et par temps de préparation ou de cuisson, tri paginé |
| Exploration | Page d'accueil composée de sections thématiques générées dynamiquement (mes recettes, favoris, recettes publiques, sections par tag) |
| Cookbooks | Carnets de recettes partagés, visibilité publique ou privée, gestion des membres avec trois rôles, invitations par token à durée limitée |
| Planning | Affectation d'une recette à un créneau (midi ou soir) pour une date donnée, un seul plat par créneau |
| Liste de courses | Agrégation automatique des ingrédients des repas planifiés sur une période, avec regroupement par nom et unité |

---

## 2. Stack technique

### Backend

| Composant | Version | Rôle |
|---|---|---|
| Python | 3.12 | Runtime (image `python:3.12-slim`) |
| FastAPI | 0.138.1 | Framework web et génération OpenAPI |
| Uvicorn | 0.49.0 | Serveur ASGI |
| SQLAlchemy | 2.0.51 | ORM (API `Mapped` / `mapped_column`) |
| Pydantic | 2.13.4 | Validation des entrées et sérialisation des sorties |
| Alembic | 1.18.5 | Migrations de schéma et de données |
| PostgreSQL | 16 | Base de données (image `postgres:16-alpine`) |
| psycopg | 3.2.6 | Pilote PostgreSQL |
| PyJWT | 2.9.0 | Émission et vérification des jetons JWT (HS256) |
| bcrypt | 5.0.0 | Hachage des mots de passe |
| boto3 | 1.34.131 | Client S3 pour MinIO (URLs pré-signées) |
| pytest | 9.1.1 | Tests |
| ruff | 0.15.20 | Linter |

### Frontend

| Composant | Version | Rôle |
|---|---|---|
| Node | 20 | Runtime de build (image `node:20-alpine`) |
| React | 19.2.7 | Bibliothèque d'interface |
| React Router DOM | 7.18.1 | Routage côté client |
| Vite | 8.1.0 | Bundler et serveur de développement |
| lucide-react | 1.24.0 | Jeu d'icônes SVG |
| ESLint | 10.5.0 | Linter |

Les styles sont écrits en CSS natif avec variables CSS, sans framework CSS.

### Infrastructure

Cinq services orchestrés par Docker Compose :

| Service | Image ou source | Ports | Rôle |
|---|---|---|---|
| `db` | `postgres:16-alpine` | 5432 | Base de données, volume `postgres_data`, *healthcheck* `pg_isready` |
| `api` | build `./server` | 8000 | API FastAPI, démarre après le *healthcheck* de `db` |
| `web` | build `./client` | 5173 | Serveur de développement Vite |
| `minio` | `minio/minio` | 9000, 9001 | Stockage objet compatible S3, volume `minio_data` |
| `minio-init` | `minio/mc` | — | Conteneur éphémère qui crée le *bucket* au premier démarrage |

---

## 3. Architecture et arborescence

L'application suit une séparation en couches côté backend : les routeurs FastAPI valident et autorisent, la couche `crud` porte les requêtes SQLAlchemy, les modèles décrivent le schéma et les schémas Pydantic définissent le contrat d'entrée et de sortie.

```text
├── docker-compose.yml            # Orchestration des cinq services
├── .env.example                  # Variables d'environnement de référence
├── README.md
│
├── client/                       # Frontend React
│   ├── Dockerfile
│   ├── eslint.config.js
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── public/
│   │   └── favicon.svg
│   └── src/
│       ├── main.jsx              # Point d'entrée, déclaration des routes
│       ├── App.jsx
│       ├── components/
│       │   ├── layout/
│       │   │   └── AppLayout.jsx # Gabarit avec Navbar et Outlet
│       │   ├── recipes/          # ImageUploader, IngredientRow, RecipeCard,
│       │   │                     # SearchBar, StepRow
│       │   └── ui/               # Button, Card, Input, Navbar, Tag, TagInput
│       ├── lib/
│       │   ├── api.js            # Client HTTP, injection du jeton
│       │   ├── auth.js           # Connexion, inscription, déconnexion
│       │   └── shared.js         # Utilitaires partagés
│       ├── pages/                # Une vue par route (16 pages)
│       └── styles/
│           ├── theme.css         # Variables CSS (couleurs, espacements)
│           ├── globals.css
│           └── animations.css
│
└── server/                       # Backend FastAPI
    ├── Dockerfile
    ├── alembic.ini
    ├── requirements.txt
    ├── seed.py                   # Peuplement de démonstration
    ├── app/
    │   ├── main.py               # Application FastAPI, CORS, routeurs, /health
    │   ├── security.py           # JWT et hachage bcrypt
    │   ├── core/
    │   │   └── config.py         # Lecture des variables d'environnement
    │   ├── db/
    │   │   ├── base.py           # Base déclarative SQLAlchemy
    │   │   └── session.py        # Engine et dépendance get_db
    │   ├── models/               # cookbook, meal_plan, recipe, user,
    │   │                         # user_preference
    │   ├── schemas/              # Schémas Pydantic par domaine
    │   ├── crud/                 # cookbook, recipe, user
    │   ├── routes/               # auth, users, preferences, cookbooks,
    │   │                         # recipes, planning
    │   └── storage/
    │       └── s3.py             # URLs pré-signées MinIO
    ├── migrations/               # Scripts Alembic
    │   ├── env.py
    │   └── versions/             # 9 révisions
    └── tests/                    # 27 tests pytest
        ├── conftest.py
        ├── test_auth.py
        ├── test_migration_0009.py
        ├── test_planning.py
        └── test_recipes.py
```

---

## 4. Configuration

### Backend

Le fichier `.env` à la racine est chargé par `python-dotenv` et injecté dans le conteneur `api` via `env_file`. `.env.example` sert de référence.

| Variable | Exemple | Description |
|---|---|---|
| `POSTGRES_DB` | `supmeal` | Nom de la base créée par le conteneur `db` |
| `POSTGRES_USER` | `supmeal` | Utilisateur PostgreSQL |
| `POSTGRES_PASSWORD` | `changeme` | Mot de passe PostgreSQL |
| `DATABASE_URL` | `postgresql+psycopg://supmeal:supmeal@db:5432/supmeal` | Chaîne de connexion SQLAlchemy |
| `CORS_ORIGINS` | `http://localhost:5173` | Origines autorisées, séparées par des virgules |
| `SECRET_KEY` | `change-me-dev` | Clé de signature des JWT. Son absence provoque une erreur 500 à la connexion |
| `JWT_EXPIRES_MINUTES` | `1440` | Durée de validité du jeton, en minutes |
| `S3_ENDPOINT` | `http://minio:9000` | Endpoint MinIO ou S3 |
| `S3_ACCESS_KEY` | `minioadmin` | Clé d'accès |
| `S3_SECRET_KEY` | `minioadmin` | Clé secrète |
| `S3_BUCKET` | `supmeal` | Nom du *bucket* |
| `S3_REGION` | `us-east-1` | Région, requise par la signature v4 |
| `S3_SECURE` | `false` | Lue par la configuration mais non utilisée à ce jour |

> `DATABASE_URL` et `S3_ENDPOINT` utilisent les noms d'hôtes du réseau Docker (`db`, `minio`). Pour un lancement hors Docker, remplacer les deux par `localhost`.

### Frontend

| Variable | Défaut | Description |
|---|---|---|
| `VITE_API_URL` | `http://localhost:8000` | URL de base de l'API, lue dans `client/src/lib/api.js` |

Elle n'est pas définie dans `docker-compose.yml` : le navigateur atteint l'API par la valeur par défaut, le port 8000 étant publié sur l'hôte. Elle devient nécessaire dès que l'API est exposée sur un autre domaine.

---

## 5. Installation et lancement

### Prérequis

- Docker et Docker Compose
- ou, pour un lancement manuel : Node.js 20+, Python 3.12, PostgreSQL 16, MinIO

### Avec Docker Compose

```bash
cp .env.example .env
docker compose up --build
```

Le conteneur `api` applique les migrations avant de démarrer Uvicorn (`alembic upgrade head && uvicorn app.main:app`), aucune étape manuelle n'est nécessaire.

| Interface | URL | Identifiants |
|---|---|---|
| Frontend | http://localhost:5173 | — |
| API | http://localhost:8000 | — |
| Documentation OpenAPI | http://localhost:8000/docs | — |
| Console MinIO | http://localhost:9001 | `minioadmin` / `minioadmin` |

Données de démonstration (optionnel) :

```bash
docker compose exec api python seed.py
```

Le script est idempotent : il s'interrompt si le compte `testchef@cuisine.fr` existe déjà. Il crée trois utilisateurs, un cookbook public et un jeu de recettes.

| Compte | Mot de passe |
|---|---|
| `testchef@cuisine.fr` | `chefpassword` |
| `marie@cuisine.fr` | `password` |
| `paul@cuisine.fr` | `password` |

Arrêt des services :

```bash
docker compose down          # conserve les volumes
docker compose down -v       # supprime les données
```

### Lancement manuel

Une instance PostgreSQL et une instance MinIO doivent être démarrées et déclarées dans `.env`, avec `localhost` en lieu et place des noms d'hôtes Docker.

Backend :

```bash
cd server
python -m venv .venv
source .venv/bin/activate          # Windows : .venv\Scripts\Activate.ps1
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload --port 8000
```

Frontend :

```bash
cd client
npm install
npm run dev
```

---

## 6. Modèle de données

Douze tables. Toutes les clés primaires sont des UUID, à l'exception des tables d'association qui utilisent une clé composite. Les suppressions sont propagées par `ON DELETE CASCADE`.

### `users`

| Colonne | Type | Contraintes |
|---|---|---|
| `id` | UUID | Clé primaire |
| `email` | varchar(255) | Unique, non nul |
| `password_hash` | varchar(255) | Nullable, hash bcrypt |
| `display_name` | varchar(255) | Nullable |
| `role` | varchar(50) | Non nul, défaut `user` |
| `created_at`, `updated_at` | timestamptz | `updated_at` mis à jour automatiquement |

### `user_preferences`

Relation un-à-un avec `users`, la clé étrangère servant de clé primaire.

| Colonne | Type | Contraintes |
|---|---|---|
| `user_id` | UUID | Clé primaire, FK `users.id` |
| `default_servings` | integer | Nullable |
| `diets`, `allergies`, `favorite_cuisines` | JSON | Nullable, listes de chaînes |

### `cookbooks`

| Colonne | Type | Contraintes |
|---|---|---|
| `id` | UUID | Clé primaire |
| `owner_user_id` | UUID | FK `users.id`, cascade |
| `name` | varchar(255) | Non nul |
| `description` | varchar(1000) | Nullable |
| `visibility` | varchar(50) | Non nul, défaut `private`, valeurs `public` ou `private` |
| `created_at`, `updated_at` | timestamptz | |

### `cookbook_members`

| Colonne | Type | Contraintes |
|---|---|---|
| `cookbook_id` | UUID | Clé primaire composite, FK `cookbooks.id` |
| `user_id` | UUID | Clé primaire composite, FK `users.id` |
| `role` | varchar(50) | Non nul, défaut `reader`, valeurs `owner`, `editor` ou `reader` |
| `joined_at` | timestamptz | |

### `cookbook_invitations`

| Colonne | Type | Contraintes |
|---|---|---|
| `id` | UUID | Clé primaire |
| `cookbook_id` | UUID | FK `cookbooks.id`, cascade |
| `token` | varchar(255) | Unique, non nul |
| `role_assigned` | varchar(50) | Non nul, défaut `reader`, valeurs `reader` ou `editor` |
| `expires_at` | timestamptz | Non nul |
| `status` | varchar(50) | Non nul, défaut `pending`, valeurs `pending`, `accepted` ou `declined` |
| `created_at` | timestamptz | |

### `recipes`

Une recette appartient soit à un utilisateur (`scope_type = personal`), soit à un cookbook (`scope_type = cookbook`) ; les deux clés étrangères sont donc nullables et mutuellement exclusives.

| Colonne | Type | Contraintes |
|---|---|---|
| `id` | UUID | Clé primaire |
| `scope_type` | varchar(50) | Non nul, valeurs `personal` ou `cookbook` |
| `visibility` | varchar(50) | Non nul, défaut `public`, valeurs `public` ou `private` |
| `owner_user_id` | UUID | Nullable, FK `users.id` — renseigné si `scope_type = personal` |
| `cookbook_id` | UUID | Nullable, FK `cookbooks.id` — renseigné si `scope_type = cookbook` |
| `title` | varchar(255) | Non nul |
| `description` | varchar(1000) | Nullable |
| `prep_time_minutes`, `cook_time_minutes`, `servings` | integer | Nullable |
| `source_url` | varchar(500) | Nullable |
| `image_url` | varchar(500) | Nullable |
| `image_object_key` | varchar(500) | Nullable, clé de l'objet dans le *bucket* |
| `created_by_user_id` | UUID | Non nul, FK `users.id` |
| `created_at`, `updated_at` | timestamptz | |

### `recipe_steps`

| Colonne | Type | Contraintes |
|---|---|---|
| `id` | UUID | Clé primaire |
| `recipe_id` | UUID | FK `recipes.id`, cascade |
| `step_order` | integer | Non nul |
| `instruction` | varchar(1000) | Non nul |

Contrainte d'unicité `uq_recipe_steps_order` sur `(recipe_id, step_order)`.

### `recipe_ingredients`

| Colonne | Type | Contraintes |
|---|---|---|
| `id` | UUID | Clé primaire |
| `recipe_id` | UUID | FK `recipes.id`, cascade |
| `line_order` | integer | Non nul |
| `name` | varchar(255) | Non nul |
| `quantity` | float | Nullable |
| `unit` | varchar(50) | Nullable |
| `note` | varchar(255) | Nullable |

Contrainte d'unicité `uq_recipe_ingredients_order` sur `(recipe_id, line_order)`.

### `tags` et `recipe_tags`

`tags` porte un `label` unique en varchar(100). `recipe_tags` est la table d'association, de clé primaire composite `(recipe_id, tag_id)`, avec la contrainte `uq_recipe_tags_recipe_tag`. Les libellés sont normalisés en minuscules et dédupliqués avant enregistrement : un tag existant est réutilisé plutôt que dupliqué.

### `recipe_favorites`

Clé primaire composite `(user_id, recipe_id)`, contrainte `uq_recipe_favorites_user_recipe`, colonne `created_at`.

### `meal_plan_entries`

| Colonne | Type | Contraintes |
|---|---|---|
| `id` | UUID | Clé primaire |
| `user_id` | UUID | Non nul, FK `users.id`, cascade |
| `date` | date | Non nul |
| `slot` | varchar(10) | Non nul, valeurs `midi` ou `soir` |
| `recipe_id` | UUID | Non nul, FK `recipes.id`, cascade |
| `created_at` | timestamptz | |

Contrainte d'unicité `uq_meal_plan_user_date_slot` sur `(user_id, date, slot)` : elle garantit au niveau de la base qu'un utilisateur ne peut pas planifier deux plats sur le même créneau.

---

## 7. Migrations de base de données

Neuf révisions, chaînées linéairement. `migrations/env.py` surcharge la valeur `sqlalchemy.url` d'`alembic.ini` avec `DATABASE_URL` : seule la variable d'environnement est prise en compte.

| Révision | Objet |
|---|---|
| `0001` | Tables `users` et `user_preferences` |
| `0002` | Colonne `role` sur `users` |
| `0003` | Tables `cookbooks`, `cookbook_members` et `cookbook_invitations` |
| `1201debb1295` | Tables `recipes`, `recipe_steps` et `recipe_ingredients` |
| `0005` | Tables `tags`, `recipe_tags` et `recipe_favorites` |
| `0006` | Colonne `image_url` sur `recipes` |
| `0007` | Colonne `visibility` sur `recipes` |
| `0008` | Table `meal_plan_entries` |
| `0009` | Migration de données : hachage des mots de passe stockés en clair |

La numérotation saute `0004`, la révision correspondante ayant été générée automatiquement sous l'identifiant `1201debb1295`. La chaîne est complète et ne présente qu'une seule tête.

Commandes usuelles :

```bash
alembic upgrade head          # appliquer toutes les migrations
alembic downgrade -1          # revenir d'une révision
alembic history               # afficher la chaîne
alembic heads                 # vérifier l'unicité de la tête
```

La révision `0009` est idempotente : elle ignore les valeurs déjà au format bcrypt et peut être rejouée sans effet de bord. Son `downgrade` est volontairement vide, un hash n'étant pas réversible.

---

## 8. API REST

47 points d'entrée. La documentation interactive générée par FastAPI est disponible sur `/docs`, le schéma OpenAPI brut sur `/openapi.json`.

La colonne « Auth » indique :

- **non** — accessible sans jeton ;
- **oui** — jeton obligatoire ;
- **opt.** — jeton facultatif, la réponse dépend de sa présence.

### Système

| Méthode | Chemin | Auth | Description |
|---|---|---|---|
| `GET` | `/` | non | Identité du service et lien vers la documentation |
| `GET` | `/health` | non | Vivacité de l'API |
| `GET` | `/health/db` | non | Exécute `SELECT 1` sur la base |

### Authentification

| Méthode | Chemin | Auth | Description |
|---|---|---|---|
| `POST` | `/auth/register` | non | Création de compte, renvoie `201` et un jeton |
| `POST` | `/auth/login` | non | Connexion, renvoie un jeton ou `401` |

Corps attendu : `email`, `password` et, à l'inscription, `display_name` facultatif. Réponse : `access_token`, `token_type` et `user_id`. L'inscription crée aussi la ligne `user_preferences` associée.

### Utilisateurs

| Méthode | Chemin | Auth | Description |
|---|---|---|---|
| `GET` | `/users/me` | oui | Profil courant |
| `PATCH` | `/users/me` | oui | Modification de `display_name` ou `password` |
| `DELETE` | `/users/me` | oui | Suppression du compte, `204` |
| `GET` | `/users/me/recipes` | oui | Recettes de l'utilisateur, paramètres `page` et `page_size` |
| `GET` | `/users` | oui | Liste des comptes, paramètres `skip` et `limit` |
| `GET` | `/users/{user_id}` | oui | Profil d'un compte |

### Préférences

| Méthode | Chemin | Auth | Description |
|---|---|---|---|
| `GET` | `/preferences/me` | oui | Préférences courantes |
| `PATCH` | `/preferences/me` | oui | Modification partielle |
| `GET` | `/preferences/{user_id}` | oui | Préférences d'un utilisateur |

### Cookbooks

| Méthode | Chemin | Auth | Description |
|---|---|---|---|
| `POST` | `/cookbooks` | oui | Création, `201`. Le créateur devient membre `owner` |
| `GET` | `/cookbooks` | oui | Cookbooks dont l'utilisateur est membre, `skip` et `limit` |
| `GET` | `/cookbooks/{id}` | opt. | Détail. Un cookbook public est lisible sans jeton, un cookbook privé exige d'être membre |
| `PATCH` | `/cookbooks/{id}` | oui | Modification, réservée au rôle `owner` |
| `DELETE` | `/cookbooks/{id}` | oui | Suppression en cascade, réservée au rôle `owner`, `204` |

### Membres et invitations

| Méthode | Chemin | Auth | Description |
|---|---|---|---|
| `GET` | `/cookbooks/{id}/members` | oui | Liste des membres, réservée au rôle `owner` |
| `PATCH` | `/cookbooks/{id}/members/{user_id}` | oui | Changement de rôle vers `reader` ou `editor` |
| `DELETE` | `/cookbooks/{id}/members/{user_id}` | oui | Retrait d'un membre, `204` |
| `POST` | `/cookbooks/{id}/invitations` | oui | Création d'une invitation, `201` |
| `GET` | `/cookbooks/{id}/invitations` | oui | Invitations du cookbook |
| `PATCH` | `/cookbooks/{id}/invitations/{invitation_id}` | oui | Modification du rôle ou de l'expiration |
| `DELETE` | `/cookbooks/{id}/invitations/{invitation_id}` | oui | Annulation, `204` |
| `GET` | `/invitations/{token}` | non | Métadonnées publiques d'une invitation, pour l'écran d'acceptation |
| `POST` | `/invitations/{token}/accept` | oui | Acceptation, ajoute le membre avec le rôle prévu |
| `POST` | `/invitations/{token}/decline` | oui | Refus |

Le propriétaire ne peut être ni rétrogradé ni retiré. Les rôles assignables par invitation sont limités à `reader` et `editor`. Une invitation est refusée si elle n'est plus au statut `pending` ou si `expires_at` est dépassé.

### Recettes

| Méthode | Chemin | Auth | Description |
|---|---|---|---|
| `POST` | `/recipes` | oui | Création avec ingrédients, étapes et tags, `201` |
| `GET` | `/recipes` | oui | Liste paginée. Paramètres `scope` (`personal` ou `cookbook`), `cookbook_id`, `favorites_only`, `page`, `page_size` |
| `GET` | `/recipes/explore` | oui | Sections thématiques pour la page d'exploration |
| `GET` | `/recipes/search` | oui | Recherche multicritère, voir ci-dessous |
| `GET` | `/recipes/{id}` | opt. | Détail, soumis aux règles de visibilité |
| `PATCH` | `/recipes/{id}` | oui | Modification. Les listes d'étapes et d'ingrédients sont remplacées intégralement |
| `DELETE` | `/recipes/{id}` | oui | Suppression, avec l'image associée, `204` |
| `POST` | `/recipes/{id}/image/presign` | oui | URL de téléversement direct vers MinIO |
| `DELETE` | `/recipes/{id}/image` | oui | Suppression de l'image, `204` |
| `GET` | `/recipes/{id}/export` | opt. | Export JSON de la recette |
| `POST` | `/recipes/import` | oui | Import depuis un JSON, `201`. Paramètres `scope_type` et `cookbook_id` |
| `POST` | `/recipes/{id}/favorite` | oui | Ajout aux favoris |
| `DELETE` | `/recipes/{id}/favorite` | oui | Retrait des favoris |
| `GET` | `/tags` | oui | Liste des tags existants |

Paramètres de `GET /recipes/search` :

| Paramètre | Type | Défaut | Description |
|---|---|---|---|
| `q` | chaîne | — | Recherche insensible à la casse sur le titre et la description |
| `tags` | chaîne | — | Libellés séparés par des virgules, comparaison insensible à la casse |
| `prep_time_min`, `prep_time_max` | entier ≥ 0 | — | Bornes sur le temps de préparation |
| `cook_time_min`, `cook_time_max` | entier ≥ 0 | — | Bornes sur le temps de cuisson |
| `sort_by` | énumération | `created_at` | `created_at`, `title`, `prep_time` ou `cook_time` |
| `sort_order` | énumération | `desc` | `asc` ou `desc` |
| `page` | entier ≥ 1 | 1 | Numéro de page |
| `page_size` | entier 1–100 | 20 | Taille de page |

Le périmètre de la recherche est limité aux recettes personnelles publiques et aux recettes personnelles de l'utilisateur. Les recettes de cookbook n'y apparaissent pas.

Contraintes de validation des recettes : titre ≤ 255 caractères, description et instruction ≤ 1000, `servings` ≥ 1, temps ≥ 0, 10 tags maximum, chaque tag validé par l'expression `^[a-zA-Z0-9À-ÿ\- ]{2,30}$`.

### Planning et liste de courses

| Méthode | Chemin | Auth | Description |
|---|---|---|---|
| `GET` | `/planning` | oui | Repas planifiés. Paramètres `start` et `end` obligatoires, au format `YYYY-MM-DD` |
| `POST` | `/planning` | oui | Ajout d'une recette sur un créneau, `201` |
| `DELETE` | `/planning/{entry_id}` | oui | Suppression d'une entrée, `204` |
| `GET` | `/planning/shopping-list` | oui | Liste de courses agrégée. Paramètres `start` et `end` obligatoires |

`POST /planning` renvoie `404` si la recette est introuvable, `403` si elle n'est pas lisible par l'utilisateur et `409` si le créneau est déjà occupé.

La liste de courses regroupe les ingrédients par couple `(nom, unité)` et additionne les quantités. Deux unités différentes pour un même ingrédient restent deux lignes distinctes. Un ingrédient sans quantité est renvoyé avec une quantité nulle.

---

## 9. Authentification et autorisations

### Jetons

L'authentification repose sur des jetons JWT signés en HS256 avec `SECRET_KEY`. La charge utile contient l'identifiant utilisateur (`sub`) et une date d'expiration (`exp`) calculée depuis `JWT_EXPIRES_MINUTES`. Le jeton est transmis dans l'en-tête `Authorization: Bearer <token>` et vérifié par les dépendances `get_user_id` (obligatoire) et `get_optional_user_id` (facultatif). Côté client, il est conservé dans le `localStorage` et injecté par `lib/api.js`.

### Mots de passe

- Hachage bcrypt salé, coût 12. La base ne contient jamais le mot de passe en clair.
- Longueur imposée entre 8 et 72 octets. La borne haute est celle de bcrypt. Elle est exprimée en octets et non en caractères, un caractère accentué comptant pour deux octets en UTF-8 : un dépassement est rejeté en `422` plutôt que de produire une erreur serveur.
- Le hachage est réalisé côté serveur. L'API n'accepte que le mot de passe en clair, jamais le hash, y compris lors d'une modification de profil.
- Une valeur stockée qui n'est pas un hash bcrypt valide est refusée à la connexion sans lever d'exception.

### Visibilité des recettes

| `scope_type` | `visibility` | Lecture | Écriture |
|---|---|---|---|
| `personal` | `public` | Tout le monde, jeton non requis | Propriétaire uniquement |
| `personal` | `private` | Propriétaire uniquement | Propriétaire uniquement |
| `cookbook` | — | Cookbook public : tout le monde. Cookbook privé : membres uniquement | Rôles `owner` et `editor` |

Pour une recette de cookbook, c'est la visibilité du cookbook qui décide de l'accès, pas celle de la recette.

### Rôles dans un cookbook

| Action | `owner` | `editor` | `reader` |
|---|---|---|---|
| Lire les recettes | oui | oui | oui |
| Ajouter ou modifier une recette | oui | oui | non |
| Modifier ou supprimer le cookbook | oui | non | non |
| Gérer les membres et les invitations | oui | non | non |

---

## 10. Stockage des images

Les fichiers ne transitent pas par l'API : celle-ci ne délivre que des URLs pré-signées, valables une heure, et le navigateur dialogue directement avec MinIO.

1. Le client appelle `POST /recipes/{id}/image/presign` avec le nom du fichier et son type MIME.
2. L'API vérifie les droits d'écriture, construit la clé d'objet `recipes/{recipe_id}/{filename}`, l'enregistre dans `recipes.image_object_key` et renvoie une URL pré-signée en `PUT`.
3. Le navigateur téléverse le fichier directement sur cette URL.
4. À chaque lecture d'une recette, l'API génère une URL pré-signée en `GET` et la place dans le champ `image_url` de la réponse. Ce champ n'est donc pas persisté sous cette forme et doit être considéré comme éphémère.
5. La suppression d'une recette ou de son image supprime l'objet dans le *bucket*.

La signature utilise la version v4. Les échecs de génération d'URL de lecture et de suppression sont journalisés et ne remontent pas d'erreur au client, afin qu'une indisponibilité de MinIO n'empêche pas la consultation des recettes.

---

## 11. Frontend

Application React en page unique, rendue par Vite. Le routage est déclaré dans `src/main.jsx`.

| Route | Composant | Description |
|---|---|---|
| `/` | `Home` | Accueil |
| `/explore` | `Recipes` | Exploration par sections thématiques |
| `/recipes` | `GlobalRecipes` | Catalogue et recherche |
| `/recipes/new` | `RecipeCreate` | Création d'une recette |
| `/recipes/:recipeId` | `RecipeDetailPage` | Détail d'une recette |
| `/recipes/:recipeId/edit` | `RecipeEdit` | Modification |
| `/my-recipes` | `MyRecipes` | Recettes de l'utilisateur |
| `/cookbooks` | `Cookbooks` | Liste des cookbooks |
| `/cookbooks/new` | `CookbookCreate` | Création d'un cookbook |
| `/cookbooks/:cookbookId` | `CookbookDetailPage` | Détail, membres, invitations |
| `/planning` | `Planning` | Calendrier hebdomadaire et liste de courses |
| `/profile` | `Profile` | Profil et préférences |
| `/invite/:token` | `AcceptInvitation` | Acceptation d'une invitation |
| `*` | `NotFound` | Page inexistante |
| `/login` | `Login` | Connexion |
| `/register` | `Register` | Inscription |

Les routes du premier groupe sont imbriquées dans `AppLayout`, qui affiche la `Navbar`. `/login` et `/register` sont déclarées à l'extérieur et s'affichent donc sans navigation.

La protection des vues authentifiées est faite dans les pages elles-mêmes : en l'absence de jeton, elles redirigent vers `/login`. Il n'y a pas de composant de route protégée centralisé.

Le design system repose sur trois feuilles de style : `theme.css` déclare les variables CSS, `globals.css` les styles de base et `animations.css` les transitions. Les composants de `components/ui/` consomment ces variables.

---

## 12. Tests

27 tests pytest, exécutés sur une base SQLite en mémoire recréée pour chaque test. La dépendance `get_db` est remplacée par une session de test, ce qui évite toute dépendance à PostgreSQL.

```bash
cd server
pytest tests                    # suite complète
pytest tests -v                 # détail par test
pytest tests/test_auth.py       # un seul fichier
```

| Fichier | Tests | Périmètre |
|---|---|---|
| `test_auth.py` | 11 | Stockage des mots de passe, connexion, changement de mot de passe, validation des entrées |
| `test_recipes.py` | 5 | Visibilité publique et privée, accès par un tiers, présence dans l'exploration |
| `test_planning.py` | 6 | Agrégation de la liste de courses, séparation par unité, isolation entre utilisateurs, conflit de créneau, planification d'une recette privée |
| `test_migration_0009.py` | 5 | Migration de hachage : conversion, idempotence, hash existant préservé, valeurs limites |

Les tests d'authentification portent sur la propriété de sécurité et pas seulement sur le chemin nominal : ils vérifient notamment que la valeur stockée en base ne permet pas de s'authentifier, que deux comptes partageant le même mot de passe ont des hash distincts et qu'un mot de passe hérité stocké en clair est refusé. Cinq d'entre eux échouent si le hachage est retiré du code.

La migration `0009` est exercée sur une véritable base SQLite via le contexte Alembic, et non simulée.

Il n'existe pas de test frontend. La validation du client se limite au build et au lint :

```bash
cd client
npm run build
npm run lint
```

---

## 13. Qualité du code

Le backend est linté par ruff :

```bash
cd server
ruff check app tests migrations seed.py
ruff check --fix app             # corrections automatiques
```

Le frontend utilise ESLint 10 avec les plugins `react-hooks` et `react-refresh`, configurés dans `client/eslint.config.js`.

Aucune intégration continue n'est en place : les vérifications sont à lancer manuellement avant commit.

---

## 14. Limites connues et pistes d'évolution

Ces points sont identifiés et assumés dans l'état actuel du projet.

**Contrôle d'accès**

- `GET /users` et `GET /users/{user_id}` exposent la liste de tous les comptes, adresses e-mail comprises, à n'importe quel utilisateur authentifié. La colonne `users.role` existe mais n'est vérifiée nulle part : il n'y a pas de notion d'administrateur effective.
- `GET /preferences/{user_id}` permet de lire les préférences alimentaires d'un autre utilisateur.
- `GET /cookbooks/{id}/members` est réservé au rôle `owner`. Un `editor` ou un `reader` ne peut donc pas voir avec qui il partage un cookbook.

**Fonctionnel**

- La recherche ignore les recettes de cookbook. Seules les recettes personnelles, publiques ou appartenant à l'utilisateur, sont indexées.
- L'export JSON ne comprend pas les tags : un cycle export puis import les perd.
- La colonne `recipes.image_url` est redondante avec `image_object_key`, l'URL étant systématiquement recalculée à la lecture. Le champ `image_url` accepté par `PATCH /recipes/{id}` est d'ailleurs ignoré : il n'est pas repris dans la liste des champs appliqués.
- Le token d'invitation circule en clair dans l'URL de partage.

**Technique**

- Les valeurs énumérées (`visibility`, `scope_type`, `slot`, `role`, `status`) sont validées par Pydantic mais ne sont pas contraintes en base par des types `ENUM` ou des contraintes `CHECK`. Une écriture directe en SQL peut donc introduire une valeur invalide.
- Aucun index explicite n'est déclaré en dehors des clés primaires, des clés étrangères et des contraintes d'unicité. Les filtres fréquents (`recipes.scope_type`, `recipes.visibility`, `meal_plan_entries.date`) pourraient en bénéficier.
- Les jetons JWT ne sont ni révocables ni renouvelables : la déconnexion se limite à effacer le `localStorage`, un jeton volé reste valide jusqu'à son expiration, soit 24 heures avec la configuration par défaut.
- Le code utilise `datetime.utcnow()`, déprécié depuis Python 3.12 au profit de `datetime.now(timezone.utc)`.
- L'engine SQLAlchemy est instancié à l'import de `app.db.session`, ce qui impose la présence du pilote PostgreSQL même pour exécuter la suite de tests.
- La variable `S3_SECURE` est lue par la configuration mais n'est utilisée nulle part.
- Aucune intégration continue et aucun test frontend.
