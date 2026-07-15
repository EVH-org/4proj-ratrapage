import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/ui/Button';

export default function NotFound() {
  return (
    <div className="container" style={{ padding: '80px 20px', textAlign: 'center' }}>
      <h1 style={{
        fontSize: 'clamp(4rem, 10vw, 8rem)',
        fontWeight: 800,
        color: 'var(--color-primary)',
        marginBottom: '8px',
        opacity: 0.3,
      }}>
        404
      </h1>
      <h2 style={{
        color: 'var(--color-text-primary)',
        marginBottom: '16px',
        fontSize: 'var(--font-size-2xl)',
      }}>
        Page introuvable
      </h2>
      <p style={{
        color: 'var(--color-text-muted)',
        marginBottom: '32px',
        maxWidth: '400px',
        margin: '0 auto 32px',
      }}>
        La page que vous cherchez n'existe pas ou a été déplacée.
      </p>
      <Link to="/">
        <Button variant="primary">Retour à l'accueil</Button>
      </Link>
    </div>
  );
}