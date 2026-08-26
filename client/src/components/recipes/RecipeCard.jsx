import React, { useState } from 'react';
import Card from '../ui/Card';
import Tag from '../ui/Tag';
import { grad } from '../../lib/shared';

export default function RecipeCard({
  recipe,
  title,
  imageUrl,
  prepTime,
  cookTime,
  servings,
  tags = [],
  description,
  isFavoriteInit = false,
  onToggleFavorite,
  onClick,
}) {
  const rTitle = recipe?.title || title || '';
  const rImage = recipe?.image_url || imageUrl || null;
  const rPrep = recipe?.prep_time_minutes ?? prepTime;
  const rCook = recipe?.cook_time_minutes ?? cookTime;
  const rServings = recipe?.servings ?? servings;
  const rTags = recipe?.tags ? recipe.tags.map((t) => (typeof t === 'string' ? t : t.label)) : tags;
  const rDesc = recipe?.description || description;
  const rId = recipe?.id;

  const [isFavorite, setIsFavorite] = useState(recipe?.is_favorite ?? isFavoriteInit);

  const handleFavorite = (e) => {
    e.stopPropagation();
    setIsFavorite(!isFavorite);
    if (onToggleFavorite) onToggleFavorite(recipe || { title: rTitle });
  };

  return (
    <Card interactive={!!onClick} onClick={onClick}>
      <div
        className="recipe-card-img-wrapper"
        style={{
          background: rImage
            ? `url(${rImage}) center/cover no-repeat`
            : grad(rId || rTitle),
        }}
      >
        {rImage && (
          <img
            src={rImage}
            alt={rTitle}
            className="recipe-card-img"
            style={{ opacity: 0 }}
          />
        )}
        {onToggleFavorite && (
          <button
            className={'recipe-card-favorite-btn' + (isFavorite ? ' recipe-card-favorite-btn-active' : '')}
            onClick={handleFavorite}
            aria-label={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
          >
            <svg viewBox="0 0 24 24">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </button>
        )}
      </div>
      <Card.Body>
        <h4 className="recipe-card-title">{rTitle}</h4>
        {rDesc && (
          <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)', marginBottom: '8px' }}>
            {rDesc}
          </p>
        )}
        <div className="recipe-card-meta" style={{ marginBottom: '0.75rem' }}>
          {rPrep != null && <span>{rPrep} min prep.</span>}
          {rCook != null && <span>{rCook} min cuisson</span>}
          {rServings != null && <span>{rServings} pers.</span>}
        </div>
        {rTags.length > 0 && (
          <div className="recipe-card-tags">
            {rTags.map((tag, i) => (
              <Tag key={i} variant="primary">
                {tag}
              </Tag>
            ))}
          </div>
        )}
      </Card.Body>
    </Card>
  );
}