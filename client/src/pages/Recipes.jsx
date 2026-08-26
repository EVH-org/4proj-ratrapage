import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiFetch, getToken } from '../lib/api';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import RecipeCard from '../components/recipes/RecipeCard';

export default function Recipes() {
  const [data, setData] = useState([]);
  const [busy, setBusy] = useState(true);
  const [err, setErr] = useState(null);
  const nav = useNavigate();

  useEffect(() => {
    const token = getToken();
    if (!token) {
      nav('/login', { replace: true });
      return;
    }

    const load = async () => {
      try {
        setBusy(true);
        setErr(null);
        const result = await apiFetch('/recipes/explore');
        setData(result);
      } catch (e) {
        setErr(e.message || 'Erreur lors du chargement des recettes.');
      } finally {
        setBusy(false);
      }
    };

    load();
  }, [nav]);

  return (
    <>
      <div className="container" style={{ padding: '40px 20px' }}>
        <header style={{ marginBottom: '32px', textAlign: 'center' }}>
          <h1 style={{ color: 'var(--color-text-primary)', marginBottom: '8px' }}>Recettes</h1>
          <p style={{ color: 'var(--color-text-muted)' }}>
            Explorez toutes vos recettes, classées par thème
          </p>
          <div style={{ marginTop: '16px', display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/recipes/new">
              <Button variant="primary">
                Nouvelle recette
              </Button>
            </Link>
          </div>
        </header>

        {busy && (
          <div>
            {[1, 2, 3].map((sectionIdx) => (
              <div key={sectionIdx} style={{ marginBottom: '48px' }}>
                <div style={{ width: '200px', height: '24px', backgroundColor: 'var(--color-bg-disabled)', borderRadius: 'var(--radius-sm)', marginBottom: '16px' }}></div>
                <div className="recipe-grid">
                  {[1, 2, 3].map((cardIdx) => (
                    <Card key={cardIdx} style={{ padding: '24px', textAlign: 'left', minHeight: '180px' }}>
                      <div style={{ width: '80%', height: '20px', backgroundColor: 'var(--color-bg-disabled)', borderRadius: 'var(--radius-sm)', marginBottom: '12px' }}></div>
                      <div style={{ width: '60%', height: '16px', backgroundColor: 'var(--color-bg-disabled)', borderRadius: 'var(--radius-sm)' }}></div>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {err && (
          <Card style={{ padding: '48px', maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
            <p style={{ color: 'var(--color-border-error)' }}>{err}</p>
          </Card>
        )}

        {!busy && !err && data.length === 0 && (
          <Card style={{ padding: '48px', maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
            <p style={{ color: 'var(--color-text-muted)' }}>
              Aucune recette pour le moment. Créez-en une !
            </p>
          </Card>
        )}

        {!busy && !err && data.length > 0 && (
          <div className="page-enter">
            {data.map((section, idx) => (
              <section key={idx} style={{ marginBottom: '32px' }}>
                <div style={{ marginBottom: '16px' }}>
                  <h2 style={{ color: 'var(--color-text-primary)', fontSize: 'var(--font-size-xl)', marginBottom: '4px' }}>
                    {section.title}
                  </h2>
                  {section.subtitle && (
                    <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)', margin: 0 }}>
                      {section.subtitle}
                    </p>
                  )}
                </div>
                <div
                  style={{
                    display: 'flex',
                    gap: '16px',
                    overflowX: 'auto',
                    overflowY: 'hidden',
                    paddingBottom: '12px',
                    scrollSnapType: 'x mandatory',
                    WebkitOverflowScrolling: 'touch',
                    scrollbarWidth: 'thin',
                  }}
                  className="recipe-horizontal-scroll"
                >
                  {section.recipes.map((recipe) => (
                    <div key={recipe.id} style={{ flex: '0 0 280px', scrollSnapAlign: 'start' }}>
                      <Link to={`/recipes/${recipe.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                        <RecipeCard recipe={recipe} onClick={() => {}} />
                      </Link>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </>
  );
}