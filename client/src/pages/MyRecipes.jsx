import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiFetch, getToken } from '../lib/api';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Tag from '../components/ui/Tag';
import { GRADS, grad } from '../lib/shared';

function CardItem({ r, flip }) {
  const pub = r.visibility === 'public';
  const [spinning, setSpinning] = useState(false);

  const doFlip = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setSpinning(true);
    try {
      const nv = pub ? 'private' : 'public';
      await apiFetch(`/recipes/${r.id}`, {
        method: 'PATCH',
        body: { visibility: nv },
      });
      flip(r.id, nv);
    } finally {
      setSpinning(false);
    }
  };

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
          <Tag
            variant={pub ? 'secondary' : 'muted'}
            style={{ position: 'absolute', top: '8px', right: '8px' }}
          >
            {pub ? 'Public' : 'Privé'}
          </Tag>
          {r.scope_type === 'cookbook' && (
            <Tag
              variant="secondary"
              style={{ position: 'absolute', top: '8px', left: '8px' }}
            >
              Cookbook
            </Tag>
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
          <div style={{ marginTop: '12px' }}>
            <Button
              variant="secondary"
              onClick={doFlip}
              disabled={spinning}
              style={{ fontSize: 'var(--font-size-xs)', padding: '6px 12px' }}
            >
              {spinning ? '...' : pub ? 'Passer en privé' : 'Rendre public'}
            </Button>
          </div>
        </div>
      </Card>
    </Link>
  );
}

export default function MyRecipes() {
  const [items, setItems] = useState([]);
  const [busy, setBusy] = useState(true);
  const [err, setErr] = useState(null);
  const nav = useNavigate();

  useEffect(() => {
    const tok = getToken();
    if (!tok) {
      nav('/login', { replace: true });
      return;
    }

    setBusy(true);
    setErr(null);
    apiFetch('/users/me/recipes')
      .then(setItems)
      .catch((e) => setErr(e.message || 'Erreur lors du chargement des recettes.'))
      .finally(() => setBusy(false));
  }, [nav]);

  const flip = (id, vis) => {
    setItems((prev) =>
      prev.map((r) => (r.id === id ? { ...r, visibility: vis } : r))
    );
  };

  return (
    <>
      <div className="container" style={{ padding: '40px 20px' }}>
        <header style={{ marginBottom: '32px', textAlign: 'center' }}>
          <h1 style={{ color: 'var(--color-text-primary)', marginBottom: '8px' }}>Mes Recettes</h1>
          <p style={{ color: 'var(--color-text-muted)' }}>
            Gérez toutes vos recettes (personnelles et cookbooks)
          </p>
          <div style={{ marginTop: '16px' }}>
            <Link to="/recipes/new">
              <Button variant="primary">Nouvelle recette</Button>
            </Link>
          </div>
        </header>

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

        {!busy && !err && items.length === 0 && (
          <Card style={{ padding: '48px', maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
            <p style={{ color: 'var(--color-text-muted)' }}>
              Aucune recette. Créez-en une ou rejoignez un cookbook !
            </p>
          </Card>
        )}

        {!busy && !err && items.length > 0 && (
          <div className="page-enter stagger-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--space-lg)' }}>
            {items.map((recipe) => (
              <CardItem key={recipe.id} r={recipe} flip={flip} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}