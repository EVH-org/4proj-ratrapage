import React, { useState } from 'react';
import Card from '../ui/Card';
import Tag from '../ui/Tag';
import '../../styles/globals.css';

export default function RecipeCard({ recipe, title, imageUrl, time, servings, tags = [], isFavoriteInit, onToggleFavorite, onAddToPlanning, onCardClick }) {
  const [isFavorite, setIsFavorite] = useState(isFavoriteInit || false);

  if (recipe) {
    const {
      title: rTitle,
      ingredients = [],
      steps = [],
      prepTime,
      cookingTime,
      servings: rServings,
      tags: rTags = [],
      image,
      source,
      isFavorite: rIsFavorite
    } = recipe;

    return (
      <div className="recipe-card" style={{
        border: '1px solid var(--border)',
        borderRadius: '8px',
        background: 'var(--bg)',
        color: 'var(--text)',
        textAlign: 'left',
        overflow: 'hidden',
        boxShadow: 'var(--shadow)',
        display: 'flex',
        flexDirection: 'column',
        maxWidth: '400px'
      }}>
        {image && (
          <div className="recipe-image-wrapper" style={{ height: '200px', overflow: 'hidden' }}>
            <img src={image} alt={rTitle} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        )}

        <div className="recipe-content" style={{ padding: '16px', flexGrow: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <h3 style={{ color: 'var(--text-h)', margin: 0, fontSize: '20px' }}>{rTitle}</h3>
            <button
              onClick={() => onToggleFavorite?.(recipe)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '20px',
                color: rIsFavorite ? '#ef4444' : 'var(--text)'
              }}
              title={rIsFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
            >
              {rIsFavorite ? '\u2764\uFE0F' : '\uD83E\uDD0D'}
            </button>
          </div>

          <div style={{ display: 'flex', gap: '16px', fontSize: '14px', marginBottom: '12px', color: 'var(--text)' }}>
            {prepTime && <span>\u23F1\uFE0F Pr\u00E9paration: {prepTime} min</span>}
            {cookingTime && <span>\uD83C\uDF73 Cuisson: {cookingTime} min</span>}
            {rServings && <span>\uD83D\uDC65 {rServings} pers.</span>}
          </div>

          {rTags.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px' }}>
              {rTags.map((tag, index) => (
                <span key={index} style={{
                  background: 'var(--accent-bg)',
                  color: 'var(--accent)',
                  border: '1px solid var(--accent-border)',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  fontSize: '12px'
                }}>
                  {tag}
                </span>
              ))}
            </div>
          )}

          {ingredients.length > 0 && (
            <div style={{ marginBottom: '12px' }}>
              <strong style={{ color: 'var(--text-h)', fontSize: '14px' }}>Ingr\u00E9dients principaux :</strong>
              <p style={{ fontSize: '14px', marginTop: '4px' }}>
                {ingredients.slice(0, 3).map(i => `${i.name}`).join(', ')}
                {ingredients.length > 3 && '...'}
              </p>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
            {source ? (
              <a href={source} target="_blank" rel="noopener noreferrer" style={{ fontSize: '12px', color: 'var(--accent)', textDecoration: 'none' }}>
                Voir la source \uD83D\uDD17
              </a>
            ) : <span style={{ fontSize: '12px', color: 'var(--text)' }}>Cr\u00E9ation maison</span>}

            <button
              onClick={() => onAddToPlanning?.(recipe)}
              style={{
                background: 'var(--code-bg)',
                color: 'var(--text-h)',
                border: '1px solid var(--border)',
                padding: '6px 12px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              \uD83D\uDCC5 Planifier
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Card interactive={!!onCardClick} onClick={onCardClick}>
      <div className="recipe-card-img-wrapper">
        {imageUrl ? (
          <img
            className="recipe-card-img"
            src={imageUrl}
            alt={title}
            loading="lazy"
          />
        ) : (
          <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, var(--color-bg-disabled) 0%, var(--color-bg-page) 100%)',
            fontSize: '3rem'
          }}>
            \uD83C\uDF73
          </div>
        )}
        <button
          className={'recipe-card-favorite-btn' + (isFavorite ? ' recipe-card-favorite-btn-active' : '')}
          onClick={(e) => {
            e.stopPropagation();
            setIsFavorite(!isFavorite);
          }}
          aria-label={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
        >
          <svg viewBox="0 0 24 24">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </button>
      </div>
      <Card.Body>
        <h4 className="recipe-card-title">{title}</h4>
        <div className="recipe-card-meta" style={{ marginBottom: '0.75rem' }}>
          <span>\u23F1\uFE0F {time}</span>
          <span>\uD83D\uDC65 {servings}</span>
        </div>
        {tags.length > 0 && (
          <div className="recipe-card-tags">
            {tags.map((tag, i) => (
              <Tag key={i} variant={i === 0 ? 'warm' : i % 2 === 0 ? 'secondary' : 'muted'}>
                {tag}
              </Tag>
            ))}
          </div>
        )}
      </Card.Body>
    </Card>
  );
}