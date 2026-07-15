import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { apiFetch, getToken } from '../lib/api';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Tag from '../components/ui/Tag';
import ImageUploader from '../components/recipes/ImageUploader';

export default function RecipeDetailPage() {
  const { recipeId } = useParams();
  const navigate = useNavigate();
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [imageUrl, setImageUrl] = useState(null);
  const [isOwner, setIsOwner] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      navigate('/login', { replace: true });
      return;
    }

    apiFetch('/users/me')
      .then((u) => setCurrentUserId(u.id))
      .catch(() => {});

    apiFetch(`/recipes/${recipeId}`)
      .then((data) => {
        setRecipe(data);
        setImageUrl(data.image_url || null);
        setIsFavorite(data.is_favorite || false);
      })
      .catch((err) => setError(err.message || 'Erreur de chargement'))
      .finally(() => setLoading(false));
  }, [recipeId, navigate]);

  useEffect(() => {
    if (recipe && currentUserId) {
      const owns = recipe.owner_user_id === currentUserId || recipe.created_by_user_id === currentUserId;
      setIsOwner(owns);
    }
  }, [recipe, currentUserId]);

  const fav = async () => {
    try {
      if (isFavorite) {
        await apiFetch(`/recipes/${recipeId}/favorite`, { method: 'DELETE' });
        setIsFavorite(false);
      } else {
        await apiFetch(`/recipes/${recipeId}/favorite`, { method: 'POST' });
        setIsFavorite(true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const del = async () => {
    if (!window.confirm('Supprimer cette recette ?')) return;
    try {
      await apiFetch(`/recipes/${recipeId}`, { method: 'DELETE' });
      navigate('/recipes', { replace: true });
    } catch (err) {
      setError(err.message || 'Erreur suppression');
    }
  };

  if (loading) {
    return (
      <>
        <div className="container" style={{ padding: '40px 0', textAlign: 'center' }}>
          <p>Chargement...</p>
        </div>
      </>
    );
  }

  if (error || !recipe) {
    return (
      <>
        <div className="container" style={{ padding: '40px 0', textAlign: 'center' }}>
          <p style={{ color: 'var(--color-border-error)' }}>{error || 'Recette introuvable.'}</p>
          <Link to="/recipes"><Button variant="primary">Mes recettes</Button></Link>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="container" style={{ padding: '40px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ color: 'var(--color-text-primary)', marginBottom: '8px' }}>{recipe.title}</h1>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
              {recipe.visibility && (
                <span style={{
                  fontSize: 'var(--font-size-xs)',
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: recipe.visibility === 'public' ? 'var(--color-success-bg)' : 'var(--color-bg-disabled)',
                  color: recipe.visibility === 'public' ? 'var(--color-success-text)' : 'var(--color-text-muted)',
                  fontWeight: 600,
                }}>
                  {recipe.visibility === 'public' ? 'Publique' : 'Privee'}
                </span>
              )}
              {recipe.description && (
                <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)', margin: 0 }}>
                  {recipe.description}
                </p>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {isOwner && (
              <>
                <Link to={`/recipes/${recipeId}/edit`}>
                  <Button variant="secondary">Modifier</Button>
                </Link>
                <Button variant="ghost" style={{ color: 'var(--color-border-error)' }} onClick={del}>
                  Supprimer
                </Button>
              </>
            )}
            <Button variant="ghost" onClick={fav}>
              {isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
            </Button>
          </div>
        </div>

        {isOwner && (
          <Card style={{ padding: 'var(--space-xl)', marginBottom: '24px' }}>
            <h3 style={{ color: 'var(--color-primary)', marginBottom: '12px' }}>Photo de la recette</h3>
            <ImageUploader
              recipeId={recipeId}
              currentImageUrl={imageUrl}
              onImageChange={(url) => setImageUrl(url)}
            />
          </Card>
        )}

        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '24px' }}>
          {recipe.prep_time_minutes && (
            <Card style={{ padding: 'var(--space-md)', textAlign: 'center', minWidth: '100px' }}>
              <div style={{ fontWeight: 700, fontSize: 'var(--font-size-lg)' }}>{recipe.prep_time_minutes}</div>
              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>min prep.</div>
            </Card>
          )}
          {recipe.cook_time_minutes && (
            <Card style={{ padding: 'var(--space-md)', textAlign: 'center', minWidth: '100px' }}>
              <div style={{ fontWeight: 700, fontSize: 'var(--font-size-lg)' }}>{recipe.cook_time_minutes}</div>
              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>min cuisson</div>
            </Card>
          )}
          {recipe.servings && (
            <Card style={{ padding: 'var(--space-md)', textAlign: 'center', minWidth: '100px' }}>
              <div style={{ fontWeight: 700, fontSize: 'var(--font-size-lg)' }}>{recipe.servings}</div>
              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>personnes</div>
            </Card>
          )}
          {recipe.source_url && (
            <Card style={{ padding: 'var(--space-md)', textAlign: 'center', minWidth: '100px' }}>
              <a href={recipe.source_url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary)', fontSize: 'var(--font-size-sm)' }}>
                Source
              </a>
            </Card>
          )}
        </div>

        {recipe.tags && recipe.tags.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '24px' }}>
            {recipe.tags.map((tag) => (
              <Tag key={tag.id} variant="primary">{tag.label}</Tag>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {recipe.ingredients && recipe.ingredients.length > 0 && (
            <Card style={{ padding: 'var(--space-xl)' }}>
              <h3 style={{ color: 'var(--color-primary)', marginBottom: '16px' }}>Ingredients</h3>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {recipe.ingredients.map((ing) => (
                  <li key={ing.id} style={{ padding: '8px 0', borderBottom: '1px solid var(--color-border-subtle)', display: 'flex', gap: '8px' }}>
                    <span style={{ fontWeight: 600, minWidth: '60px' }}>
                      {ing.quantity ? `${ing.quantity} ${ing.unit || ''}` : ''}
                    </span>
                    <span>{ing.name}</span>
                    {ing.note && <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)' }}>({ing.note})</span>}
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {recipe.steps && recipe.steps.length > 0 && (
            <Card style={{ padding: 'var(--space-xl)' }}>
              <h3 style={{ color: 'var(--color-primary)', marginBottom: '16px' }}>Etapes</h3>
              <ol style={{ paddingLeft: '20px', margin: 0 }}>
                {recipe.steps.map((step) => (
                  <li key={step.id} style={{ padding: '12px 0', borderBottom: '1px solid var(--color-border-subtle)', lineHeight: '1.6' }}>
                    {step.instruction}
                  </li>
                ))}
              </ol>
            </Card>
          )}
        </div>

        <div style={{ marginTop: '32px', display: 'flex', gap: '12px' }}>
          <Link to="/recipes">
            <Button variant="secondary">Retour aux recettes</Button>
          </Link>
        </div>
      </div>
    </>
  );
}