import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiFetch, getToken } from '../lib/api';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Tag from '../components/ui/Tag';
import { GRADS, grad } from '../lib/shared';
import SearchBar from '../components/recipes/SearchBar';

function CardItem({ r }) {
  return (
    <Link to={`/recipes/${r.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
      <Card className="ui-card-interactive" style={{ textAlign: 'left', cursor: 'pointer' }}>
        <div
          className="recipe-card-img-wrapper"
          style={{
            background: r.image_url
              ? `url(${r.image_url}) center/cover no-repeat`
              : grad(r.id),
          }}
        >
          {r.image_url && (
            <img
              src={r.image_url}
              alt={r.title}
              className="recipe-card-img"
              style={{ opacity: 0 }}
            />
          )}
        </div>
        <div style={{ padding: 'var(--space-lg)' }}>
          <h3 style={{ color: 'var(--color-text-primary)', marginBottom: '8px' }}>
            {r.title}
          </h3>
          {r.description && (
            <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)', marginBottom: '12px' }}>
              {r.description}
            </p>
          )}
          <div className="recipe-card-meta">
            {r.prep_time_minutes && <span>{r.prep_time_minutes} min prep.</span>}
            {r.cook_time_minutes && <span>{r.cook_time_minutes} min cuisson</span>}
            {r.servings && <span>{r.servings} pers.</span>}
          </div>
          {r.tags && r.tags.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '8px' }}>
              {r.tags.map((tag) => (
                <Tag key={tag.id} variant="primary">{tag.label}</Tag>
              ))}
            </div>
          )}
        </div>
      </Card>
    </Link>
  );
}

export default function GlobalRecipes() {
  const [items, setItems] = useState([]);
  const [busy, setBusy] = useState(true);
  const [err, setErr] = useState(null);
  const [path, setPath] = useState('/recipes/search?sort_by=created_at&sort_order=desc');
  const [seed, setSeed] = useState(null);
  const nav = useNavigate();

  useEffect(() => {
    const tok = getToken();
    if (!tok) {
      nav('/login', { replace: true });
      return;
    }

    apiFetch('/recipes/explore')
      .then((data) => {
        if (Array.isArray(data)) {
          const pubs = data.filter((s) =>
            !['Mes recettes', 'Mes recettes favorites', 'Recettes dans mes cookbooks'].some((p) =>
              s.title.startsWith(p)
            )
          );
          const flat = pubs.flatMap((s) => s.recipes);
          const dedup = [];
          const seen = new Set();
          for (const r of flat) {
            if (!seen.has(r.id)) { seen.add(r.id); dedup.push(r); }
          }
          setSeed(dedup);
        }
      })
      .catch(() => {})
      .finally(() => setBusy(false));
  }, [nav]);

  useEffect(() => {
    if (!path) return;
    let alive = true;
    setBusy(true);
    setErr(null);
    apiFetch(path)
      .then((data) => { if (alive) setItems(data); })
      .catch((e) => { if (alive) { setErr(e.message || 'Erreur de recherche.'); setItems([]); } })
      .finally(() => { if (alive) setBusy(false); });
    return () => { alive = false; };
  }, [path]);

  const list = items.length > 0 ? items : (seed || []);

  return (
    <>
      <div className="container" style={{ padding: '40px 20px' }}>
        <header style={{ marginBottom: '24px', textAlign: 'center' }}>
          <h1 style={{ color: 'var(--color-text-primary)', marginBottom: '8px' }}>Recettes Globales</h1>
          <p style={{ color: 'var(--color-text-muted)' }}>
            Explorez et filtrez les recettes partagées par la communauté
          </p>
        </header>

        <div style={{ maxWidth: '900px', margin: '0 auto 24px' }}>
          <SearchBar onSearch={setPath} />
        </div>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '32px' }}>
          <Link to="/recipes/new">
            <Button variant="primary">Nouvelle recette</Button>
          </Link>
          <Link to="/my-recipes">
            <Button variant="secondary">Mes Recettes</Button>
          </Link>
        </div>

        {busy && (
          <div className="stagger-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--space-lg)' }}>
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <Card key={n} style={{ padding: '24px', textAlign: 'left', minHeight: '180px' }}>
                <div style={{ width: '80%', height: '20px', backgroundColor: 'var(--color-bg-disabled)', borderRadius: 'var(--radius-sm)', marginBottom: '12px' }} />
                <div style={{ width: '60%', height: '16px', backgroundColor: 'var(--color-bg-disabled)', borderRadius: 'var(--radius-sm)' }} />
              </Card>
            ))}
          </div>
        )}

        {err && (
          <Card style={{ padding: '48px', maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
            <p style={{ color: 'var(--color-border-error)' }}>{err}</p>
          </Card>
        )}

        {!busy && !err && list.length === 0 && (
          <Card style={{ padding: '48px', maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
            <p style={{ color: 'var(--color-text-muted)' }}>
              Aucune recette trouvée. Essayez d'autres filtres.
            </p>
          </Card>
        )}

        {!busy && !err && list.length > 0 && (
          <div className="page-enter stagger-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--space-lg)' }}>
            {list.map((recipe) => (
              <CardItem key={recipe.id} r={recipe} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}