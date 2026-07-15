# SUPMEAL (4proj-ratrapage)

## Lancer en local (Docker)
- API: http://localhost:8000 (health: /health, docs: /docs)
- Web: http://localhost:5173

### Commande
docker compose up --build

### Stop
Ctrl+C puis: docker compose down

## Notes techniques
- Les appels API doublés en `npm run dev` sont dus au StrictMode de React (double invocation des effets en développement). En production (`npm run build` + `npm run preview`), chaque requête ne part qu'une seule fois.
