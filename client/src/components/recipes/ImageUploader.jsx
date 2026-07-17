import React, { useState, useRef } from 'react';
import { apiFetch } from '../../lib/api';
import { X, Image, Camera } from 'lucide-react';

export default function ImageUploader({ recipeId, currentImageUrl, onImageChange }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const up = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ok = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!ok.includes(file.type)) {
      setError('Format non supporte. Utilisez JPEG, PNG, WebP ou GIF.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('Image trop volumineuse. Maximum 10 Mo.');
      return;
    }

    setError('');
    setUploading(true);

    try {
      const presignData = await apiFetch(`/recipes/${recipeId}/image/presign`, {
        method: 'POST',
        body: { filename: file.name, content_type: file.type },
      });

      const uploadRes = await fetch(presignData.upload_url, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      });

      if (!uploadRes.ok) throw new Error('Echec du televersement vers le stockage.');

      const updatedRecipe = await apiFetch(`/recipes/${recipeId}`);
      if (onImageChange) onImageChange(updatedRecipe.image_url || null);
    } catch (err) {
      setError(err.message || 'Erreur lors du televersement.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const del = async () => {
    if (!window.confirm('Supprimer cette image ?')) return;
    setUploading(true);
    try {
      await apiFetch(`/recipes/${recipeId}/image`, { method: 'DELETE' });
      if (onImageChange) onImageChange(null);
    } catch (err) {
      setError(err.message || 'Erreur lors de la suppression.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {currentImageUrl && (
        <div style={{ position: 'relative', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
          <img src={currentImageUrl} alt="Apercu" className="img-zoom-wrapper" style={{ width: '100%', maxHeight: '300px', objectFit: 'cover', borderRadius: 'var(--radius-md)', display: 'block' }} />
          <button type="button" onClick={del} disabled={uploading} style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', borderRadius: 'var(--radius-full)', width: '36px', height: '36px', cursor: 'pointer', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }} onMouseEnter={(e) => (e.target.style.background = 'rgba(211,47,47,0.8)')} onMouseLeave={(e) => (e.target.style.background = 'rgba(0,0,0,0.6)')} title="Supprimer l'image">
            <X size={18} />
          </button>
        </div>
      )}

      <div onClick={() => fileInputRef.current?.click()} style={{ border: `2px dashed ${currentImageUrl ? 'var(--color-border-subtle)' : 'var(--color-primary)'}`, borderRadius: 'var(--radius-md)', padding: currentImageUrl ? '12px' : '32px', textAlign: 'center', cursor: uploading ? 'not-allowed' : 'pointer', transition: 'all 0.2s ease', background: currentImageUrl ? 'transparent' : 'var(--color-primary-light)', opacity: uploading ? 0.6 : 1 }} onMouseEnter={(e) => { if (!uploading) { e.currentTarget.style.borderColor = 'var(--color-primary)'; e.currentTarget.style.background = 'var(--color-primary-light)'; } }} onMouseLeave={(e) => { if (!uploading && currentImageUrl) { e.currentTarget.style.borderColor = 'var(--color-border-subtle)'; e.currentTarget.style.background = 'transparent'; } }}>
        <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={up} style={{ display: 'none' }} disabled={uploading} />
        {uploading ? (
          <span style={{ color: 'var(--color-text-muted)', fontWeight: 500 }}>Televersement en cours...</span>
        ) : (
          <span style={{ color: 'var(--color-primary)', fontWeight: 600, fontSize: 'var(--font-size-sm)' }}>
            {currentImageUrl ? <><Image size={18} style={{ marginRight: '6px', verticalAlign: 'middle' }} />Changer l'image</> : <><Camera size={18} style={{ marginRight: '6px', verticalAlign: 'middle' }} />Cliquez pour ajouter une image</>}
          </span>
        )}
      </div>

      {error && (
        <p style={{ color: 'var(--color-border-error)', fontSize: 'var(--font-size-sm)', fontWeight: 500, background: 'var(--color-error-bg)', padding: '8px 12px', borderRadius: 'var(--radius-md)', margin: 0 }}>
          {error}
        </p>
      )}
    </div>
  );
}