import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch, getToken } from '../lib/api';
import { BookOpen, CalendarDays, PlusCircle, ChefHat } from 'lucide-react';

export default function Home() {
  const [items, setItems] = useState([]);
  const [busy, setBusy] = useState(true);
  const [on, setOn] = useState(false);

  useEffect(() => {
    setOn(true);
    const tok = getToken();
    if (!tok) {
      setBusy(false);
      return;
    }
    apiFetch('/recipes/explore')
      .then((data) => {
        if (Array.isArray(data)) {
          const perso = data.find((s) => s.title === 'Mes recettes');
          if (perso && perso.recipes) {
            const mix = [...perso.recipes].sort(() => 0.5 - Math.random());
            setItems(mix.slice(0, 4));
          }
        }
      })
      .catch(() => {})
      .finally(() => setBusy(false));
  }, []);

  return (
    <>
      <section
        className="hero-gradient"
        style={{
          position: 'relative',
          overflow: 'hidden',
          padding: '80px 20px 100px',
          textAlign: 'center',
        }}
      >
        <span className="floating-particle">🍕</span>
        <span className="floating-particle">🥗</span>
        <span className="floating-particle">🍝</span>
        <span className="floating-particle">🥘</span>
        <span className="floating-particle">🧁</span>
        <span className="floating-particle">🍲</span>

        <div
          className="container"
          style={{
            position: 'relative',
            zIndex: 2,
            opacity: on ? 1 : 0,
            transform: on ? 'translateY(0)' : 'translateY(20px)',
            transition: 'all 0.8s ease-out',
          }}
        >
          <h1
            className="animate-fade-in-down"
            style={{
              color: 'var(--color-text-inverse)',
              fontSize: 'clamp(2.5rem, 6vw, 4rem)',
              fontWeight: 800,
              letterSpacing: '-1.5px',
              lineHeight: 1.1,
              textShadow: '0 2px 20px rgba(0,0,0,0.15)',
            }}
          >
            SUPMEAL
          </h1>
          <p
            className="animate-fade-in-up delay-200"
            style={{
              color: 'rgba(255,255,255,0.85)',
              fontSize: 'var(--font-size-xl)',
              marginTop: '16px',
              maxWidth: '600px',
              margin: '16px auto 0',
              fontWeight: 500,
            }}
          >
            Gérez vos recettes, créez des cookbooks et partagez vos plats préférés.
          </p>

          <div
            className="animate-fade-in-up delay-400"
            style={{
              display: 'flex',
              gap: '16px',
              justifyContent: 'center',
              marginTop: '36px',
              flexWrap: 'wrap',
            }}
          >
            <Link to="/recipes/new">
              <button
                style={{
                  padding: '14px 32px',
                  fontSize: 'var(--font-size-base)',
                  fontWeight: 700,
                  borderRadius: 'var(--radius-full)',
                  border: 'none',
                  background: 'var(--color-bg-surface)',
                  color: 'var(--color-primary)',
                  cursor: 'pointer',
                  transition: 'all 0.25s ease',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.15)',
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 6px 25px rgba(0,0,0,0.2)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 4px 15px rgba(0,0,0,0.15)';
                }}
              >
                + Nouvelle recette
              </button>
            </Link>
            <Link to="/cookbooks">
              <button
                style={{
                  padding: '14px 32px',
                  fontSize: 'var(--font-size-base)',
                  fontWeight: 700,
                  borderRadius: 'var(--radius-full)',
                  border: '2px solid rgba(255,255,255,0.4)',
                  background: 'transparent',
                  color: 'var(--color-text-inverse)',
                  cursor: 'pointer',
                  transition: 'all 0.25s ease',
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'rgba(255,255,255,0.15)';
                  e.target.style.borderColor = 'rgba(255,255,255,0.6)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'transparent';
                  e.target.style.borderColor = 'rgba(255,255,255,0.4)';
                }}
              >
                Mes cookbooks
              </button>
            </Link>
          </div>
        </div>

        <div
          style={{
            position: 'absolute',
            bottom: -2,
            left: 0,
            right: 0,
            height: '60px',
            background: 'var(--color-bg-page)',
            borderRadius: '50% 50% 0 0',
          }}
        />
      </section>

      <div className="container page-enter delay-200" style={{ padding: '0 20px', marginTop: '-20px', position: 'relative', zIndex: 3 }}>
        <div className="stagger-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 'var(--space-xl)', padding: '20px 0' }}>
          <div className="ui-card hover-glow" style={{ padding: '32px 24px', textAlign: 'center', background: 'var(--color-bg-surface)' }}>
            <BookOpen size={40} color="var(--color-primary)" style={{ marginBottom: '12px' }} />
            <h3 style={{ color: 'var(--color-text-primary)', marginBottom: '8px', fontSize: 'var(--font-size-lg)' }}>Cookbooks</h3>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: '20px', fontSize: 'var(--font-size-sm)' }}>Vos livres de recettes partagés.</p>
            <Link to="/cookbooks">
              <button className="ui-btn ui-btn-primary" style={{ width: '100%' }}>Ouvrir</button>
            </Link>
          </div>

          <div className="ui-card hover-glow" style={{ padding: '32px 24px', textAlign: 'center', background: 'var(--color-bg-surface)' }}>
            <CalendarDays size={40} color="var(--color-primary)" style={{ marginBottom: '12px' }} />
            <h3 style={{ color: 'var(--color-text-primary)', marginBottom: '8px', fontSize: 'var(--font-size-lg)' }}>Planning</h3>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: '20px', fontSize: 'var(--font-size-sm)' }}>Repas de la semaine à venir.</p>
            <Link to="/planning">
              <button className="ui-btn ui-btn-primary" style={{ width: '100%' }}>Voir</button>
            </Link>
          </div>

          <div className="ui-card hover-glow" style={{ padding: '32px 24px', textAlign: 'center', background: 'var(--color-bg-surface)' }}>
            <PlusCircle size={40} color="var(--color-primary)" style={{ marginBottom: '12px' }} />
            <h3 style={{ color: 'var(--color-text-primary)', marginBottom: '8px', fontSize: 'var(--font-size-lg)' }}>Ajouter</h3>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: '20px', fontSize: 'var(--font-size-sm)' }}>Nouvelle recette personnelle.</p>
            <Link to="/recipes/new">
              <button className="ui-btn ui-btn-primary" style={{ width: '100%' }}>Créer</button>
            </Link>
          </div>
        </div>
      </div>

      {busy ? (
        <div className="container" style={{ marginTop: '60px', padding: '0 20px' }}>
          <h2 style={{ color: 'var(--color-text-primary)', marginBottom: '24px', textAlign: 'center' }}>
            Recettes du moment
          </h2>
          <div className="stagger-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 'var(--space-xl)', padding: '20px 0' }}>
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="ui-card" style={{ padding: 0, overflow: 'hidden' }}>
                <div className="skeleton-box" style={{ height: '180px', borderRadius: 0 }} />
                <div style={{ padding: 'var(--space-lg)' }}>
                  <div className="skeleton-box skeleton-title" />
                  <div className="skeleton-box skeleton-text" style={{ width: '60%' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : items.length > 0 ? (
        <section className="container" style={{ marginTop: '60px', padding: '0 20px 60px' }}>
          <h2
            className="animate-fade-in-up"
            style={{
              color: 'var(--color-text-primary)',
              marginBottom: '24px',
              textAlign: 'center',
              fontSize: 'var(--font-size-2xl)',
            }}
          >
            Recettes du moment
          </h2>
          <div className="stagger-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 'var(--space-xl)', padding: '20px 0' }}>
            {items.map((r) => (
              <Link
                key={r.id}
                to={`/recipes/${r.id}`}
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                <div className="ui-card hover-glow" style={{ padding: 0, overflow: 'hidden', cursor: 'pointer' }}>
                  <div
                    className="img-zoom-wrapper"
                    style={{
                      height: '200px',
                      background: r.image_url
                        ? `url(${r.image_url}) center/cover no-repeat`
                        : 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
                    }}
                  />
                  <div style={{ padding: 'var(--space-lg)' }}>
                    <h3 style={{ color: 'var(--color-text-primary)', marginBottom: '8px', fontSize: 'var(--font-size-lg)' }}>{r.title}</h3>
                    <p style={{ color: 'var(--color-text-muted)', marginBottom: '20px', fontSize: 'var(--font-size-sm)' }}>
                      {r.prep_time_minutes || r.prepTime
                        ? `${r.prep_time_minutes || r.prepTime} min de préparation.`
                        : ''}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : (
        <section className="container" style={{ marginTop: '60px', padding: '0 20px 60px', textAlign: 'center' }}>
          <div
            className="animate-fade-in-up ui-card"
            style={{
              padding: '48px',
              maxWidth: '500px',
              margin: '0 auto',
              color: 'var(--color-text-muted)',
            }}
          >
            <ChefHat size={48} color="var(--color-text-muted)" style={{ marginBottom: '16px' }} />
            <p>Aucune recette pour le moment. Créez-en une !</p>
          </div>
        </section>
      )}

      <footer
        className="animate-fade-in"
        style={{
          borderTop: '1px solid var(--color-border-subtle)',
          padding: '32px 20px',
          textAlign: 'center',
          color: 'var(--color-text-muted)',
          fontSize: 'var(--font-size-sm)',
        }}
      >
        <p>SUPMEAL &mdash; Gestion de recettes & cookbooks</p>
      </footer>
    </>
  );
}