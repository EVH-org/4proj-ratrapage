import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getToken } from '../lib/api';
import { logout } from '../lib/auth';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card from '../components/ui/Card';
import Tag from '../components/ui/Tag';
import RecipeCard from '../components/recipes/RecipeCard';

export default function UiKitDemo() {
  const navigate = useNavigate();
  const isLoggedIn = !!getToken();

  const handleAuthAction = () => {
    if (isLoggedIn) {
      logout();
      window.location.reload();
    } else {
      navigate('/login');
    }
  };

  const [testInputNormal, setTestInputNormal] = useState('');
  const [testInputError, setTestInputError] = useState('oups@cuisine');
  const [portionsCount, setPortionsCount] = useState(4);

  const dummyRecipes = [
    {
      title: 'Gauffres belges croustillantes et légères de grand-mère',
      imageUrl: 'https://images.unsplash.com/photo-1562376502-6f769499c886?auto=format&fit=crop&q=80&w=600',
      time: '25 min',
      servings: '4 pers',
      tags: ['Coup de ❤️', 'Dessert', 'Pastry', 'Facile'],
      isFavoriteInit: true,
    },
    {
      title: 'Tartine Avocat, Oeuf Poché & Graines de Sésame BIO',
      imageUrl: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&q=80&w=600',
      time: '15 min',
      servings: '2 pers',
      tags: ['Végétarien', 'Healthy', 'Petit-Déj'],
      isFavoriteInit: false,
    },
    {
      title: 'Pizza Napolitaine authentique au Feu de Bois',
      imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&q=80&w=600',
      time: '45 min',
      servings: '3 pers',
      tags: ['Salty', 'Italien', 'Comfort Food'],
      isFavoriteInit: false,
    },
    {
      title: 'Ramen Crémeux au Tofu Croustillant et shiitakés',
      imageUrl: '',
      time: '35 min',
      servings: '2 pers',
      tags: ['Végétarien', 'Asiatique', 'Midi Rapide'],
      isFavoriteInit: true,
    },
  ];

  return (
    <div style={{ minHeight: '100vh', paddingBottom: '4rem' }}>
      <header
        style={{
          borderBottom: '1px solid var(--color-border-subtle)',
          backgroundColor: 'var(--color-bg-surface)',
          padding: '2rem var(--space-xl)',
          marginBottom: '2rem',
        }}
      >
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ color: 'var(--color-primary)', display: 'inline', fontSize: '2rem' }}>
                Marmiton<span style={{ color: 'var(--color-accent-warm)' }}>Pinterest</span> UI
              </h1>
            </div>
          </div>
          <nav style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <Link to="/" style={{ color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 'var(--font-weight-bold)' }}>
              Styleguide
            </Link>
            {isLoggedIn && (
              <Link to="/cookbooks" style={{ color: 'var(--color-text-muted)', textDecoration: 'none', fontWeight: 'var(--font-weight-semibold)' }}>
                Cookbooks
              </Link>
            )}
          </nav>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Tag variant="primary">v1.1.0</Tag>
            {isLoggedIn ? (
              <Button variant="ghost" onClick={handleAuthAction} style={{ padding: '0.5rem 1rem' }}>
                Déconnexion
              </Button>
            ) : (
              <Button variant="primary" onClick={handleAuthAction} style={{ padding: '0.5rem 1rem' }}>
                Connexion
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="container" style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
        
        {/* 🎨 1. COLORS PALETTE DECK */}
        <section>
          <h2 style={{ marginBottom: '1.5rem' }}>🎨 Palette de Couleurs</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
            <Card>
              <div style={{ height: '80px', backgroundColor: 'var(--color-primary)' }} />
              <Card.Body style={{ padding: '1rem' }}>
                <strong style={{ display: 'block' }}>Primary (Tomato Coral)</strong>
                <code style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>#E23E2A</code>
                <p style={{ fontSize: '0.875rem', marginTop: '0.25rem' }}>Boutons CTA, branding principal.</p>
              </Card.Body>
            </Card>

            <Card>
              <div style={{ height: '80px', backgroundColor: 'var(--color-accent-warm)' }} />
              <Card.Body style={{ padding: '1rem' }}>
                <strong style={{ display: 'block' }}>Accent Warm (Honey)</strong>
                <code style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>#E69112</code>
                <p style={{ fontSize: '0.875rem', marginTop: '0.25rem' }}>Favoris, ratings, tags sucrés.</p>
              </Card.Body>
            </Card>

            <Card>
              <div style={{ height: '80px', backgroundColor: 'var(--color-accent-fresh)' }} />
              <Card.Body style={{ padding: '1rem' }}>
                <strong style={{ display: 'block' }}>Accent Fresh (Basil)</strong>
                <code style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>#2A804E</code>
                <p style={{ fontSize: '0.875rem', marginTop: '0.25rem' }}>Végétarien, sain, bio.</p>
              </Card.Body>
            </Card>

            <Card>
              <div style={{ height: '80px', backgroundColor: 'var(--color-bg-page)', borderBottom: '1px solid var(--color-border-subtle)' }} />
              <Card.Body style={{ padding: '1rem' }}>
                <strong style={{ display: 'block' }}>Neutre Eggshell (Sand)</strong>
                <code style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>#FAF9F6</code>
                <p style={{ fontSize: '0.875rem', marginTop: '0.25rem' }}>Fond de page chaleureux.</p>
              </Card.Body>
            </Card>
          </div>
        </section>

        {/* 🔘 2. ATOMIC ELEMENTS TEST */}
        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
          
          {/* Buttons Playground */}
          <Card>
            <Card.Header>
              <h3>🔘 Boutons</h3>
            </Card.Header>
            <Card.Body style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                <Button variant="primary">Bouton Principal</Button>
                <Button variant="primary" disabled>Désactivé</Button>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                <Button variant="secondary">Bouton Secondaire</Button>
                <Button variant="ghost">Bouton Fantôme</Button>
              </div>
              <div style={{ borderTop: '1px solid var(--color-border-subtle)', paddingTop: '1rem' }}>
                <p style={{ fontStyle: 'italic', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                  Hauteur de clic minimum : 44px (excellent pour mobile)
                </p>
              </div>
            </Card.Body>
          </Card>

          {/* Form Interactive Playground */}
          <Card>
            <Card.Header>
              <h3>📝 Formulaires & Saisie</h3>
            </Card.Header>
            <Card.Body style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <Input
                label="Nom de l'ingrédient"
                placeholder="Ex: Chocolat noir pâtissier..."
                value={testInputNormal}
                onChange={(e) => setTestInputNormal(e.target.value)}
                helperText="Précisez le pourcentage de cacao si nécessaire."
              />
              <Input
                label="Adresse E-mail"
                value={testInputError}
                onChange={(e) => setTestInputError(e.target.value)}
                error={testInputError.includes('@') && testInputError.split('@')[1]?.includes('.') ? '' : 'Veuillez saisir un e-mail valide (ex: chef@cuisine.fr)'}
              />
            </Card.Body>
          </Card>
        </section>

        {/* 🏷 3. CHIPS & BADGES */}
        <section>
          <Card>
            <Card.Body style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.5rem', padding: '1.5rem' }}>
              <div>
                <h3>🏷 Chips & Badges de catégorie</h3>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                  Des couleurs gourmandes adaptées aux tags de recettes.
                </p>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <Tag variant="primary">Chocolat 🍫</Tag>
                <Tag variant="secondary">Végétarien 🌿</Tag>
                <Tag variant="warm">Coup de foudre ❤️</Tag>
                <Tag variant="muted">20 min 🕒</Tag>
              </div>
            </Card.Body>
          </Card>
        </section>

        {/* 🎴 4. PINTEREST & MARMITON GRID */}
        <section>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
            <div>
              <h2>🎴 Cards & Grille Type Pinterest</h2>
              <p style={{ color: 'var(--color-text-muted)' }}>
                Visual-first, zoom d'image au survol, favori interactif et tags intelligents.
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', backgroundColor: 'var(--color-bg-surface)', borderRadius: 'var(--radius-full)', border: '1px solid var(--color-border-subtle)' }}>
              <span style={{ fontSize: '0.875rem', fontWeight: 'var(--font-weight-semibold)' }}>Portions :</span>
              <button onClick={() => setPortionsCount(p => Math.max(1, p - 1))} className="ui-btn-ghost" style={{ padding: '2px 8px', borderRadius: '4px', cursor: 'pointer' }}>-</button>
              <strong style={{ minWidth: '40px', textAlign: 'center' }}>{portionsCount} pers</strong>
              <button onClick={() => setPortionsCount(p => p + 1)} className="ui-btn-ghost" style={{ padding: '2px 8px', borderRadius: '4px', cursor: 'pointer' }}>+</button>
            </div>
          </div>

          <div className="recipe-grid">
            {dummyRecipes.map((recipe, index) => (
              <RecipeCard
                key={index}
                title={recipe.title}
                imageUrl={recipe.imageUrl}
                time={recipe.time}
                servings={`${portionsCount} pers`}
                tags={recipe.tags}
                isFavoriteInit={recipe.isFavoriteInit}
                onCardClick={() => alert(`Clic sur la recette : "${recipe.title}"`)}
              />
            ))}
          </div>
        </section>

      </main>

      <footer style={{ marginTop: '4rem', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
        <p>© 2026 CookBook Design System. Fait avec passion et gourmandise 🍕</p>
      </footer>
    </div>
  );
}
